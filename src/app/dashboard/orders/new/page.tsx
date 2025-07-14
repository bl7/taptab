"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function NewOrderPage() {
  type Table = { id: string; name: string; description?: string; restaurantId?: string };
  type MenuItem = { itemId: string; name: string; price: number };
  type ActiveOrder = { id: string; items?: MenuItem[]; note?: string; status?: string; createdAt?: string; total?: number };
  type MenuCategory = { itemId: string; name: string; items: MenuItem[] };
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<{ itemId: string; name: string; price: number; quantity: number }[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [orderSelectionModalOpen, setOrderSelectionModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      // Get restaurantId from session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const rid = session?.user?.restaurantId;
      setRestaurantId(rid);
      if (!rid) return;
      // Fetch tables
      const tablesRes = await fetch(`/api/tables?restaurantId=${rid}`);
      const tablesData = await tablesRes.json();
      setTables(tablesData.tables || []);
      // Fetch menu
      const menuRes = await fetch(`/api/public/menu?restaurantId=${rid}`);
      const menuData = await menuRes.json();
      setMenu(menuData.layout || []);
    }
    fetchData();
  }, []);

  // On table select, check for active orders
  useEffect(() => {
    async function checkActiveOrders() {
      if (!restaurantId || !selectedTable) return;
      const res = await fetch(`/api/orders/active-for-table?restaurantId=${restaurantId}&tableId=${selectedTable}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 1) {
        setActiveOrders(data);
        setOrderSelectionModalOpen(true);
      } else if (Array.isArray(data) && data.length === 1) {
        setActiveOrderId(data[0].id);
        setEditingExisting(true);
        setCart(data[0].items ? data[0].items.map((i: MenuItem & { quantity: number }) => ({ itemId: i.itemId, name: i.name, price: i.price, quantity: i.quantity })) : []);
        setNote(data[0].note || "");
      } else {
        setActiveOrderId(null);
        setEditingExisting(false);
        setCart([]);
        setNote("");
      }
    }
    checkActiveOrders();
  }, [selectedTable, restaurantId]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        return prev.map((i) => i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item.itemId, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  function updateQuantity(itemId: string, quantity: number) {
    setCart((prev) => prev.map((i) => i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity) } : i));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let res, data;
      if (editingExisting && activeOrderId) {
        res = await fetch(`/api/orders/${activeOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity })) }),
        });
        data = await res.json();
      } else {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            tableId: selectedTable,
            note,
            items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
            createdVia: "STAFF",
          }),
        });
        data = await res.json();
      }
      if (res.ok) {
        setSuccess({ orderId: data.id });
        setCart([]);
        setNote("");
        setActiveOrderId(null);
        setEditingExisting(false);
      } else {
        setError(data.error || "Failed to submit order");
      }
    } catch {
      setError("Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-green-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-black mb-2">Order {editingExisting ? "Updated" : "Created"}!</h3>
        <p className="text-black">Order ID: <span className="font-mono">{success.orderId}</span></p>
        <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700" onClick={() => router.push(`/dashboard/orders/${success.orderId}`)}>View Order</button>
        <button className="mt-2 ml-2 bg-gray-200 text-black px-4 py-2 rounded font-semibold hover:bg-gray-300" onClick={() => { setSuccess(null); setCart([]); }}>New Order</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-black mb-6">New Order</h1>
      {/* Modal for selecting active order if multiple exist */}
      <Transition show={orderSelectionModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOrderSelectionModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                <Dialog.Title className="text-lg font-bold mb-4 text-black">Multiple Active Orders for This Table</Dialog.Title>
                <div className="space-y-4">
                  {activeOrders.map((order) => {
                    const itemCount = order.items ? (order.items as Array<MenuItem & { quantity: number }>).reduce((sum, i) => sum + (i.quantity || 0), 0) : 0;
                    return (
                      <div key={order.id} className="border rounded p-3 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-black">Order: {order.id.slice(0, 8)}</span>
                          <span className="text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}</span>
                          <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-gray-200 text-black mr-2">{order.status}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Items: {itemCount}</span>
                          <span>Total: ${order.total?.toFixed(2) ?? '--'}</span>
                        </div>
                        <div className="text-sm text-gray-700">{order.items ? (order.items as Array<MenuItem & { quantity: number }>).map(i => `${i.quantity} x${i.name}`).join(", ") : "-"}</div>
                        {order.note && <div className="text-xs text-blue-700">Note: {order.note}</div>}
                        <button
                          className="mt-2 bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700"
                          onClick={async () => {
                            setActiveOrderId(order.id);
                            setEditingExisting(true);
                            // Fetch full order details (with items)
                            const res = await fetch(`/api/orders/${order.id}`);
                            const data = await res.json();
                            setCart(data.items.map((i: MenuItem & { quantity: number }) => ({ itemId: i.itemId, name: i.name, price: i.price, quantity: i.quantity })));
                            setNote(data.note || "");
                            setOrderSelectionModalOpen(false);
                          }}
                        >
                          Add to This Order
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    className="bg-gray-200 text-black px-4 py-2 rounded font-semibold hover:bg-gray-300"
                    onClick={() => {
                      setActiveOrderId(null);
                      setEditingExisting(false);
                      setCart([]);
                      setNote("");
                      setOrderSelectionModalOpen(false);
                    }}
                  >
                    Create New Order
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-1 text-black">Table</label>
          <select
            className="w-full border rounded p-2 text-black"
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
            required
          >
            <option value="">Select a table...</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        {editingExisting && (
          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
            Editing existing active order for this table. Add or update items and click &quot;Place Order&quot; to update.
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menu.map((category) => (
            <div key={category.itemId}>
              <h2 className="text-lg font-semibold mb-2 text-black">{category.name}</h2>
              {(Array.isArray(category.items) ? category.items : []).map((item: MenuItem) => {
                const cartItem = cart.find((i) => i.itemId === item.itemId);
                return (
                  <div key={item.itemId} className="flex items-center justify-between mb-2 p-2 border rounded bg-white">
                    <div>
                      <div className="font-medium text-black">{item.name}</div>
                      <div className="text-sm text-gray-700">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!cartItem ? (
                        <button
                          type="button"
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={() => addToCart(item)}
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <span className="text-green-700 font-semibold">In Cart</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <CartSummary
          cart={cart}
          total={total}
          note={note}
          setNote={setNote}
          error={error}
          submitting={submitting}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
        />
      </form>
    </div>
  );
}

function CartSummary({ cart, total, note, setNote, error, submitting, updateQuantity, removeFromCart }: {
  cart: { itemId: string; name: string; price: number; quantity: number }[];
  total: number;
  note: string;
  setNote: (v: string) => void;
  error: string | null;
  submitting: boolean;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mt-8">
      <h3 className="text-xl font-bold mb-4 text-black">Cart</h3>
      {cart.length === 0 ? (
        <div className="text-gray-500">Cart is empty.</div>
      ) : (
        <ul className="divide-y divide-gray-200 mb-4">
          {cart.map((item) => (
            <li key={item.itemId} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium text-black">{item.name}</div>
                <div className="text-sm text-gray-700">${item.price.toFixed(2)} × {item.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded text-black"
                  onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="text-black font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded text-black"
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
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-black">Total:</span>
        <span className="text-xl font-bold text-black">${total.toFixed(2)}</span>
      </div>
      <textarea
        className="w-full border rounded p-2 mt-2 text-black"
        placeholder="Add a note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button
        type="submit"
        className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition text-lg shadow-md disabled:opacity-60"
        disabled={submitting || cart.length === 0}
      >
        {submitting ? "Submitting..." : "Place Order"}
      </button>
    </div>
  );
} 