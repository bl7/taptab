import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { rows } = await pool.query(
      'SELECT id, name, description, "restaurantId" FROM "Table" WHERE "restaurantId" = $1 ORDER BY name ASC',
      [user.restaurantId]
    );
    return NextResponse.json({ tables: rows });
  } catch (error) {
    console.error('Error fetching tables:', error);
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
    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO "Table" (id, name, description, "restaurantId") VALUES ($1, $2, $3, $4)',
      [id, name, description || null, user.restaurantId]
    );
    // Fetch the full table row
    const { rows: tableRows } = await pool.query(
      'SELECT id, name, description, "restaurantId" FROM "Table" WHERE id = $1',
      [id]
    );
    return NextResponse.json({ table: tableRows[0] });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getServerSession(authOptions);
  const user = token?.user as { restaurantId?: string; id?: string };
  if (!user?.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Table ID is required' }, { status: 400 });
  }
  const { rowCount } = await pool.query('DELETE FROM "Table" WHERE id = $1 AND "restaurantId" = $2', [id, user.restaurantId]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Table not found or not allowed' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const token = await getServerSession(authOptions);
  const user = token?.user as { restaurantId?: string; id?: string };
  if (!user?.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { id, name, description } = body;
  if (!id || !name) {
    return NextResponse.json({ error: 'Table ID and name are required' }, { status: 400 });
  }
  const { rowCount, rows } = await pool.query(
    'UPDATE "Table" SET name = $1, description = $2 WHERE id = $3 AND "restaurantId" = $4 RETURNING id, name, description, "createdAt", "updatedAt", "restaurantId"',
    [name, description || null, id, user.restaurantId]
  );
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Table not found or not allowed' }, { status: 404 });
  }
  return NextResponse.json({ table: rows[0] });
} 