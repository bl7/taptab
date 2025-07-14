import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';
import cuid from 'cuid';

export async function GET() {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows } = await pool.query(`
      SELECT 
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi."imageUrl",
        mi."isAvailable",
        mi.visible,
        mi.badge,
        mi."createdAt",
        mi."updatedAt",
        mc.id as "categoryId",
        mc.name as "categoryName"
      FROM "MenuItem" mi
      JOIN "MenuCategory" mc ON mi."categoryId" = mc.id
      WHERE mi."restaurantId" = $1
      ORDER BY mc."order" ASC, mc.name ASC, mi.name ASC
    `, [session.user.restaurantId]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Verify category belongs to this restaurant
    const { rows: categoryCheck } = await pool.query(
      'SELECT id FROM "MenuCategory" WHERE id = $1 AND "restaurantId" = $2',
      [categoryId, session.user.restaurantId]
    );

    if (categoryCheck.length === 0) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Check for duplicate item names within the same category
    const { rows: existingItem } = await pool.query(
      'SELECT id FROM "MenuItem" WHERE name = $1 AND "categoryId" = $2',
      [name.trim(), categoryId]
    );

    if (existingItem.length > 0) {
      return NextResponse.json({ error: 'An item with this name already exists in this category' }, { status: 409 });
    }

    const { rows } = await pool.query(
      `INSERT INTO "MenuItem" (
        id, name, description, price, "imageUrl", "isAvailable", 
        "categoryId", "restaurantId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now()) RETURNING *`,
      [
        cuid(),
        name.trim(),
        description?.trim() || null,
        price,
        imageUrl || null,
        isAvailable !== false, // default to true
        categoryId,
        session.user.restaurantId
      ]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 