import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows } = await pool.query(`
      SELECT 
        mc.id,
        mc.name,
        mc."createdAt",
        mc."updatedAt",
        mc.visible,
        mc."order",
        COALESCE(
          json_agg(
            json_build_object(
              'id', mi.id,
              'name', mi.name,
              'description', mi.description,
              'price', mi.price,
              'imageUrl', mi."imageUrl",
              'isAvailable', mi."isAvailable",
              'visible', mi.visible,
              'badge', mi.badge
            )
          ) FILTER (WHERE mi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM "MenuCategory" mc
      LEFT JOIN "MenuItem" mi ON mc.id = mi."categoryId"
      WHERE mc."restaurantId" = $1
      GROUP BY mc.id, mc.name, mc."createdAt", mc."updatedAt", mc.visible, mc."order"
      ORDER BY mc."order" ASC, mc."createdAt" ASC
    `, [session.user.restaurantId]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Check for duplicate category names within the same restaurant
    const { rows: existingCategory } = await pool.query(
      'SELECT id FROM "MenuCategory" WHERE name = $1 AND "restaurantId" = $2',
      [name.trim(), session.user.restaurantId]
    );

    if (existingCategory.length > 0) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    }

    const { rows } = await pool.query(
      'INSERT INTO "MenuCategory" (id, name, "restaurantId", "createdAt", "updatedAt") VALUES ($1, $2, $3, now(), now()) RETURNING *',
      [createId(), name.trim(), session.user.restaurantId]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating menu category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 