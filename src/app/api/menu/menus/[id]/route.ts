import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { rows } = await pool.query(
      'SELECT id, name, layout, published, "updatedAt" FROM "Menu" WHERE id = $1 AND "restaurantId" = $2',
      [id, session.user.restaurantId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { name, layout } = await req.json();
    const { rows } = await pool.query(
      'UPDATE "Menu" SET name = $1, layout = $2, "updatedAt" = now() WHERE id = $3 AND "restaurantId" = $4 RETURNING *',
      [name, JSON.stringify(layout), id, session.user.restaurantId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found or not updated' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { rowCount } = await pool.query(
      'DELETE FROM "Menu" WHERE id = $1 AND "restaurantId" = $2',
      [id, session.user.restaurantId]
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: 'Menu not found or not deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 