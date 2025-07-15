import { NextResponse } from 'next/server';
import pool from '@/lib/pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch orders with items and table info
    const { rows: orders } = await pool.query(`
      SELECT o.*, t.name as "tableName", t.id as "tableId"
      FROM "Order" o
      LEFT JOIN "Table" t ON o."tableId" = t.id
      WHERE o."restaurantId" = $1 AND o.status IN ('PENDING', 'PREPARING')
      ORDER BY o."createdAt" DESC
    `, [user.restaurantId]);
    console.log('DEBUG: /api/orders/active fetched orders =', orders);

    // Fetch items for all orders
    const orderIds = orders.map((o: unknown) => (o as { id: string }).id);
    const itemsByOrder: Record<string, unknown[]> = {};
    if (orderIds.length > 0) {
      const { rows: items } = await pool.query(
        'SELECT * FROM "OrderItem" WHERE "orderId" = ANY($1)',
        [orderIds]
      );
      items.forEach((item: unknown) => {
        const typedItem = item as { orderId: string };
        if (!itemsByOrder[typedItem.orderId]) itemsByOrder[typedItem.orderId] = [];
        itemsByOrder[typedItem.orderId].push(item);
      });
      console.log('DEBUG: /api/orders/active itemsByOrder =', itemsByOrder);
    }

    // Shape the response to match dashboard expectations
    const result = orders.map((order: unknown) => {
      const typedOrder = order as { id: string; tableId?: string; tableName?: string };
      return {
        ...typedOrder,
        items: itemsByOrder[typedOrder.id] || [],
        table: typedOrder.tableId ? { id: typedOrder.tableId, name: typedOrder.tableName } : null,
      };
    });
    console.log('DEBUG: /api/orders/active result =', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 