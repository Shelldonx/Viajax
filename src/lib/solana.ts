import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Constantes Solana Mainnet
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const USDC_MINT = process.env.USDC_MINT_ADDRESS || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;

// Conexão singleton ao Solana Mainnet
let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(SOLANA_RPC, "confirmed");
  }
  return connection;
}

// Validar endereço Solana
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return PublicKey.isOnCurve(new PublicKey(address).toBytes());
  } catch {
    return false;
  }
}

// Obter saldo USDC de uma carteira
export async function getUsdcBalance(walletAddress: string): Promise<number> {
  try {
    const conn = getConnection();
    const wallet = new PublicKey(walletAddress);
    const usdcMint = new PublicKey(USDC_MINT);

    // Buscar token accounts de USDC
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(wallet, {
      mint: usdcMint,
    });

    if (tokenAccounts.value.length === 0) return 0;

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return balance || 0;
  } catch (erro) {
    console.error("[Solana] Erro ao obter saldo USDC:", (erro as Error).message);
    return 0;
  }
}

// Obter saldo SOL de uma carteira
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const conn = getConnection();
    const balance = await conn.getBalance(new PublicKey(walletAddress));
    return balance / LAMPORTS_PER_SOL;
  } catch (erro) {
    console.error("[Solana] Erro ao obter saldo SOL:", (erro as Error).message);
    return 0;
  }
}

// Enviar USDC da carteira da plataforma para um creator
export async function sendUsdc(toAddress: string, amountUsdc: number): Promise<string> {
  try {
    const conn = getConnection();
    const privateKeyStr = process.env.PLATFORM_WALLET_PRIVATE_KEY;
    if (!privateKeyStr) {
      throw new Error("PLATFORM_WALLET_PRIVATE_KEY não configurada");
    }

    // Decodificar chave privada (base58 ou array JSON)
    let fromKeypair: Keypair;
    try {
      const secretKey = JSON.parse(privateKeyStr);
      fromKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    } catch {
      // Se não for JSON, tentar como base58
      const bs58 = await import("bs58");
      fromKeypair = Keypair.fromSecretKey(bs58.default.decode(privateKeyStr));
    }

    const fromPubkey = fromKeypair.publicKey;
    const toPubkey = new PublicKey(toAddress);
    const usdcMint = new PublicKey(USDC_MINT);
    const amountRaw = Math.round(amountUsdc * Math.pow(10, USDC_DECIMALS));

    // Importar funções SPL Token
    const { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, getAccount } = await import("@solana/spl-token");

    const fromAta = await getAssociatedTokenAddress(usdcMint, fromPubkey);
    const toAta = await getAssociatedTokenAddress(usdcMint, toPubkey);

    const transaction = new Transaction();

    // Verificar se a ATA de destino existe, senão criar
    try {
      await getAccount(conn, toAta);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(fromPubkey, toAta, toPubkey, usdcMint)
      );
    }

    // Adicionar instrução de transferência USDC
    transaction.add(
      createTransferInstruction(fromAta, toAta, fromPubkey, amountRaw)
    );

    transaction.feePayer = fromPubkey;
    transaction.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

    transaction.sign(fromKeypair);
    const txSignature = await conn.sendRawTransaction(transaction.serialize());
    await conn.confirmTransaction(txSignature, "confirmed");

    console.log(`[Solana] USDC enviado: ${amountUsdc} USDC → ${toAddress} | tx: ${txSignature}`);
    return txSignature;
  } catch (erro) {
    console.error("[Solana] Erro ao enviar USDC:", (erro as Error).message);
    throw erro;
  }
}

// Verificar transacção on-chain
export async function verifyTransaction(txSignature: string): Promise<{ confirmed: boolean; amount: number }> {
  try {
    const conn = getConnection();
    const tx = await conn.getParsedTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return { confirmed: false, amount: 0 };
    }

    // Extrair montante USDC dos token balances
    const preBalances = tx.meta?.preTokenBalances || [];
    const postBalances = tx.meta?.postTokenBalances || [];

    let amount = 0;
    for (const post of postBalances) {
      if (post.mint === USDC_MINT) {
        const pre = preBalances.find(
          (p) => p.accountIndex === post.accountIndex
        );
        const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmountString || "0") : 0;
        const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || "0");
        const diff = postAmount - preAmount;
        if (diff > 0) amount = diff;
      }
    }

    return { confirmed: true, amount };
  } catch (erro) {
    console.error("[Solana] Erro ao verificar tx:", (erro as Error).message);
    return { confirmed: false, amount: 0 };
  }
}

// Get platform keypair from private key env var
export async function getPlatformKeypair(): Promise<Keypair> {
  const privateKeyStr = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!privateKeyStr) {
    throw new Error("PLATFORM_WALLET_PRIVATE_KEY not configured");
  }
  try {
    const secretKey = JSON.parse(privateKeyStr);
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch {
    const bs58 = await import("bs58");
    return Keypair.fromSecretKey(bs58.default.decode(privateKeyStr));
  }
}

// Verify a USDC payment on-chain: checks tx confirmed + correct amount + correct recipient
export async function verifyUsdcPayment(
  txSignature: string,
  expectedAmount: number,
  expectedRecipient: string
): Promise<boolean> {
  try {
    const conn = getConnection();
    const tx = await conn.getParsedTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) return false;

    const postBalances = tx.meta?.postTokenBalances || [];
    const preBalances = tx.meta?.preTokenBalances || [];

    for (const post of postBalances) {
      if (post.mint === USDC_MINT && post.owner === expectedRecipient) {
        const pre = preBalances.find(
          (p) => p.accountIndex === post.accountIndex
        );
        const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmountString || "0") : 0;
        const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || "0");
        const received = postAmount - preAmount;
        // Allow 1% tolerance for rounding
        if (received >= expectedAmount * 0.99) return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Solana] Error verifying USDC payment:", (error as Error).message);
    return false;
  }
}

// Export useful constants
export { USDC_MINT, USDC_DECIMALS, LAMPORTS_PER_SOL, SystemProgram };
