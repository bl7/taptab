import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import db from '@/lib/pg';

export async function POST(request: NextRequest) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, menu } = await request.json();

    if (!action || !menu) {
      return NextResponse.json({ error: 'Missing action or menu data' }, { status: 400 });
    }

    const restaurantId = session.user.restaurantId;

    if (action === 'save') {
      await saveMenuLayout(restaurantId, menu, false);
      return NextResponse.json({ success: true, message: 'Menu saved successfully' });
    }

    if (action === 'publish') {
      await saveMenuLayout(restaurantId, menu, true);
      return NextResponse.json({ success: true, message: 'Menu published successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Menu builder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function saveMenuLayout(restaurantId: string, menu: unknown, publish: boolean) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let menuId = (menu as unknown as { id: string }).id; // Assuming 'menu' is an object with an 'id' property
    if (!menuId) {
      const menuResult = await client.query(
        'INSERT INTO "Menu" ("restaurantId", name, published, layout) VALUES ($1, $2, $3, $4) RETURNING id',
        [restaurantId, (menu as unknown as { name: string }).name, publish, JSON.stringify({ categories: (menu as unknown as { categories: unknown[] }).categories })]
      );
      menuId = menuResult.rows[0].id;
    } else {
      await client.query(
        'UPDATE "Menu" SET name = $1, published = $2, layout = $3 WHERE id = $4 AND "restaurantId" = $5',
        [(menu as unknown as { name: string }).name, publish, JSON.stringify({ categories: (menu as unknown as { categories: unknown[] }).categories }), menuId, restaurantId]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} 