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

// GET — produto individual
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = await query<ProductRow[]>(
      `SELECT p.*, u.name as creator_name 
       FROM products p 
       JOIN users u ON p.creator_id = u.id 
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: products[0] });
  } catch (erro) {
    console.error("[API Product] Erro GET:", (erro as Error).message);
    return NextResponse.json({ error: "Error loading product" }, { status: 500 });
  }
}

// PUT — atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, price, category, published } = body;

    await execute(
      `UPDATE products SET title = ?, description = ?, price = ?, category = ?, published = ? WHERE id = ?`,
      [title, description, price, category, published ? 1 : 0, id]
    );

    return NextResponse.json({ message: "Product updated" });
  } catch (erro) {
    console.error("[API Product] Erro PUT:", (erro as Error).message);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}

// DELETE — remover produto
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await execute("DELETE FROM products WHERE id = ?", [id]);
    return NextResponse.json({ message: "Product deleted" });
  } catch (erro) {
    console.error("[API Product] Erro DELETE:", (erro as Error).message);
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 });
  }
}
