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

    const { name, description, price, imageUrl, isAvailable, categoryId } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Item name must be 100 characters or less' }, { status: 400 });
    }

    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    if (price > 999999.99) {
      return NextResponse.json({ error: 'Price must be less than 1,000,000' }, { status: 400 });
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (description && description.trim().length > 500) {
      return NextResponse.json({ error: 'Description must be 500 characters or less' }, { status: 400 });
    }

    const { id } = await params;

    // Verify category belongs to this restaurant
    const { rows: categoryCheck } = await pool.query(
      'SELECT id FROM "MenuCategory" WHERE id = $1 AND "restaurantId" = $2',
      [categoryId, session.user.restaurantId]
    );

    if (categoryCheck.length === 0) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Check for duplicate item names within the same category (excluding current item)
    const { rows: existingItem } = await pool.query(
      'SELECT id FROM "MenuItem" WHERE name = $1 AND "categoryId" = $2 AND id != $3',
      [name.trim(), categoryId, id]
    );

    if (existingItem.length > 0) {
      return NextResponse.json({ error: 'An item with this name already exists in this category' }, { status: 409 });
    }

    const { rows } = await pool.query(
      `UPDATE "MenuItem" SET 
        name = $1, 
        description = $2, 
        price = $3, 
        "imageUrl" = $4, 
        "isAvailable" = $5, 
        "categoryId" = $6, 
        "updatedAt" = now() 
      WHERE id = $7 AND "restaurantId" = $8 RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        price,
        imageUrl || null,
        isAvailable !== false,
        categoryId,
        id,
        session.user.restaurantId
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
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

    const { rows } = await pool.query(
      'DELETE FROM "MenuItem" WHERE id = $1 AND "restaurantId" = $2 RETURNING *',
      [id, session.user.restaurantId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 