import mysql, { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from "mysql2/promise";

// Pool singleton — evita abrir conexões em excesso
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config: PoolOptions = {
      host: process.env.DB_HOST || "127.0.0.1",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER || "u311001338_shelldonxdata",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "u311001338_viajaxdata",
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 5000,
      charset: "utf8mb4",
    };
    pool = mysql.createPool(config);
  }
  return pool;
}

// Query genérica — retorna rows tipados
export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T> {
  const p = getPool();
  const [rows] = await p.execute<T>(sql, params ?? []);
  return rows;
}

// Execute para INSERT, UPDATE, DELETE — retorna ResultSetHeader
export async function execute(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<ResultSetHeader> {
  const p = getPool();
  const [result] = await p.execute<ResultSetHeader>(sql, params ?? []);
  return result;
}

// Health check da base de dados
export async function healthCheck(): Promise<boolean> {
  try {
    await query("SELECT 1 as ok");
    return true;
  } catch {
    return false;
  }
}

export default { query, execute, healthCheck };
