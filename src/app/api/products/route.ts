import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

interface ProductRow extends RowDataPacket {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image: string;
  category: string;
  published: boolean;
  sales_count: number;
  creator_id: string;
  creator_name: string;
  created_at: string;
}

// GET — listar produtos públicos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let sql = `
      SELECT p.*, u.name as creator_name 
      FROM products p 
      JOIN users u ON p.creator_id = u.id 
      WHERE p.published = TRUE
    `;
    const params: string[] = [];

    if (category) {
      sql += " AND p.category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (p.title LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY p.created_at DESC";

    const products = await query<ProductRow[]>(sql, params);

    return NextResponse.json({ products });
  } catch (erro) {
    console.error("[API Products] Erro GET:", (erro as Error).message);
    return NextResponse.json({ error: "Erro ao carregar produtos" }, { status: 500 });
  }
}

// POST — criar produto (creator autenticado)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, price, category, template, content } = body;

    if (!title || !price) {
      return NextResponse.json({ error: "Título e preço são obrigatórios" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    // Por agora usar creator demo — depois ligar ao NextAuth session
    const creatorId = "demo-creator-001";

    await execute(
      `INSERT INTO products (id, title, description, price, category, template, published, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [id, title, description || "", price, category || "Geral", template || null, creatorId]
    );

    return NextResponse.json({ product: { id, title, price }, message: "Produto criado com sucesso" }, { status: 201 });
  } catch (erro) {
    console.error("[API Products] Erro POST:", (erro as Error).message);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
