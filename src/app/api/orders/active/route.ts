import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    console.log('DEBUG: /api/orders/active restaurantId =', restaurantId);
    if (!restaurantId) {
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }
    // Fetch orders with items and table info
    const { rows: orders } = await pool.query(`
      SELECT o.*, t.name as "tableName", t.id as "tableId"
      FROM "Order" o
      LEFT JOIN "Table" t ON o."tableId" = t.id
      WHERE o."restaurantId" = $1 AND o.status IN ('PENDING', 'PREPARING')
      ORDER BY o."createdAt" DESC
    `, [restaurantId]);
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