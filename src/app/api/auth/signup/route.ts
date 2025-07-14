import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";
import { z } from "zod";
import bcrypt from "bcryptjs";
import cuid from "cuid";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = SignupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }
    const { email, password } = result.data;
    // Check if user exists
    const { rows: existingRows } = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existingRows.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    // Generate cuid for user id and restaurant id
    const userId = cuid();
    const restaurantId = cuid();
    // Insert user and restaurant in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        'INSERT INTO "User" (id, email, "passwordHash") VALUES ($1, $2, $3) RETURNING id',
        [userId, email, passwordHash]
      );
      await client.query(
        'INSERT INTO "Restaurant" (id, "userId", "updatedAt") VALUES ($1, $2, NOW()) RETURNING id',
        [restaurantId, userId]
      );
      await client.query("COMMIT");
      return NextResponse.json({ success: true, userId });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Signup transaction error:", err);
      return NextResponse.json({ error: "Server error (transaction)" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Signup API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 