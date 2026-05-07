# Viajax -- Creator Marketplace on Solana

An open-source marketplace where creators sell low-ticket digital products (guides, templates, courses, toolkits) with only a 3% platform fee. Payments settle in USDC on Solana Mainnet. Buyers pay with a credit card or a Solana wallet -- they never need to understand blockchain. Creators get paid automatically in USDC 7 days after each confirmed sale.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Architecture Diagram](#architecture-diagram)
3. [Product Creation Flow](#product-creation-flow)
4. [Payment Flow](#payment-flow)
5. [Payout Flow](#payout-flow)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Environment Variables](#environment-variables)
9. [Local Development](#local-development)
10. [Database Migrations](#database-migrations)
11. [Deployment](#deployment)
12. [API Reference](#api-reference)
13. [License](#license)

---

## How It Works

Viajax connects three actors:

- **Buyers** -- browse the marketplace, purchase products with credit card or Solana wallet.
- **Creators** -- sign up, upload ready products or generate new ones with AI, set a price, and receive USDC payouts.
- **Platform** -- orchestrates checkout, holds funds for 7 days, then releases 97% to the creator (3% fee retained).

Key principles:

- Blockchain is invisible to buyers. Card payments go through Crossmint which converts fiat to USDC behind the scenes.
- Creators receive USDC directly in their Solana wallet -- no bank, no intermediary.
- AI generation is optional. Creators who already have a product simply upload a file.

---

## Architecture Diagram

```
+------------------+        +------------------+        +------------------+
|                  |        |                  |        |                  |
|     BUYER        |        |     VIAJAX       |        |    CREATOR       |
|                  |        |   (Next.js App)  |        |                  |
+--------+---------+        +--------+---------+        +--------+---------+
         |                           |                           |
         |  1. Browse & Buy          |                           |
         |-------------------------->|                           |
         |                           |                           |
         |  2a. Card Payment         |                           |
         |-------------------------->|                           |
         |         |                 |                           |
         |         v                 |                           |
         |  +------+-------+        |                           |
         |  |  Crossmint   |        |                           |
         |  |  (fiat->USDC)|        |                           |
         |  +------+-------+        |                           |
         |         |                 |                           |
         |         | webhook         |                           |
         |         +---------------->|                           |
         |                           |                           |
         |  2b. Wallet Payment       |                           |
         |-------------------------->|                           |
         |         |                 |                           |
         |         v                 |                           |
         |  +------+-------+        |                           |
         |  | Solana/Jupiter|        |                           |
         |  | (USDC direct) |        |                           |
         |  +------+-------+        |                           |
         |         |                 |                           |
         |         | verify tx       |                           |
         |         +---------------->|                           |
         |                           |                           |
         |  3. Download product      |                           |
         |<--------------------------|                           |
         |                           |                           |
         |                           |  4. After 7 days         |
         |                           |  auto-payout USDC        |
         |                           |-------------------------->|
         |                           |                           |
         |                           |         +----------------+|
         |                           |         | Solana Wallet  ||
         |                           |         | (97% of sale)  ||
         |                           |         +----------------+|
         |                           |                           |
```

---

## Product Creation Flow

When a creator wants to sell a product, the platform asks a single question:

```
+-------------------------------------------+
|  How would you like to create a product?  |
|                                           |
|  [A] I have it ready                      |
|  [B] Create with AI                       |
+-------------------------------------------+
```

### Path A -- Upload Ready Product

```
Creator signs in
       |
       v
Selects "I have it ready"
       |
       v
Fills in: Title, Description, Price, Category
       |
       v
Uploads product file (PDF, ZIP, EPUB, up to 50MB)
       |
       v
Clicks "Publish to Marketplace"
       |
       v
Product is live and available for purchase
```

### Path B -- Create with AI

```
Creator signs in
       |
       v
Selects "Create with AI"
       |
       v
Uploads a source PDF (up to 10MB)
       |
       v
API extracts text from PDF using pdf-parse
       |
       v
GPT-4o analyzes content: suggests title, chapters, audience, tone
       |
       v
Creator picks one of 5 templates:
  - Complete Guide
  - Step by Step Tutorial
  - Travel Guide
  - Technical Manual
  - Success Story
       |
       v
Creator optionally adds custom instructions
       |
       v
GPT-4o generates a full product based on template + analysis
       |
       v
Creator reviews, can regenerate if not satisfied
       |
       v
Sets title, price, category
       |
       v
Clicks "Publish to Marketplace"
       |
       v
Product is live
```

Authentication is required. Without an account, the creator sees a sign-in prompt.

---

## Payment Flow

### Credit Card (default, no crypto visible to buyer)

```
Buyer clicks "Buy Now" on product page
       |
       v
POST /api/checkout/create
  -> creates order in DB (status: pending)
  -> returns orderId + amount
       |
       v
Buyer lands on /checkout/[orderId]
  -> sees card form (email, name, card number, expiry, CVV)
       |
       v
Card details sent to Crossmint API
  -> Crossmint converts fiat to USDC
  -> Crossmint sends USDC to platform wallet on Solana
  -> Crossmint fires webhook to /api/webhooks/crossmint
       |
       v
Webhook handler:
  -> verifies signature
  -> updates order status to "confirmed"
  -> grants access to buyer
  -> increments product sales count
       |
       v
Buyer redirected to /success/[orderId]
  -> download link available
```

### Solana Wallet (optional, hidden behind "Have a Solana wallet?" link)

```
Buyer clicks "Pay with crypto" link
       |
       v
Connects wallet (Phantom, Solflare, Backpack via wallet-adapter)
       |
       v
Sees amount in USDC
       |
       v
Signs transaction via Jupiter (USDC transfer to platform wallet)
       |
       v
Frontend sends txSignature to POST /api/checkout/verify-wallet
       |
       v
Backend verifies transaction on-chain
  -> confirms amount and recipient match
  -> updates order to "confirmed"
  -> grants access
       |
       v
Buyer redirected to /success/[orderId]
```

---

## Payout Flow

```
Sale confirmed (timestamp recorded)
       |
       v
7-day holding period
       |
       v
Cron job calls POST /api/payouts/process (protected by CRON_SECRET)
       |
       v
Queries all orders where:
  - payment_status = "confirmed"
  - payout_status = "pending"
  - payout_date <= NOW()
       |
       v
For each eligible order:
  - Calculate creator amount (97% of sale)
  - Send USDC from platform wallet to creator wallet on Solana
  - Record tx signature
  - Update payout_status to "completed"
       |
       v
Creator sees payout in Dashboard > Earnings
  - Amount, date, tx signature (links to Solscan)
```

Fee breakdown per sale:
- Platform keeps: 3%
- Creator receives: 97%
- Example: product priced at $9.99 -> creator gets $9.69 USDC

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, standalone output) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (dark theme) |
| Database | MySQL (via mysql2, connection pool) |
| Auth | NextAuth.js (Credentials provider) |
| Payments (card) | Crossmint (fiat to USDC, invisible to buyer) |
| Payments (crypto) | Solana wallet-adapter + Jupiter |
| Blockchain | Solana Mainnet, USDC (SPL token) |
| AI | OpenAI GPT-4o (PDF analysis + content generation) |
| PDF parsing | pdf-parse |
| Hosting | Hostinger (Node.js + MySQL + FTP) |
| Version control | GitHub |

---

## Project Structure

```
viajax.es/
├── migrations/              SQL schema and seed files
│   ├── 001_initial_schema.sql
│   └── 002_seed_initial_data.sql
├── scripts/                 Deployment automation
│   ├── deploy.sh
│   ├── migrate.sh
│   ├── ftp-deploy.sh
│   ├── git-push.sh
│   ├── validate.sh
│   └── run-all.sh
├── public/
│   └── .htaccess            Apache proxy config for Hostinger
├── src/
│   ├── app/
│   │   ├── layout.tsx       Root layout (providers, header, footer)
│   │   ├── page.tsx         Homepage
│   │   ├── globals.css      Dark theme + custom scrollbar
│   │   ├── marketplace/     Product listing with filters
│   │   ├── product/[id]/    Product detail page
│   │   ├── checkout/[orderId]/   Payment page
│   │   ├── success/[orderId]/    Post-purchase confirmation
│   │   ├── dashboard/
│   │   │   ├── page.tsx          Overview (stats)
│   │   │   ├── products/        Product management
│   │   │   ├── products/new/    Create product (auth required)
│   │   │   ├── studio/[id]/     AI editor for existing product
│   │   │   └── earnings/        Payout history
│   │   └── api/
│   │       ├── health/           Health check
│   │       ├── auth/[...nextauth]/  Authentication
│   │       ├── products/         CRUD for products
│   │       ├── checkout/         Order creation + verification
│   │       ├── ai/               PDF upload + ebook generation
│   │       ├── webhooks/crossmint/  Payment confirmation
│   │       └── payouts/process/     Cron-triggered USDC payouts
│   ├── components/
│   │   ├── ui/              Button, Card, Input, Badge, Modal, Spinner
│   │   ├── layout/          Header, Footer, DashboardSidebar
│   │   ├── marketplace/     ProductCard, ProductGrid, CategoryFilter
│   │   ├── checkout/        CardCheckout, WalletCheckout, PaymentMethodSelector
│   │   └── creator/         AIStudio, PDFUpload, TemplateSelector
│   └── lib/
│       ├── db.ts            MySQL connection pool
│       ├── solana.ts        Solana RPC, USDC transfers, tx verification
│       ├── crossmint.ts     Payment orders, status, webhook verification
│       ├── openai.ts        PDF analysis, ebook generation, templates
│       ├── payouts.ts       Payout processing logic
│       └── utils.ts         Formatting, fees, ID generation
├── .env.example             All required environment variables
├── next.config.ts           Standalone output + external packages
├── Procfile                 Node.js start command
├── LICENSE                  MIT
└── README.md                This file
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| MYSQL_HOST | Database host | Hostinger hPanel > Databases |
| MYSQL_USER | Database user | Same |
| MYSQL_PASSWORD | Database password | Same |
| MYSQL_DATABASE | Database name | Same |
| NEXTAUTH_SECRET | Random 32+ char string | `openssl rand -base64 32` |
| NEXTAUTH_URL | App URL | Your domain |
| SOLANA_RPC_URL | Solana Mainnet RPC | https://api.mainnet-beta.solana.com |
| PLATFORM_WALLET_SECRET | Base58 private key of platform wallet | Phantom > Export |
| CROSSMINT_SERVER_KEY | Crossmint API key (server) | crossmint.com dashboard |
| CROSSMINT_CLIENT_KEY | Crossmint API key (client) | Same |
| OPENAI_API_KEY | OpenAI API key | platform.openai.com |
| CRON_SECRET | Secret for payout cron auth | `openssl rand -base64 32` |

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

Requirements:
- Node.js 18+
- MySQL 8+ (local or remote)
- Environment variables configured in .env.local

---

## Database Migrations

Run migrations against your MySQL database:

```bash
bash scripts/migrate.sh
```

This executes:
1. `001_initial_schema.sql` -- creates users, products, orders, payouts tables
2. `002_seed_initial_data.sql` -- inserts demo categories and sample data

The script loads credentials from `.env.local` automatically.

---

## Deployment

### Full automated deploy (recommended)

```bash
bash scripts/run-all.sh "your commit message"
```

This runs in sequence:
1. `git-push.sh` -- commits and pushes to GitHub
2. `migrate.sh` -- runs pending SQL migrations
3. `deploy.sh` -- builds the Next.js app in standalone mode
4. `ftp-deploy.sh` -- uploads build output to Hostinger via FTP
5. `validate.sh` -- hits /api/health to confirm the deploy is live

### Manual build

```bash
npm run build
# Output in .next/standalone/
node .next/standalone/server.js
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check (includes DB status) |
| POST | /api/auth/[...nextauth] | NextAuth sign-in/sign-out |
| GET | /api/products | List products (query: category, search) |
| POST | /api/products | Create product (auth required) |
| GET | /api/products/[id] | Get single product |
| PUT | /api/products/[id] | Update product (auth required) |
| DELETE | /api/products/[id] | Delete product (auth required) |
| POST | /api/checkout/create | Create checkout order |
| GET | /api/checkout/status/[orderId] | Get order status |
| POST | /api/checkout/verify-wallet | Verify Solana wallet payment |
| POST | /api/ai/upload-pdf | Upload PDF for AI analysis |
| POST | /api/ai/generate-ebook | Generate product with template |
| GET | /api/ai/templates | List available AI templates |
| POST | /api/webhooks/crossmint | Crossmint payment webhook |
| POST | /api/payouts/process | Process pending payouts (cron) |

---

## License

MIT -- Shelldon / Viajax 2026. See [LICENSE](LICENSE) for full text.

