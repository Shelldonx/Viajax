import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

// GET -- list products (public or creator's own)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const mine = searchParams.get("mine");

    // If ?mine=true, return only the current user's products
    if (mine === "true") {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ products: [] });
      }
      const userId = (session.user as { id?: string }).id || "";
      const products = await query<ProductRow[]>(
        `SELECT p.*, u.name as creator_name 
         FROM products p 
         JOIN users u ON p.creator_id = u.id 
         WHERE p.creator_id = ?
         ORDER BY p.created_at DESC`,
        [userId]
      );
      return NextResponse.json({ products });
    }

    // Public listing
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
    console.error("[API Products] Error GET:", (erro as Error).message);
    // Return empty products array instead of error so marketplace page still renders
    return NextResponse.json({ products: [], dbError: true });
  }
}

// POST -- create product (authenticated creator)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in to create a product" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, category, template, content, coverImage } = body;

    if (!title || !price) {
      return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await execute(
      `INSERT INTO products (id, title, description, price, category, template, cover_image, published, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [id, title, description || "", price, category || "General", template || null, coverImage || null, userId]
    );

    return NextResponse.json({
      product: { id, title, price },
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://viajax.es"}/product/${id}`,
      message: "Product created successfully",
    }, { status: 201 });
  } catch (erro) {
    console.error("[API Products] Error POST:", (erro as Error).message);
    return NextResponse.json({ error: "Error creating product" }, { status: 500 });
  }
}
