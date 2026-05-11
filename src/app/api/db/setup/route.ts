import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

// GET — create missing tables (safe to run multiple times)
export async function GET() {
  const results: string[] = [];

  try {
    // Check if users table exists
    const tables = await query<RowDataPacket[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );
    const tableNames = tables.map((t) => t.TABLE_NAME as string);
    results.push(`Existing tables: ${tableNames.join(", ") || "none"}`);

    if (!tableNames.includes("users")) {
      await execute(`
        CREATE TABLE users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          image VARCHAR(500),
          password_hash VARCHAR(255),
          wallet_address VARCHAR(100),
          is_creator BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push("Created: users");
    }

    if (!tableNames.includes("products")) {
      await execute(`
        CREATE TABLE products (
          id VARCHAR(36) PRIMARY KEY,
          creator_id VARCHAR(36) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          cover_image MEDIUMTEXT,
          file_url TEXT,
          category VARCHAR(50) DEFAULT 'General',
          published BOOLEAN DEFAULT TRUE,
          sales_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id),
          INDEX idx_creator (creator_id),
          INDEX idx_category (category),
          INDEX idx_published (published)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push("Created: products");
    }

    if (!tableNames.includes("orders")) {
      await execute(`
        CREATE TABLE orders (
          id VARCHAR(36) PRIMARY KEY,
          product_id VARCHAR(36) NOT NULL,
          buyer_id VARCHAR(36),
          buyer_email VARCHAR(255) NOT NULL,
          amount_usd DECIMAL(10,2) NOT NULL,
          amount_usdc DECIMAL(10,6) NOT NULL,
          platform_fee DECIMAL(10,6) NOT NULL,
          creator_amount DECIMAL(10,6) NOT NULL,
          payment_method VARCHAR(20) NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'pending',
          tx_signature VARCHAR(200),
          crossmint_order_id VARCHAR(200),
          access_granted BOOLEAN DEFAULT FALSE,
          payout_status VARCHAR(20) DEFAULT 'pending',
          payout_date TIMESTAMP NOT NULL,
          paid_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id),
          INDEX idx_product (product_id),
          INDEX idx_buyer (buyer_id),
          INDEX idx_payment_status (payment_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push("Created: orders");
    }

    if (!tableNames.includes("payouts")) {
      await execute(`
        CREATE TABLE payouts (
          id VARCHAR(36) PRIMARY KEY,
          creator_id VARCHAR(36) NOT NULL,
          amount_usdc DECIMAL(10,6) NOT NULL,
          tx_signature VARCHAR(200),
          status VARCHAR(20) DEFAULT 'pending',
          orders_count INT DEFAULT 0,
          processed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id),
          INDEX idx_creator (creator_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push("Created: payouts");
    }

    // Ensure cover_image is MEDIUMTEXT
    try {
      await execute("ALTER TABLE products MODIFY COLUMN cover_image MEDIUMTEXT");
      results.push("Ensured: products.cover_image is MEDIUMTEXT");
    } catch {
      results.push("products.cover_image already MEDIUMTEXT or skipped");
    }

    // Ensure password_hash column exists
    try {
      await execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) AFTER image");
      results.push("Added: users.password_hash");
    } catch {
      results.push("users.password_hash already exists");
    }

    // NextAuth tables
    if (!tableNames.includes("accounts")) {
      await execute(`
        CREATE TABLE accounts (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          type VARCHAR(255) NOT NULL,
          provider VARCHAR(255) NOT NULL,
          providerAccountId VARCHAR(255) NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at BIGINT,
          token_type VARCHAR(255),
          scope VARCHAR(255),
          id_token TEXT,
          session_state VARCHAR(255),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push("Created: accounts");
    }

    if (!tableNames.includes("sessions")) {
      await execute(`
        CREATE TABLE sessions (
          id VARCHAR(36) PRIMARY KEY,
          sessionToken VARCHAR(255) UNIQUE NOT NULL,
          userId VARCHAR(36) NOT NULL,
          expires TIMESTAMP NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push("Created: sessions");
    }

    results.push("✅ Database setup complete!");
    return NextResponse.json({ success: true, results });
  } catch (error) {
    results.push(`❌ Error: ${(error as Error).message}`);
    return NextResponse.json({ success: false, results, error: (error as Error).message }, { status: 500 });
  }
}
