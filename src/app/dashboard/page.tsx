import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import pool from '@/lib/pg';
import { authOptions } from '../api/auth/[...nextauth]/authOptions';

export default async function DashboardHome() {
  // Get session
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; restaurantId?: string };
  if (!user?.id) {
    redirect('/auth/login');
  }
  let restaurant: { name?: string } | null = null;
  let dbError: string | null = null;
  try {
    const { rows } = await pool.query('SELECT name FROM "Restaurant" WHERE "userId" = $1', [user.id]);
    restaurant = rows[0];
  } catch (err) {
    console.error('Database error in dashboard:', err);
    dbError = (err as Error)?.message || 'Database error';
  }
  // If there's a database error, redirect to login
  if (dbError) {
    redirect('/auth/login');
  }
  // If no restaurant found, redirect to onboarding
  if (!restaurant || !restaurant.name) {
    redirect('/dashboard/onboarding');
  }
  // Fetch active orders directly from the database
  const restaurantId = user.restaurantId;
  type Order = { id: string; status: string; createdAt: string; total: number; table?: { id: string; name: string } | null; isLocked?: boolean; paid?: boolean };
  let orders: Order[] = [];
  if (restaurantId) {
    const { rows: dbOrders } = await pool.query(`
      SELECT o.*, t.name as "tableName", t.id as "tableId"
      FROM "Order" o
      LEFT JOIN "Table" t ON o."tableId" = t.id
      WHERE o."restaurantId" = $1 AND o.status IN ('PENDING', 'PREPARING')
      ORDER BY o."createdAt" DESC
    `, [restaurantId]);
    // Fetch items for all orders
    const orderIds = dbOrders.map((o: Order) => o.id);
    const itemsByOrder: Record<string, unknown[]> = {};
    if (orderIds.length > 0) {
      const { rows: items } = await pool.query(
        'SELECT * FROM "OrderItem" WHERE "orderId" = ANY($1)',
        [orderIds]
      );
      items.forEach((item: { orderId: string }) => {
        if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
        itemsByOrder[item.orderId].push(item);
      });
    }
    orders = dbOrders.map((order: Order & { tableId?: string; tableName?: string }) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
      table: order.tableId ? { id: order.tableId, name: order.tableName as string } : null,
    }));
  }
  // Group by table
  const tableMap = new Map();
  orders.forEach((order: Order) => {
    if (!order.isLocked && !order.paid) {
      if (!tableMap.has(order.table?.id)) {
        tableMap.set(order.table?.id, { table: order.table, orders: [] });
      }
      (tableMap.get(order.table?.id).orders as Order[]).push(order);
    }
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4 text-forest drop-shadow">Unpaid Tables & New Orders</h1>
      {tableMap.size === 0 ? (
        <div className="text-forest/60">No unpaid tables or new orders.</div>
      ) : (
        <div className="space-y-8">
          {[...tableMap.values()].map(({ table, orders }) => (
            <div key={table?.id} className="bg-white rounded-2xl shadow-lg p-6 border border-mint">
              <div className="font-bold text-lg text-forest mb-2">Table: {table?.name || '-'}</div>
              <ul>
                {orders.map((order: Order) => (
                  <li key={order.id} className="mb-2 border-b border-mint/40 pb-2">
                    <div className="flex flex-wrap gap-2 justify-between items-center">
                      <span className="text-forest font-mono">Order: {order.id.slice(0, 8)}</span>
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-mint text-forest mr-2 border border-forest/10">{order.status}</span>
                      <span className="text-xs text-forest/60">{new Date(order.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-forest">${order.total.toFixed(2)}</span>
                      <a href={`/dashboard/orders/${order.id}`} className="text-forest underline hover:text-forest/80 ml-2">View/Edit</a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 