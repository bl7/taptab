"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { isWithinInterval, parseISO } from 'date-fns';

type Order = {
  id: string;
  table?: { name?: string };
  status: string;
  paid: boolean;
  isLocked: boolean;
  createdAt: string;
  items: Array<{ itemId: string; name: string; price: number; quantity: number; note?: string }>;
  total: number;
  customerName?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<string | null>(null); // order id
  const [printing, setPrinting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'range'>('today');
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  async function handlePrint(orderId: string, type: 'kitchen' | 'customer') {
    setPrinting(true);
    try {
      await fetch(`/api/orders/${orderId}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch {
      // Optionally show error
    } finally {
      setPrinting(false);
      setPrintModalOpen(null);
    }
  }

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

  // Date filter logic
  function isInDateRange(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    if (dateFilter === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return date >= startOfWeek && date < endOfWeek;
    }
    if (dateFilter === 'month') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    if (dateFilter === 'range' && rangeStart && rangeEnd) {
      const start = parseISO(rangeStart);
      const end = parseISO(rangeEnd);
      return isWithinInterval(date, { start, end });
    }
    return true;
  }

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (!isInDateRange(order.createdAt)) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
    if (statusFilter === 'completed') return order.status === 'COMPLETED';
    return true;
  });
  // Group orders by table name
  const grouped = filteredOrders.reduce((acc, order) => {
    const table = order.table?.name || "No Table";
    if (!acc[table]) acc[table] = [];
    acc[table].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-forest">Orders</h1>
        <Link href="/dashboard/orders/new" className="bg-forest text-mint px-4 py-2 rounded font-semibold hover:bg-forest/90 transition">+ New Order</Link>
      </div>
      <div className="flex items-center gap-4 mb-8">
        <label className="font-semibold text-forest">Show:</label>
        <select
          className="border border-mint rounded px-3 py-2 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-mint"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
        >
          <option value="pending">Pending & Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <label className="font-semibold text-forest ml-6">Date:</label>
        <select
          className="border border-mint rounded px-3 py-2 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-mint"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value as 'today' | 'week' | 'month' | 'range')}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="range">Custom Range</option>
        </select>
        {dateFilter === 'range' && (
          <>
            <input
              type="date"
              className="border border-mint rounded px-3 py-2 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-mint ml-2"
              value={rangeStart}
              onChange={e => setRangeStart(e.target.value)}
              max={rangeEnd || undefined}
            />
            <span className="mx-1">to</span>
            <input
              type="date"
              className="border border-mint rounded px-3 py-2 text-forest bg-white focus:outline-none focus:ring-2 focus:ring-mint"
              value={rangeEnd}
              onChange={e => setRangeEnd(e.target.value)}
              min={rangeStart || undefined}
            />
          </>
        )}
      </div>
      {loading ? (
        <div className="text-forest/60">Loading orders...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-forest/60">No orders found.</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([table, orders]) => (
            <div key={table}>
              <h2 className="text-xl font-bold text-forest mb-4">Table: {table}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow border border-mint p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-lg text-forest truncate">{order.customerName || "No Name"}</div>
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-mint text-forest border border-forest/10">{order.status}</span>
                    </div>
                    <div className="text-forest/80 mb-1">{order.items.length} items</div>
                    <div className="text-forest font-semibold mb-1">Total: ${order.total.toFixed(2)}</div>
                    <div className="text-forest/60 text-sm mb-2">{new Date(order.createdAt).toLocaleString()}</div>
                    <div className="flex gap-2 mt-auto">
                      <Link href={`/dashboard/orders/${order.id}`} className="flex-1 bg-forest text-mint font-bold py-2 rounded-lg hover:bg-forest/90 transition text-center">View/Edit</Link>
                      <button
                        className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
                        onClick={() => setPrintModalOpen(order.id)}
                        disabled={printing}
                      >
                        Print Receipt
                      </button>
                    </div>
                    <Transition.Root show={printModalOpen === order.id} as={Fragment}>
                      <Dialog as="div" className="fixed inset-0 z-50" onClose={() => setPrintModalOpen(null)}>
                        <Transition.Child
                          as={Fragment}
                          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                        >
                          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                        </Transition.Child>
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                          <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                          >
                            <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-auto">
                              <Dialog.Title className="text-lg font-bold text-forest mb-4">Print Receipt</Dialog.Title>
                              <div className="flex flex-col gap-4">
                                <button
                                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition"
                                  onClick={() => handlePrint(order.id, 'kitchen')}
                                  disabled={printing}
                                >
                                  {printing ? 'Printing...' : 'Print Kitchen Receipt'}
                                </button>
                                <button
                                  className="w-full py-3 rounded-lg bg-green-600 text-white font-bold text-lg shadow hover:bg-green-700 transition"
                                  onClick={() => handlePrint(order.id, 'customer')}
                                  disabled={printing}
                                >
                                  {printing ? 'Printing...' : 'Print Customer Receipt'}
                                </button>
                                <button
                                  className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition mt-2"
                                  onClick={() => setPrintModalOpen(null)}
                                  disabled={printing}
                                >
                                  Cancel
                                </button>
                              </div>
                            </Dialog.Panel>
                          </Transition.Child>
                        </div>
                      </Dialog>
                    </Transition.Root>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 