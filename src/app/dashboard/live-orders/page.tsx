"use client";
import { useEffect, useRef, useState } from "react";
import { Filter, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const WS_URL = typeof window !== 'undefined' ? `ws://${window.location.host}/api/socket` : '';

// Add interfaces at the top
interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table?: { name?: string };
  createdAt: string;
  status: string;
  items: OrderItem[];
  total: number;
  paid?: boolean;
}

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const wsRef = useRef<WebSocket | null>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      // Get restaurantId from session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const restaurantId = session?.user?.restaurantId;
      if (!restaurantId) {
        alert("No restaurant found in session");
        return;
      }
      const res = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      } else {
        alert(data.error || "Failed to load orders");
      }
    }
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "new_order") {
        setOrders((prev) => [msg.order, ...prev.filter((o: Order) => o.id !== msg.order.id)]);
        if (soundRef.current) {
          soundRef.current.currentTime = 0;
          soundRef.current.play();
        }
      }
    };
    return () => ws.close();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PREPARING':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 bg-mint min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-forest">Orders Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-forest/60" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-mint rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-forest focus:border-transparent bg-white text-forest"
            >
              <option value="all">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
        </div>
      </div>
      <audio ref={soundRef} src="/order-bell.mp3" preload="auto" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-mint p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-bold text-lg text-forest">Table {order.table?.name || "-"}</div>
                <div className="text-sm text-forest/60">{order.createdAt}</div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div key={item.itemId} className="flex justify-between text-sm">
                  <span className="text-forest">{item.quantity}  {item.name}</span>
                  <span className="text-forest font-medium">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-mint pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-forest">Total</span>
                <span className="text-xl font-bold text-forest">${order.total.toFixed(2)}</span>
              </div>
              {order.paid && (
                <div className="text-sm text-green-600 mt-1">  Paid</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 