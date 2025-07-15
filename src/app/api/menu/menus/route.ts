import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { rows } = await pool.query(
      'SELECT id, name, published, "updatedAt" FROM "Menu" WHERE "restaurantId" = $1 ORDER BY "updatedAt" DESC',
      [user.restaurantId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, layout } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    // Only one menu can be published at a time, so new menus are not published by default
    const { rows } = await pool.query(
      'INSERT INTO "Menu" (id, "restaurantId", name, layout, published, "updatedAt") VALUES ($1, $2, $3, $4, false, now()) RETURNING *',
      [createId(), user.restaurantId, name.trim(), JSON.stringify(layout || [])]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 