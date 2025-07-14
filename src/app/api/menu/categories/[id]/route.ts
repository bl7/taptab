import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Category name must be 100 characters or less' }, { status: 400 });
    }

    const { id } = await params;

    // Check for duplicate category names within the same restaurant (excluding current category)
    const { rows: existingCategory } = await pool.query(
      'SELECT id FROM "MenuCategory" WHERE name = $1 AND "restaurantId" = $2 AND id != $3',
      [name.trim(), session.user.restaurantId, id]
    );

    if (existingCategory.length > 0) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    }

    const { rows } = await pool.query(
      'UPDATE "MenuCategory" SET name = $1, "updatedAt" = now() WHERE id = $2 AND "restaurantId" = $3 RETURNING *',
      [name.trim(), id, session.user.restaurantId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating menu category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if category has items
    const { rows: items } = await pool.query(
      'SELECT COUNT(*) as count FROM "MenuItem" WHERE "categoryId" = $1',
      [id]
    );

    if (parseInt(items[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with existing items. Please remove or move all items first.' 
      }, { status: 400 });
    }

    const { rows } = await pool.query(
      'DELETE FROM "MenuCategory" WHERE id = $1 AND "restaurantId" = $2 RETURNING *',
      [id, session.user.restaurantId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 