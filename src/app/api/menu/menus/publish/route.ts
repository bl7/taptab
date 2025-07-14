import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { menuId } = await req.json();
    if (!menuId) {
      return NextResponse.json({ error: 'menuId is required' }, { status: 400 });
    }
    // Unpublish all menus for this restaurant
    await pool.query(
      'UPDATE "Menu" SET published = false WHERE "restaurantId" = $1',
      [user.restaurantId]
    );
    // Publish the selected menu
    const { rows } = await pool.query(
      'UPDATE "Menu" SET published = true, "updatedAt" = now() WHERE id = $1 AND "restaurantId" = $2 RETURNING *',
      [menuId, user.restaurantId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found or not published' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error publishing menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 