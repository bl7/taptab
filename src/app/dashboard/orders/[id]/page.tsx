"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReceiptRenderer from "@/components/ReceiptRenderer";

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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [order, setOrder] = useState<Order | null>(null);
  type CartItem = { itemId: string; name: string; price: number; quantity: number; note?: string };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      setError(null);
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setCart(data.items.map((i: { itemId: string; name: string; price: number; quantity: number; note?: string }) => ({ itemId: i.itemId, name: i.name, price: i.price, quantity: i.quantity, note: i.note })));
        setNote(data.note || "");
      } else {
        setError(data.error || "Failed to load order");
      }
    }
    if (id) fetchOrder();
  }, [id]);

  // Removed unused fetchReceipt

  function updateQuantity(itemId: string, quantity: number) {
    setCart((prev) => prev.map((i) => i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity) } : i));
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity })) }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setSuccess("Order updated.");
      } else {
        setError(data.error || "Failed to update order");
      }
    } catch {
      setError("Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  async function handlePay() {
    setPaying(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/orders/${id}/pay`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, isLocked: true, paid: true, status: prev.status } : null);
        setSuccess("Order marked as paid and locked.");
      } else {
        setError(data.error || "Failed to mark as paid");
      }
    } catch {
      setError("Failed to mark as paid");
    } finally {
      setPaying(false);
    }
  }

  async function handlePrint() {
    setPrinting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/orders/${id}/print`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error("Failed to print");
      }
      if (data.warning) {
        setSuccess(`Receipt generated successfully! ${data.warning}`);
      } else {
        setSuccess("Receipt printed successfully.");
      }
      // Removed unused refreshReceipt
    } catch (error) {
      console.error("Print error:", error);
      setError("Failed to print receipt");
    } finally {
      setPrinting(false);
    }
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-600">Loading order...</div>;
  }

  return (
    <div className="min-h-screen bg-mint flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-4xl border border-mint flex flex-col md:flex-row gap-8">
        {/* Left: Order details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-forest mb-4">Order Details</h1>
          <div className="mb-4">
            <div className="text-forest font-semibold">Order ID: <span className="font-mono">{order.id}</span></div>
            <div className="text-forest">Table: {order.table?.name || "-"}</div>
            <div className="text-forest">Status: <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-mint text-forest border border-forest/10">{order.status}</span></div>
            <div className="text-forest">Paid: {order.paid ? "Yes" : "No"}</div>
            <div className="text-forest">Locked: {order.isLocked ? "Yes" : "No"}</div>
            <div className="text-forest">Created: {new Date(order.createdAt).toLocaleString()}</div>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-mint rounded-lg shadow p-6 border border-mint mb-4">
              <h3 className="text-xl font-bold mb-4 text-forest">Items</h3>
              {cart.length === 0 ? (
                <div className="text-forest/60">No items in order.</div>
              ) : (
                <ul className="divide-y divide-mint mb-4">
                  {cart.map((item) => (
                    <li key={item.itemId} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-forest">{item.name}</div>
                        <div className="text-sm text-forest/60">${item.price.toFixed(2)} × {item.quantity}</div>
                        {item.note && (
                          <div className="text-xs text-blue-700 mt-1">Note: {item.note}</div>
                        )}
                      </div>
                      {!order.isLocked && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-2 py-1 bg-mint border border-mint rounded text-forest"
                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="text-forest font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            className="px-2 py-1 bg-mint border border-mint rounded text-forest"
                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="ml-2 text-red-600"
                            onClick={() => removeFromCart(item.itemId)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-forest">Total:</span>
                <span className="text-xl font-bold text-forest">${total.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-forest">Note</label>
              <textarea
                className="w-full border border-mint rounded p-2 text-forest bg-mint"
                value={note}
                onChange={e => setNote(e.target.value)}
                disabled={order.isLocked}
              />
            </div>
            {!order.isLocked && (
              <button
                type="submit"
                className="bg-forest text-mint font-bold py-3 px-6 rounded-lg hover:bg-forest/90 transition text-lg shadow-md disabled:opacity-60"
                disabled={saving || cart.length === 0}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </form>
          <div className="mt-6 space-y-3">
            <button
              className="w-full bg-forest text-mint font-bold py-3 rounded-lg hover:bg-forest/90 transition text-lg shadow-md disabled:opacity-60"
              disabled={printing}
              onClick={handlePrint}
            >
              {printing ? "Printing..." : "Print Receipt"}
            </button>
            {!order.isLocked && (
              <button
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition text-lg shadow-md disabled:opacity-60"
                disabled={paying}
                onClick={handlePay}
              >
                {paying ? "Marking as Paid..." : "Mark as Paid & Lock Order"}
              </button>
            )}
          </div>
        </div>
        {/* Right: Receipt PNG */}
        <div className="w-full md:w-96 flex-shrink-0 flex flex-col items-center">
          <h2 className="text-lg font-bold text-forest mb-2">Receipt Preview</h2>
          <div className="w-full">
            <ReceiptRenderer order={order} />
          </div>
        </div>
      </div>
    </div>
  );
} 