"use client";
import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, ArrowLeft, Search, X } from "lucide-react";
import Image from 'next/image';
import MenuPublicView from "@/components/MenuPublicView";

export default function OrderPageClient() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams!.get("rid");
  const tableId = searchParams!.get("tid");
  type MenuItem = { itemId: string; name: string; price: number; description?: string; imageUrl?: string; badge?: string; quantity?: number; note?: string; allergens?: string[]; dietaryTags?: string[] };
  type MenuCategory = { categoryId: string; categoryName: string; items: MenuItem[] };
  type Restaurant = { name?: string; logoUrl?: string };
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
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
      fetch(`/api/public/restaurant?restaurantId=${restaurantId}`).then((res) => res.json()),
      fetch(`/api/tables?restaurantId=${restaurantId}`).then((res) => res.json()),
    ])
      .then(([menuData, restaurantData, tablesData]) => {
        setMenu(menuData.layout || []);
        setRestaurant(restaurantData);
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

  // Get all categories from menu
  const categories = menu.map((cat: { categoryId: string; categoryName: string }) => ({
    id: cat.categoryId,
    name: cat.categoryName,
  }));

  // Cart badge count
  const cartCount = cart.reduce((sum, i) => sum + (i.quantity ?? 1), 0);
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

  const ALLERGENS = ["nuts", "dairy", "gluten", "soy", "egg", "shellfish"];
  const DIETARY_TAGS = ["vegan", "vegetarian", "gluten-free", "halal", "kosher"];

  function getBadges(item: MenuItem) {
    const badges = [];
    if (item.allergens?.length) {
      for (const allergen of item.allergens) {
        if (ALLERGENS.includes(allergen)) badges.push({ type: "allergen", value: allergen });
      }
    }
    if (item.dietaryTags?.length) {
      for (const tag of item.dietaryTags) {
        if (DIETARY_TAGS.includes(tag)) badges.push({ type: "dietary", value: tag });
      }
    }
    return badges;
  }

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
    setCart((prev) =>
      prev.map((i) =>
        i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    );
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
    setModalQty(1);
  }
  function closeItemModal() {
    setSelectedItem(null);
  }
  function handleAddFromModal() {
    for (let i = 0; i < modalQty; i++) addToCart(selectedItem!);
    closeItemModal();
  }

  async function handleConfirmOrder() {
    setOrderLoading(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          items: cart.map((i) => ({ itemId: i.itemId, quantity: typeof i.quantity === 'number' ? i.quantity : 1, note: i.note })),
          createdVia: "CUSTOMER",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(true);
        setCart([]);
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-black leading-tight">{restaurant?.name || "Menu"}</h1>
        </div>
        <button className="relative p-2 rounded-full hover:bg-gray-100" onClick={() => setCartModalOpen(true)} aria-label="View cart">
          <ShoppingCart className="w-6 h-6 text-black" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs font-bold shadow">{cartCount}</span>
          )}
        </button>
      </header>
      {/* Search Bar */}
      <div className="sticky top-[56px] z-10 bg-white px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for dishes..."
          className="flex-1 bg-transparent outline-none text-sm px-2 text-black"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Category Chips */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-black hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-black hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* Menu Grid */}
      <MenuPublicView
        menu={filteredMenu}
        cart={cart}
        onItemClick={openItemModal}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onUpdateNote={updateNote}
        getBadges={getBadges}
      />
      {/* Modal for single item view */}
      <Transition.Root show={!!selectedItem} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-[100] overflow-y-auto" onClose={closeItemModal}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity z-[99]" aria-hidden="true" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-md p-0 z-[100]">
                {selectedItem && (
                  <>
                    <div className="relative">
                      {selectedItem.imageUrl ? (
                        <Image src={selectedItem.imageUrl} alt={selectedItem.name} width={224} height={140} className="w-full h-56 object-cover" />
                      ) : (
                        <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-4xl text-gray-400">🍽️</div>
                      )}
                      <button
                        className="absolute top-3 right-3 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100"
                        onClick={closeItemModal}
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedItem.name}</h2>
                      <div className="text-blue-600 font-semibold text-lg mb-2">₹ {selectedItem.price?.toFixed(2) ?? "--"}</div>
                      {selectedItem.description && (
                        <div className="text-gray-600 mb-3 text-sm">{selectedItem.description}</div>
                      )}
                      {/* Badges, allergens, etc. can go here if available */}
                      <div className="flex items-center gap-4 mt-4 mb-6 justify-center">
                        <button
                          className="w-10 h-10 rounded-full bg-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-300"
                          onClick={() => setModalQty(q => Math.max(1, q - 1))}
                        >
                          -
                        </button>
                        <span className="font-semibold text-xl w-8 text-center">{modalQty}</span>
                        <button
                          className="w-10 h-10 rounded-full bg-blue-600 text-white text-2xl font-bold hover:bg-blue-700"
                          onClick={() => setModalQty(q => q + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-lg shadow hover:bg-blue-700 transition"
                        onClick={handleAddFromModal}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Cart Modal */}
      <Transition.Root show={cartModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-[100] overflow-y-auto" onClose={() => setCartModalOpen(false)}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity z-[99]" aria-hidden="true" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-md z-[100]">
                {orderSuccess ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
                    <p className="text-gray-600 mb-4">Thank you for your order. We&apos;ll start preparing it right away.</p>
                    <button
                      className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-lg shadow hover:bg-blue-700 transition mt-2"
                      onClick={() => { setOrderSuccess(false); setCartModalOpen(false); }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                      <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                      <button onClick={() => setCartModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close cart">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                      {cart.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">Your cart is empty.</div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.itemId} className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                            {item.imageUrl ? (
                              <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xl text-gray-400">🍽️</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                              <div className="text-blue-600 font-bold">₹ {item.price?.toFixed(2) ?? "--"}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="w-8 h-8 rounded-full bg-gray-200 text-lg font-bold text-gray-700 hover:bg-gray-300"
                                onClick={() =>
                                  item.quantity === 1
                                    ? removeFromCart(item.itemId)
                                    : updateQuantity(item.itemId, item.quantity - 1)
                                }
                              >
                                -
                              </button>
                              <span className="font-semibold text-base w-6 text-center">{typeof item.quantity === 'number' ? item.quantity : 1}</span>
                              <button
                                className="w-8 h-8 rounded-full bg-blue-600 text-white text-lg font-bold hover:bg-blue-700"
                                onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              className="ml-2 text-gray-400 hover:text-red-500"
                              onClick={() => removeFromCart(item.itemId)}
                              aria-label="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                      <div className="font-semibold text-lg text-gray-900">Total</div>
                      <div className="text-blue-600 font-bold text-lg">₹ {cartTotal.toFixed(2)}</div>
                    </div>
                    {orderError && <div className="px-6 text-red-600 text-sm mb-2">{orderError}</div>}
                    <div className="px-6 pb-6">
                      <button
                        className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
                        disabled={cart.length === 0 || orderLoading}
                        onClick={handleConfirmOrder}
                      >
                        {orderLoading ? "Placing Order..." : "Confirm Order"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Order Success Fullscreen Modal */}
      <Transition.Root show={orderSuccess} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-[100] overflow-y-auto" onClose={() => setOrderSuccess(false)}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" aria-hidden="true" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block align-middle bg-white rounded-2xl text-center overflow-hidden shadow-2xl transform transition-all w-full max-w-sm p-8 z-[101]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h2>
                <p className="text-gray-600 mb-6">Thank you for your order. We&apos;ll start preparing it right away.</p>
                <button
                  className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-lg shadow hover:bg-blue-700 transition"
                  onClick={() => setOrderSuccess(false)}
                >
                  Done
                </button>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Sticky Bottom Bar: Table number and confirm button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="font-semibold text-black text-base">Table {tableNumber || "-"}</div>
        <div className="flex items-center gap-4">
          <div className="text-base font-semibold text-black">
            {cartCount} item{cartCount !== 1 ? "s" : ""} | ₹ {cartTotal.toFixed(2)}
          </div>
          <button
            className="bg-blue-600 text-white rounded-full px-6 py-2 font-bold shadow hover:bg-blue-700 transition disabled:opacity-50"
            disabled={cartCount === 0 || orderLoading}
            onClick={handleConfirmOrder}
          >
            {orderLoading ? "Placing..." : "Confirm"}
          </button>
        </div>
        {orderError && <div className="absolute left-1/2 -translate-x-1/2 bottom-16 bg-red-100 text-red-700 px-4 py-2 rounded shadow text-sm">{orderError}</div>}
        {orderSuccess && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-16 bg-green-100 text-green-700 px-4 py-2 rounded shadow text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Order placed!
          </div>
        )}
      </div>
    </div>
  );
} 