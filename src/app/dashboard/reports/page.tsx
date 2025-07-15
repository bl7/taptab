"use client";
import { useEffect, useState } from "react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Add type definitions at the top:
type Item = { name: string; quantity: number };
type TopItem = { name: string; sold: number };
type Cancellation = { id: string; reason: string };
type Order = {
  id: string;
  createdAt: string | Date;
  total?: number;
  status: string;
  items?: Item[];
  cancellationReason?: string;
};
type Summary = {
  totalSales: number;
  totalOrders: number;
  avgOrder: number;
  statusBreakdown: Record<string, number>;
  topItems: TopItem[];
  cancellations: Cancellation[];
  revenueByDay: Record<string, number>;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Compute date range
  const now = new Date();
  let fromDate: Date, toDate: Date;
  if (dateFilter === 'today') {
    fromDate = startOfDay(now);
    toDate = endOfDay(now);
  } else if (dateFilter === 'week') {
    fromDate = startOfWeek(now, { weekStartsOn: 1 });
    toDate = endOfWeek(now, { weekStartsOn: 1 });
  } else if (dateFilter === 'month') {
    fromDate = startOfMonth(now);
    toDate = endOfMonth(now);
  } else {
    fromDate = customRange.from ? startOfDay(parseISO(customRange.from)) : startOfDay(now);
    toDate = customRange.to ? endOfDay(parseISO(customRange.to)) : endOfDay(now);
  }

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to load orders');
        } else {
          setError('Failed to load orders');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders by date
    const filtered = orders.filter(order => {
      const created = typeof order.createdAt === 'string' ? parseISO(order.createdAt) : new Date(order.createdAt);
      return isWithinInterval(created, { start: fromDate, end: toDate });
    });
    // Compute summary
    const totalSales = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = filtered.length;
    const avgOrder = totalOrders ? totalSales / totalOrders : 0;
    const statusBreakdown: Record<string, number> = {};
    filtered.forEach(o => {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    });
    // Top items
    const itemMap: Record<string, { name: string; sold: number }> = {};
    filtered.forEach(o => {
      (o.items || []).forEach((item: Item) => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, sold: 0 };
        itemMap[item.name].sold += item.quantity;
      });
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.sold - a.sold).slice(0, 5);
    // Cancellations
    const cancellations = filtered.filter(o => o.status === 'CANCELED' && o.cancellationReason).map(o => ({ id: o.id, reason: o.cancellationReason || "" }));
    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    filtered.forEach(o => {
      const day = format(typeof o.createdAt === 'string' ? parseISO(o.createdAt) : new Date(o.createdAt), 'yyyy-MM-dd');
      revenueByDay[day] = (revenueByDay[day] || 0) + (o.total || 0);
    });
    setSummary({ totalSales, totalOrders, avgOrder, statusBreakdown, topItems, cancellations, revenueByDay });
  }, [orders, fromDate, toDate]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-forest mb-6">Reports & Analytics</h1>
      {/* Date Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <button onClick={() => setDateFilter('today')} className={`px-4 py-2 rounded-xl font-semibold border transition-all duration-150 shadow-sm ${dateFilter === 'today' ? 'bg-[#00932A] text-white border-[#00932A]' : 'bg-white text-gray-900 border-gray-200 hover:bg-[#00932A]/10'}`}>Today</button>
        <button onClick={() => setDateFilter('week')} className={`px-4 py-2 rounded-xl font-semibold border transition-all duration-150 shadow-sm ${dateFilter === 'week' ? 'bg-[#00932A] text-white border-[#00932A]' : 'bg-white text-gray-900 border-gray-200 hover:bg-[#00932A]/10'}`}>This Week</button>
        <button onClick={() => setDateFilter('month')} className={`px-4 py-2 rounded-xl font-semibold border transition-all duration-150 shadow-sm ${dateFilter === 'month' ? 'bg-[#00932A] text-white border-[#00932A]' : 'bg-white text-gray-900 border-gray-200 hover:bg-[#00932A]/10'}`}>This Month</button>
        <button onClick={() => setDateFilter('custom')} className={`px-4 py-2 rounded-xl font-semibold border transition-all duration-150 shadow-sm ${dateFilter === 'custom' ? 'bg-[#00932A] text-white border-[#00932A]' : 'bg-white text-gray-900 border-gray-200 hover:bg-[#00932A]/10'}`}>Custom</button>
        {dateFilter === 'custom' && (
          <>
            <input type="date" value={customRange.from} onChange={e => setCustomRange(r => ({ ...r, from: e.target.value }))} className="ml-2 px-2 py-1 border border-gray-200 rounded-xl" />
            <span className="mx-1">to</span>
            <input type="date" value={customRange.to} onChange={e => setCustomRange(r => ({ ...r, to: e.target.value }))} className="px-2 py-1 border border-gray-200 rounded-xl" />
          </>
        )}
      </div>
      {loading ? (
        <div className="text-forest/60">Loading reports...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : summary && (
        <div className="space-y-8">
          {/* Sales Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col items-center">
              <div className="text-3xl font-bold text-green-700 mb-1">${summary.totalSales.toLocaleString()}</div>
              <div className="text-gray-700 font-semibold">Total Sales</div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col items-center">
              <div className="text-3xl font-bold text-blue-700 mb-1">{summary.totalOrders}</div>
              <div className="text-gray-700 font-semibold">Total Orders</div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col items-center">
              <div className="text-3xl font-bold text-yellow-700 mb-1">${summary.avgOrder.toFixed(2)}</div>
              <div className="text-gray-700 font-semibold">Avg Order Value</div>
            </div>
          </div>
          {/* Order Breakdown */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-forest mb-4">Order Breakdown</h2>
            <div className="flex gap-6">
              {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex flex-col items-center">
                  <div className="text-xl font-bold text-forest">{Number(count)}</div>
                  <div className="text-xs text-gray-500 uppercase">{status}</div>
                </div>
              ))}
            </div>
            {/* Placeholder for chart */}
            <div className="mt-6 h-32 bg-mint/40 rounded flex items-center justify-center text-mint">[Order Status Chart]</div>
          </div>
          {/* Top Items */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-forest mb-4">Top Selling Items</h2>
            <ul className="divide-y divide-mint">
              {summary.topItems.map((item: TopItem) => (
                <li key={item.name} className="py-2 flex justify-between">
                  <span className="font-semibold text-forest">{item.name}</span>
                  <span className="text-gray-700">{item.sold} sold</span>
                </li>
              ))}
            </ul>
            {/* Placeholder for chart */}
            <div className="mt-6 h-32 bg-mint/40 rounded flex items-center justify-center text-mint">[Top Items Chart]</div>
          </div>
          {/* Revenue by Day */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-forest mb-4">Revenue by Day</h2>
            <ul className="divide-y divide-mint">
              {Object.entries(summary.revenueByDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, amount]) => (
                <li key={day} className="py-2 flex justify-between">
                  <span className="font-semibold text-forest">{day}</span>
                  <span className="text-gray-700">${(amount as number).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {/* Placeholder for chart */}
            <div className="mt-6 h-32 bg-mint/40 rounded flex items-center justify-center text-mint">[Revenue Chart]</div>
          </div>
          {/* Cancellations */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-forest mb-4">Cancellations</h2>
            <ul className="divide-y divide-mint">
              {summary.cancellations.map((c: Cancellation) => (
                <li key={c.id} className="py-2 flex justify-between">
                  <span className="font-mono text-red-700">{c.id}</span>
                  <span className="text-gray-700">{c.reason}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Export Placeholder */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col items-center">
            <button className="bg-[#00932A] text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition">Export as CSV</button>
            <div className="text-gray-400 mt-2">[Export and more analytics coming soon]</div>
          </div>
        </div>
      )}
    </div>
  );
} 