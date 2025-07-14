import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const RestaurantSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  timeZone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const result = RestaurantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }
    const { name, logoUrl, address, currency, timeZone } = result.data;
    await pool.query(
      'UPDATE "Restaurant" SET name = $1, "logoUrl" = $2, address = $3, currency = $4, "timeZone" = $5 WHERE id = $6',
      [name, logoUrl, address, currency, timeZone, user.restaurantId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 