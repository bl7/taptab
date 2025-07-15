"use client";
import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Search, X } from "lucide-react";
import Image from 'next/image';
import React from "react";

// 1. Category icon mapping (move outside component, type as React.ReactNode)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Breakfast: <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Soups: <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Pasta: <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>,
  "Main Course": <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Burgers: <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>,
  // Add more as needed
};

export default function OrderPageClient() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams!.get("rid");
  const tableId = searchParams!.get("tid");
  type MenuItem = { itemId: string; name: string; price: number; description?: string; imageUrl?: string; badge?: string; quantity?: number; note?: string; allergens?: string[]; dietaryTags?: string[] };
  type MenuCategory = { categoryId: string; categoryName: string; items: MenuItem[] };
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<(MenuItem & { quantity: number })[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("taptap_cart");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState("");
  // Add state for customer name
  const [customerName, setCustomerName] = useState("");
  const [customerNameError, setCustomerNameError] = useState("");
  const [currency, setCurrency] = useState<string>('USD');

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taptap_cart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/public/menu?restaurantId=${restaurantId}`).then((res) => res.json()),
      fetch(`/api/tables?restaurantId=${restaurantId}`).then((res) => res.json()),
    ])
      .then(([menuData, tablesData]) => {
        setMenu(menuData.layout || []);
        // Find table number
        if (tablesData && tablesData.tables && tableId) {
          const found = tablesData.tables.find((t: { id: string }) => t.id === tableId);
          setTableNumber(found?.name || null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load menu");
        setLoading(false);
      });
  }, [restaurantId, tableId]);

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/public/restaurant?restaurantId=${restaurantId}`)
      .then(res => res.json())
      .then(data => setCurrency(data.currency || 'USD'));
  }, [restaurantId]);

  function getCurrencySymbol(currency?: string) {
    switch (currency) {
      case 'NPR':
        return '₨';
      case 'USD':
        return '$';
      case 'GBP':
        return '£';
      default:
        return '$';
    }
  }

  // Get all categories from menu
  const categories = menu.map((cat: { categoryId: string; categoryName: string }) => ({
    id: cat.categoryId,
    name: cat.categoryName,
  }));

  const cartTotal = cart.reduce((sum, i) => sum + (i.quantity ?? 1) * i.price, 0);

  // Filtered menu logic
  const filteredMenu = menu
    .filter((cat) => !selectedCategory || cat.categoryId === selectedCategory)
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId ? { ...i, quantity: (i.quantity ?? 1) + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, note: "" }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  function updateQuantity(itemId: string, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.itemId !== itemId);
      return prev.map((i) =>
        i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
      );
    });
  }

  function updateNote(itemId: string, note: string) {
    setCart((prev) =>
      prev.map((i) =>
        i.itemId === itemId ? { ...i, note } : i
      )
    );
  }

  function openItemModal(item: MenuItem) {
    setSelectedItem(item);
    const cartItem = cart.find((i) => i.itemId === item.itemId);
    setModalQty(cartItem?.quantity ?? 1);
    setModalNote(cartItem?.note ?? "");
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
            ? { ...i, quantity: modalQty, note: modalNote }
            : i
        );
      }
      return [...prev, { ...selectedItem!, quantity: modalQty, note: modalNote }];
    });
    closeItemModal();
  }

  async function handleConfirmOrder() {
    if (!customerName.trim()) {
      setCustomerNameError("Please enter your name before placing the order.");
      return;
    }
    setOrderLoading(true);
    setOrderError(null);
    setCustomerNameError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          items: cart.map((i) => ({ itemId: i.itemId, quantity: typeof i.quantity === 'number' ? i.quantity : 1, note: i.note })),
          createdVia: "CUSTOMER",
          customerName: customerName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(true);
        setCart([]);
        setCustomerName("");
      } else {
        setOrderError(data.error || "Failed to submit order");
      }
    } catch {
      setOrderError("Failed to submit order");
    } finally {
      setOrderLoading(false);
    }
  }

  if (!restaurantId || !tableId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Order Link</h1>
          <p className="text-gray-600">Please scan the QR code at your table to access the menu.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Unavailable</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8F7] flex flex-col md:flex-row">
      {/* Left: Menu and Categories */}
      <div className="flex-1 flex flex-col px-4 py-6 max-w-4xl mx-auto">
        {/* Search */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex-1 flex items-center bg-white rounded-xl shadow px-4 py-3 border border-gray-200">
            <Search className="w-5 h-5 text-green-600 mr-2" />
            <input
              type="text"
              placeholder="Search for dishes..."
              className="flex-1 bg-transparent outline-none text-base text-gray-900"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Category Tabs - full width row below search */}
          <div className="flex gap-2 w-full overflow-x-auto py-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center px-5 py-2 rounded-full font-semibold text-base shadow-sm border transition-all whitespace-nowrap
                ${selectedCategory === null ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-green-50"}`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center px-5 py-2 rounded-full font-semibold text-base shadow-sm border transition-all whitespace-nowrap
                  ${selectedCategory === cat.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-green-50"}`}
              >
                {CATEGORY_ICONS[cat.name] || <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
          {filteredMenu.flatMap((cat) =>
            cat.items.map((item) => {
              const cartItem = cart.find((i) => i.itemId === item.itemId);
              return (
                <div
                  key={item.itemId}
                  className="bg-white rounded-xl shadow border border-gray-100 flex flex-col p-2 hover:shadow-md transition group cursor-pointer relative"
                  onClick={() => openItemModal(item)}
                >
                  {item.imageUrl && (
                    <div className="w-full h-20 mb-2 relative rounded-md overflow-hidden bg-gray-100">
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
                      <h3 className="font-semibold text-xs text-gray-900 flex-1 truncate">{item.name}</h3>
                      {item.badge && (
                        <span className="ml-1 px-1 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">{item.badge}</span>
                      )}
                    </div>
                    <span className="font-bold text-green-700 text-sm">{getCurrencySymbol(currency)}{item.price.toFixed(2)}</span>
                    {/* Quantity control on card */}
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-[#00932A] hover:text-white flex items-center justify-center text-xs"
                        onClick={e => { e.stopPropagation(); updateQuantity(item.itemId, (cartItem?.quantity ?? 1) - 1); }}
                        disabled={!cartItem}
                      >-</button>
                      <span className="font-semibold text-gray-900 min-w-[16px] text-center text-xs">{cartItem?.quantity ?? 0}</span>
                      <button
                        className="w-6 h-6 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center text-xs"
                        onClick={e => { e.stopPropagation(); addToCart(item); }}
                      >+</button>
                    </div>
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
                        <span className="font-bold text-green-700 text-lg">{getCurrencySymbol(currency)}{selectedItem.price.toFixed(2)}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 flex items-center justify-center text-base"
                            onClick={() => setModalQty(q => Math.max(1, q - 1))}
                          >-</button>
                          <span className="font-semibold text-gray-900 min-w-[24px] text-center">{modalQty}</span>
                          <button
                            className="w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center text-base"
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
                        className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-lg shadow hover:bg-green-700 transition"
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
      </div>
      {/* Right: Cart Summary (desktop) - sticky bottom total & button */}
      <div className="hidden md:flex flex-col w-[400px] bg-white border-l border-gray-100 shadow-lg min-h-screen sticky top-0 p-0">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Table header (no order type tabs) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-2xl font-extrabold text-gray-900 leading-tight">Table {tableNumber || "-"}</div>
                <div className="text-sm text-gray-400">Guest</div>
              </div>
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#00932A]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 20h9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="text-gray-400 text-center mt-16">Your cart is empty.</div>
          ) : (
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div key={item.itemId} className="flex items-center gap-3 bg-white rounded-2xl shadow border border-gray-100 px-3 py-2">
                  {item.imageUrl && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-sm mb-1">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-bold text-[#00932A]">{getCurrencySymbol(currency)}{item.price.toFixed(2)}</span>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-[#00932A] hover:text-white flex items-center justify-center text-xs"
                          onClick={() => updateQuantity(item.itemId, (item.quantity ?? 1) - 1)}
                          disabled={!item}
                        >-</button>
                        <span className="font-semibold text-gray-900 min-w-[16px] text-center text-xs">{item.quantity}</span>
                        <button
                          className="w-6 h-6 rounded-full bg-[#00932A] text-white hover:bg-green-700 flex items-center justify-center text-xs"
                          onClick={() => updateQuantity(item.itemId, (item.quantity ?? 1) + 1)}
                        >+</button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Add note..."
                      className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00932A]"
                      value={item.note || ""}
                      onChange={e => updateNote(item.itemId, e.target.value)}
                    />
                  </div>
                  <div className="font-bold text-[#00932A] text-base min-w-[60px] text-right">{getCurrencySymbol(currency)}{(item.price * (item.quantity ?? 1)).toFixed(2)}</div>
                  <button className="ml-2 text-gray-400 hover:text-red-600" onClick={() => removeFromCart(item.itemId)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Sticky total & place order button together */}
        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex flex-col gap-4">
          <div className="rounded-2xl bg-gray-50 p-5">
            <div className="flex justify-between text-gray-700 mb-2 text-sm">
              <span>Sub Total</span>
              <span>{getCurrencySymbol(currency)}{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 mb-2 text-sm">
              <span>Tax 5%</span>
              <span>{getCurrencySymbol(currency)}{(cartTotal * 0.05).toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-gray-300 my-3" />
            <div className="flex justify-between items-center text-lg font-extrabold text-gray-900">
              <span>Total Amount</span>
              <span>{getCurrencySymbol(currency)}{(cartTotal * 1.05).toFixed(2)}</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00932A]"
              placeholder="Enter your name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              disabled={orderLoading}
            />
            {customerNameError && <div className="text-red-600 text-xs mt-1">{customerNameError}</div>}
          </div>
          <button
            className="w-full py-3 rounded-full bg-[#00932A] text-white font-bold text-lg shadow hover:bg-green-700 transition"
            style={{ backgroundColor: '#00932A' }}
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || orderLoading || !customerName.trim()}
          >
            {orderLoading ? "Placing Order..." : "Place Order"}
          </button>
          {orderError && <div className="text-red-600 text-sm mt-2 text-center">{orderError}</div>}
          {orderSuccess && <div className="text-[#00932A] text-sm mt-2 text-center font-semibold">Order placed! Thank you.</div>}
        </div>
      </div>
      {/* Cart Modal (mobile) - similar sticky total & button at bottom */}
      <Transition.Root show={cartModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50" onClose={setCartModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-end md:items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 translate-y-8" enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-8"
            >
              <Dialog.Panel className="w-full max-w-md rounded-t-2xl md:rounded-2xl bg-white p-6 shadow-xl mx-auto">
                <Dialog.Title className="text-lg font-bold text-green-700 mb-4">Your Order</Dialog.Title>
                {cart.length === 0 ? (
                  <div className="text-gray-400 text-center mt-16">Your cart is empty.</div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.itemId} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                          {item.imageUrl && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                              <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                            <div className="text-xs text-gray-500">{getCurrencySymbol(currency)}{item.price.toFixed(2)} x {item.quantity}</div>
                          </div>
                          <button className="text-gray-400 hover:text-red-600" onClick={() => removeFromCart(item.itemId)}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <div className="flex justify-between text-gray-700 mb-2">
                        <span>Subtotal</span>
                        <span>{getCurrencySymbol(currency)}{cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 mb-2">
                        <span>Tax 5%</span>
                        <span>{getCurrencySymbol(currency)}{(cartTotal * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-700">
                        <span>Total</span>
                        <span>{getCurrencySymbol(currency)}{(cartTotal * 1.05).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      className="w-full py-3 rounded-lg bg-green-600 text-white font-bold text-lg shadow hover:bg-green-700 transition"
                      onClick={handleConfirmOrder}
                      disabled={cart.length === 0 || orderLoading}
                    >
                      {orderLoading ? "Placing Order..." : "Place Order"}
                    </button>
                    {orderError && <div className="text-red-600 text-sm mt-2 text-center">{orderError}</div>}
                    {orderSuccess && <div className="text-green-700 text-sm mt-2 text-center font-semibold">Order placed! Thank you.</div>}
                  </>
                )}
                <button className="mt-6 w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition" onClick={() => setCartModalOpen(false)}>
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
} 