import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    const tableId = searchParams.get('tableId');
    if (!restaurantId || !tableId) {
      return NextResponse.json({ error: 'Missing restaurantId or tableId' }, { status: 400 });
    }
    const { rows: orders } = await pool.query(
      `SELECT * FROM "Order" WHERE "restaurantId" = $1 AND "tableId" = $2 AND status IN ('PENDING', 'PREPARING') ORDER BY "createdAt" DESC`,
      [restaurantId, tableId]
    );
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
    }
    const result = orders.map((order: unknown) => {
      const typedOrder = order as { id: string };
      return {
        ...typedOrder,
        items: itemsByOrder[typedOrder.id] || [],
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching active orders for table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 