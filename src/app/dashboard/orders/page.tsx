"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  table?: { name?: string };
  status: string;
  paid: boolean;
  isLocked: boolean;
  createdAt: string;
  items: Array<{ itemId: string; name: string; price: number; quantity: number; note?: string }>;
  total: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      // Get restaurantId from session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const restaurantId = session?.user?.restaurantId;
      if (!restaurantId) {
        setError("No restaurant found in session");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      } else {
        setError(data.error || "Failed to load orders");
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-forest">Orders</h1>
        <Link href="/dashboard/orders/new" className="bg-forest text-mint px-4 py-2 rounded font-semibold hover:bg-forest/90 transition">+ New Order</Link>
      </div>
      {loading ? (
        <div className="text-forest/60">Loading orders...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-forest/60">No orders found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-mint rounded shadow">
            <thead>
              <tr className="bg-mint text-forest">
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Table</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-mint/40">
                  <td className="px-4 py-2 font-mono text-forest">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-forest">{order.table?.name || "-"}</td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-mint text-forest border border-forest/10">{order.status}</span>
                  </td>
                  <td className="px-4 py-2 text-forest">${order.total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-forest">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-forest underline hover:text-forest/80 ml-2">View/Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 