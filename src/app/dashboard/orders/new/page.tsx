"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Egg, Soup, Utensils, Sandwich, Pizza, Leaf, GlassWater, Flame, Sprout, Baby, Fish, Drumstick, Beef, X } from 'lucide-react';
import Image from "next/image";

export default function NewOrderPage() {
  type Table = { id: string; name: string; description?: string; restaurantId?: string };
  type MenuItem = { itemId: string; name: string; price: number; quantity?: number; imageUrl?: string; description?: string };
  type ActiveOrder = { id: string; items?: MenuItem[]; note?: string; status?: string; createdAt?: string; total?: number; customerName?: string; tableId?: string };
  type MenuCategory = { categoryId: string; categoryName: string; items: MenuItem[]; visible?: boolean };
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<{ itemId: string; name: string; price: number; quantity: number; imageUrl?: string; description?: string }[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalNote, setModalNote] = useState("");
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
      console.log('Menu categories:', menuData.layout);
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
        // setOrderSelectionModalOpen(true); // This line is removed
      } else if (Array.isArray(data) && data.length === 1) {
        setActiveOrderId(data[0].id);
        setEditingExisting(true);
        // When mapping cart items from API, look up imageUrl/description from menu:
        setCart(data[0].items ? data[0].items.map((i: MenuItem & { quantity: number }) => {
          const menuItem = menu.flatMap((cat) => cat.items).find((m) => m.itemId === i.itemId);
          return { itemId: i.itemId, name: i.name, price: i.price, quantity: i.quantity, imageUrl: menuItem?.imageUrl, description: menuItem?.description };
        }) : []);
        setNote(data[0].note || "");
      } else {
        setActiveOrderId(null);
        setEditingExisting(false);
        setCart([]);
        setNote("");
      }
    }
    checkActiveOrders();
  }, [selectedTable, restaurantId, menu]); // Added 'menu' to dependency array

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  function updateQuantity(itemId: string, quantity: number) {
    setCart((prev) => prev.map((i) => i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity), imageUrl: i.imageUrl ?? undefined, description: i.description ?? undefined } : i));
  }

  function openItemModal(item: MenuItem) {
    setSelectedItem(item);
    const cartItem = cart.find((i) => i.itemId === item.itemId);
    setModalQty(cartItem?.quantity ?? 1);
    setModalNote("");
  }
  function closeItemModal() {
    setSelectedItem(null);
  }
  function handleAddFromModal() {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === selectedItem!.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === selectedItem!.itemId
            ? { ...i, quantity: modalQty, description: selectedItem!.description, imageUrl: selectedItem!.imageUrl }
            : i
        );
      }
      return [...prev, { ...selectedItem!, quantity: modalQty, description: selectedItem!.description, imageUrl: selectedItem!.imageUrl }];
    });
    closeItemModal();
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

  // Category icon mapping for all common restaurant categories
  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Breakfast: <Egg className="w-5 h-5 mr-1" />, // Egg
    Soups: <Soup className="w-5 h-5 mr-1" />, // Soup bowl
    Pasta: <Utensils className="w-5 h-5 mr-1" />, // Noodles (fallback)
    "Main Course": <Utensils className="w-5 h-5 mr-1" />, // Plate (fallback)
    Burgers: <Sandwich className="w-5 h-5 mr-1" />, // Burger
    Pizza: <Pizza className="w-5 h-5 mr-1" />, // Pizza
    Salad: <Leaf className="w-5 h-5 mr-1" />, // Leaf
    Drinks: <GlassWater className="w-5 h-5 mr-1" />, // Glass
    Desserts: <Utensils className="w-5 h-5 mr-1" />, // Cupcake (fallback)
    Sides: <Utensils className="w-5 h-5 mr-1" />, // Fries (fallback)
    Sushi: <Utensils className="w-5 h-5 mr-1" />, // Sushi (fallback)
    Grill: <Flame className="w-5 h-5 mr-1" />, // Flame
    Vegan: <Sprout className="w-5 h-5 mr-1" />, // Sprout
    Kids: <Baby className="w-5 h-5 mr-1" />, // Baby
    Seafood: <Fish className="w-5 h-5 mr-1" />, // Fish
    Chicken: <Drumstick className="w-5 h-5 mr-1" />, // Drumstick
    Steak: <Beef className="w-5 h-5 mr-1" />, // Beef/Steak
    Rice: <Utensils className="w-5 h-5 mr-1" />, // Rice bowl (fallback)
    Noodles: <Utensils className="w-5 h-5 mr-1" />, // Noodles (fallback)
  };
  const DEFAULT_CATEGORY_ICON = <Utensils className="w-5 h-5 mr-1" />; // Fallback

  // --- Filtered menu logic ---
  const filteredMenu = selectedCategory
    ? menu.filter((cat) => cat.categoryName === selectedCategory && cat.items.length > 0)
    : menu.filter((cat) => cat.items.length > 0);

  // --- UI ---
  return (
    <div className="min-h-screen bg-[#F6F8F7] flex flex-row">
      {/* Left: Menu and Categories */}
      <div className="flex-1 flex flex-col">
        {/* Top bar: Search and Categories */}
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex items-center bg-white rounded-xl shadow px-4 py-2 border border-gray-200 mt-4 mb-2 mx-4">
            <svg className="w-5 h-5 text-[#00932A] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2} /><path d="M21 21l-4.35-4.35" strokeWidth={2} /></svg>
            <input
              type="text"
              placeholder="Search Product here..."
              className="flex-1 bg-transparent outline-none text-base text-gray-900"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Category Tabs */}
          <div className="flex gap-3 w-full overflow-x-auto px-4 pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex flex-col items-center px-5 py-3 rounded-xl font-semibold text-base border transition-all whitespace-nowrap shadow-sm ${selectedCategory === null ? "bg-[#00932A] text-white" : "bg-gray-100 text-gray-700 hover:bg-[#00932A]/10"}`}
            >
              <span className="mb-1">{DEFAULT_CATEGORY_ICON}</span>
              <span>All</span>
              <span className="text-xs font-normal mt-1">{menu.reduce((sum, c) => sum + c.items.length, 0)} Items</span>
            </button>
            {menu.filter(cat => cat.items.length > 0).map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCategory(cat.categoryName)}
                className={`flex flex-col items-center px-5 py-3 rounded-xl font-semibold text-base border transition-all whitespace-nowrap shadow-sm ${selectedCategory === cat.categoryName ? "bg-[#00932A] text-white" : "bg-gray-100 text-gray-700 hover:bg-[#00932A]/10"}`}
              >
                <span className="mb-1">{CATEGORY_ICONS[cat.categoryName] || DEFAULT_CATEGORY_ICON}</span>
                <span>{cat.categoryName}</span>
                <span className="text-xs font-normal mt-1">{cat.items.length} Items</span>
              </button>
            ))}
          </div>
        </div>
        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-4">
          {filteredMenu.flatMap((cat) =>
            cat.items.map((item) => {
              const cartItem = cart.find((i) => i.itemId === item.itemId);
              return (
                <div
                  key={item.itemId}
                  className={`bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col p-4 hover:shadow-lg transition group cursor-pointer relative ${cartItem ? 'ring-2 ring-[#00932A]' : ''}`}
                  onClick={() => openItemModal(item)}
                >
                  {item.imageUrl && (
                    <div className="w-full h-32 mb-2 relative rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1 mb-1">
                      <h3 className="font-semibold text-base text-gray-900 flex-1 truncate">{item.name}</h3>
                    </div>
                    <span className="font-bold text-[#00932A] text-lg">${item.price.toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Item Modal */}
        <Transition.Root show={!!selectedItem} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-50" onClose={closeItemModal}>
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
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-auto">
                  {selectedItem && (
                    <>
                      {selectedItem.imageUrl && (
                        <div className="w-full h-48 mb-4 relative rounded-xl overflow-hidden bg-gray-100">
                          <Image src={selectedItem.imageUrl} alt={selectedItem.name} fill className="object-cover" />
                        </div>
                      )}
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedItem.name}</h2>
                      <p className="text-gray-600 text-sm mb-4">{selectedItem.description}</p>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="font-bold text-[#00932A] text-lg">${selectedItem.price.toFixed(2)}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 flex items-center justify-center text-base"
                            onClick={() => setModalQty(q => Math.max(1, q - 1))}
                          >-</button>
                          <span className="font-semibold text-gray-900 min-w-[24px] text-center">{modalQty}</span>
                          <button
                            className="w-8 h-8 rounded-full bg-[#00932A] text-white hover:bg-green-700 flex items-center justify-center text-base"
                            onClick={() => setModalQty(q => q + 1)}
                          >+</button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Add note..."
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00932A] mb-4"
                        value={modalNote}
                        onChange={e => setModalNote(e.target.value)}
                      />
                      <button
                        className="w-full py-3 rounded-xl bg-[#00932A] text-white font-bold text-lg shadow hover:bg-green-700 transition"
                        onClick={handleAddFromModal}
                      >
                        Add to Order
                      </button>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
        {/* Table Orders at Bottom */}
        <div className="fixed bottom-0 left-56 right-[400px] z-30 flex items-center gap-4 px-6 py-3 bg-white border-t border-gray-200 overflow-x-auto" style={{ minHeight: '64px', maxWidth: 'calc(100vw - 400px - 14rem)' }}>
          {activeOrders.filter(order => order.tableId === selectedTable).map((order) => (
              <button
                key={order.id}
              className={`flex flex-col items-start min-w-[180px] max-w-xs px-5 py-3 bg-yellow-50 border border-yellow-200 text-yellow-900 font-semibold text-base hover:bg-yellow-100 transition whitespace-nowrap ${activeOrderId === order.id ? 'ring-2 ring-[#00932A]' : ''}`}
                onClick={async () => {
                  setActiveOrderId(order.id);
                  setEditingExisting(true);
                  // Fetch full order details (with items)
                  const res = await fetch(`/api/orders/${order.id}`);
                  const data = await res.json();
                  setCart(data.items.map((i: MenuItem & { quantity: number }) => {
                    const menuItem = menu.flatMap((cat) => cat.items).find((m) => m.itemId === i.itemId);
                    return { itemId: i.itemId, name: i.name, price: i.price, quantity: i.quantity, imageUrl: menuItem?.imageUrl, description: menuItem?.description };
                  }));
                  setNote(data.note || "");
                }}
              >
              <span className="font-bold text-base truncate w-full text-left">{order.customerName || 'No Name'}</span>
              <span className="text-xs text-gray-600 mt-1">{order.items?.length || 0} items</span>
              </button>
            ))}
          </div>
      </div>
      {/* Right: Order Summary */}
      <form className="w-[400px] bg-white border-l border-gray-100 shadow-lg min-h-screen h-screen flex flex-col sticky top-0" onSubmit={handleSubmit}>
        {/* Table selection styled as card */}
        <div className="border-b border-gray-100 p-6">
          <div className="rounded-2xl bg-gray-50 p-4 flex items-center mb-2">
            <div className="flex-1">
              <div className="text-lg font-extrabold text-gray-900">Table</div>
              <select
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#00932A]"
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
          </div>
        </div>
        {/* Cart Items */}
        <div className="flex-1 p-6 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-gray-400 text-center mt-16">Cart is empty.</div>
          ) : (
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div key={item.itemId} className="flex items-center gap-3 bg-white rounded-2xl shadow border border-gray-100 px-3 py-2">
                  {item.imageUrl?.length ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="object-cover" />
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-base mb-1">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-bold text-[#00932A] text-base">${item.price.toFixed(2)}</span>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-[#00932A] hover:text-white flex items-center justify-center text-base"
                          onClick={() => updateQuantity(item.itemId, (item.quantity ?? 1) - 1)}
                        >-</button>
                        <span className="font-semibold text-gray-900 min-w-[16px] text-center text-base">{item.quantity}</span>
                        <button
                          className="w-6 h-6 rounded-full bg-[#00932A] text-white hover:bg-green-700 flex items-center justify-center text-base"
                          onClick={() => updateQuantity(item.itemId, (item.quantity ?? 1) + 1)}
                        >+</button>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-[#00932A] text-lg min-w-[60px] text-right">${(item.price * (item.quantity ?? 1)).toFixed(2)}</div>
                  <button className="ml-2 text-gray-400 hover:text-red-600" onClick={() => removeFromCart(item.itemId)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Sticky total & place order button together */}
        <div className="border-t border-gray-100 bg-white sticky bottom-0 z-10 flex flex-col gap-2 p-6">
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="flex justify-between text-gray-700 mb-1 text-base">
              <span>Sub Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 mb-1 text-base">
              <span>Tax 5%</span>
              <span>${(total * 0.05).toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-gray-300 my-2" />
            <div className="flex justify-between items-center text-xl font-extrabold text-gray-900">
              <span>Total Amount</span>
              <span>${(total * 1.05).toFixed(2)}</span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#00932A] text-white font-bold text-xl shadow hover:bg-green-700 transition"
            disabled={submitting || cart.length === 0}
          >
            {submitting ? "Submitting..." : "Place Order"}
          </button>
          {error && <div className="text-red-600 text-base mt-1 text-center">{error}</div>}
          {success && <div className="text-[#00932A] text-base mt-1 text-center font-semibold">Order placed! Thank you.</div>}
        </div>
      </form>
    </div>
  );
} 