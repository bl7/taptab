"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Home, User, Menu as MenuIcon, X, Plus, Minus, CheckCircle, Sparkles, Flame, Star, Tag } from "lucide-react";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// BADGE_CONFIG (copy from PublicMenu.tsx)
const BADGE_CONFIG = {
  new: { icon: Sparkles, color: 'bg-green-100 text-green-800', label: 'New' },
  spicy: { icon: Flame, color: 'bg-red-100 text-red-800', label: 'Spicy' },
  popular: { icon: Star, color: 'bg-yellow-100 text-yellow-800', label: 'Popular' },
  'chef-special': { icon: Tag, color: 'bg-purple-100 text-purple-800', label: "Chef's Special" },
};

export default function MobileOrderPage() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams?.get("rid") ?? '';
  const tableId = searchParams?.get("tid") ?? '';
  type MenuItem = { itemId: string; name: string; price: number; description?: string; imageUrl?: string; badge?: string };
  type MenuCategory = { categoryId: string; categoryName: string; items: MenuItem[] };
  type Restaurant = { name?: string; logoUrl?: string };
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');
  // Cart state
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  // Item modal state
  const [itemModal, setItemModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });
  // Cart drawer state
  const [cartOpen, setCartOpen] = useState(false);
  // Order stepper state
  const [orderStep, setOrderStep] = useState<'cart' | 'confirm' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/public/menu?restaurantId=${restaurantId}`).then((res) => res.json()),
      fetch(`/api/public/restaurant?restaurantId=${restaurantId}`).then((res) => res.json()),
    ])
      .then(([menuData, restaurantData]) => {
        setMenu(menuData.layout || []);
        setRestaurant(restaurantData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load menu");
        setLoading(false);
      });
  }, [restaurantId]);

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

  // Cart logic
  function addToCart(item: MenuItem, quantity: number) {
    setCart(prev => {
      const existing = prev.find(ci => ci.item.itemId === item.itemId);
      if (existing) {
        return prev.map(ci => ci.item.itemId === item.itemId ? { ...ci, quantity: ci.quantity + quantity } : ci);
      }
      return [...prev, { item, quantity }];
    });
  }
  function updateCart(itemId: string, quantity: number) {
    setCart(prev => prev.map(ci => ci.item.itemId === itemId ? { ...ci, quantity: Math.max(1, quantity) } : ci));
  }
  function removeFromCart(itemId: string) {
    setCart(prev => prev.filter(ci => ci.item.itemId !== itemId));
  }
  function cartCount() {
    return cart.reduce((sum, ci) => sum + ci.quantity, 0);
  }
  function cartTotal() {
    return cart.reduce((sum, ci) => sum + ci.quantity * ci.item.price, 0);
  }

  // Modal open/close helpers
  function openItemModal(item: MenuItem) {
    setItemModal({ open: true, item });
  }
  function closeItemModal() {
    setItemModal({ open: false, item: null });
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

  // --- Main UI ---
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {restaurant?.logoUrl && (
            <Image src={restaurant.logoUrl} alt="Logo" width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{restaurant?.name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Table {tableId}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation - horizontal scrollable chips */}
      <nav className="sticky top-[56px] z-10 bg-white px-2 py-2 border-b border-gray-100 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {menu.map((category) => (
          <button
            key={category.categoryId}
            onClick={() => setSelectedCategory(category.categoryId)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.categoryId
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.categoryName}
          </button>
        ))}
      </nav>

      {/* Menu Content - mobile-first card layout */}
      <main className="flex-1 w-full max-w-lg mx-auto px-2 pb-24 pt-2">
        {menu
          .filter((cat) => !selectedCategory || cat.categoryId === selectedCategory)
          .map((cat) => (
            <div key={cat.categoryId} className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2 px-1">{cat.categoryName}</h2>
              <div className="flex flex-col gap-3">
                {cat.items.map((item) => {
                  const badgeConfig = BADGE_CONFIG[item.badge as keyof typeof BADGE_CONFIG];
                  return (
                    <button
                      key={item.itemId}
                      className="bg-white rounded-xl shadow border border-gray-100 flex items-center gap-3 p-3 active:scale-95 transition-transform relative"
                      onClick={() => openItemModal(item)}
                    >
                      {/* Floating badge on top left */}
                      {item.badge && badgeConfig && (
                        <span className={`absolute top-2 left-2 z-10 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow ${badgeConfig.color}`}
                          style={{ pointerEvents: 'none' }}
                        >
                          <badgeConfig.icon className="h-3 w-3 mr-1" />
                          {badgeConfig.label}
                        </span>
                      )}
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                          No Image
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 truncate text-base">{item.name}</span>
                          {/* Remove old inline badge here */}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mb-1 line-clamp-2">{item.description}</div>
                        )}
                        <div className="text-blue-600 font-bold text-lg">{getCurrencySymbol(currency)}{item.price.toFixed(2)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </main>

      {/* Floating Cart Button */}
      <button
        className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform"
        onClick={() => setCartOpen(true)}
        aria-label="View cart"
      >
        <ShoppingCart className="w-8 h-8" />
        {cartCount() > 0 && (
          <span className="absolute top-2 right-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold shadow">
            {cartCount()}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      <Transition.Root show={cartOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setCartOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0"
            leave="ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-y-full" enterTo="translate-y-0"
                  leave="transform transition ease-in-out duration-200"
                  leaveFrom="translate-y-0" leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md mx-auto bg-white rounded-t-2xl shadow-xl p-6 flex flex-col h-[80vh]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Your Cart</h2>
                      <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    {cart.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <ShoppingCart className="w-12 h-12 mb-2" />
                        <div>Your cart is empty</div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                          {cart.map(({ item, quantity }) => (
                            <div key={item.itemId} className="flex items-center gap-3 border-b pb-2">
                              {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                                <div className="text-xs text-gray-500">{getCurrencySymbol(currency)}{item.price.toFixed(2)} each</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center" onClick={() => updateCart(item.itemId, quantity - 1)} disabled={quantity <= 1}><Minus className="w-4 h-4" /></button>
                                <span className="font-semibold text-gray-900 min-w-[20px] text-center">{quantity}</span>
                                <button className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center" onClick={() => updateCart(item.itemId, quantity + 1)}><Plus className="w-4 h-4" /></button>
                              </div>
                              <button className="ml-2 text-gray-400 hover:text-red-600" onClick={() => removeFromCart(item.itemId)}><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between text-lg font-bold mb-2">
                            <span>Total</span>
                            <span>{getCurrencySymbol(currency)}{cartTotal().toFixed(2)}</span>
                          </div>
                          <button
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg mt-2 shadow-lg active:scale-95 transition"
                            onClick={() => setOrderStep('confirm')}
                          >
                            Place Order
                          </button>
                        </div>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Item Modal */}
      <Transition.Root show={itemModal.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeItemModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0"
            leave="ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-y-full" enterTo="translate-y-0"
                  leave="transform transition ease-in-out duration-200"
                  leaveFrom="translate-y-0" leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md mx-auto bg-white rounded-t-2xl shadow-xl p-6 flex flex-col">
                    {itemModal.item && (
                      <>
                        <div className="flex items-center gap-4 mb-4">
                          {itemModal.item.imageUrl ? (
                            <Image src={itemModal.item.imageUrl} alt={itemModal.item.name} width={80} height={80} className="w-20 h-20 rounded-lg object-cover" />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-lg text-gray-900 mb-1">{itemModal.item.name}</div>
                            <div className="text-blue-600 font-bold text-lg">{getCurrencySymbol(currency)}{itemModal.item.price.toFixed(2)}</div>
                            {itemModal.item.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{itemModal.item.description}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="font-semibold text-gray-900">Quantity</span>
                          <QuantitySelector onChange={q => setItemModal(im => im.item ? { ...im, quantity: q } : im)} />
                        </div>
                        <button
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg active:scale-95 transition"
                          onClick={() => {
                            addToCart(itemModal.item!, 1);
                            closeItemModal();
                          }}
                        >
                          Add to Cart
                        </button>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Order Confirmation Stepper */}
      <Transition.Root show={orderStep === 'confirm'} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOrderStep('cart')}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0"
            leave="ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-y-full" enterTo="translate-y-0"
                  leave="transform transition ease-in-out duration-200"
                  leaveFrom="translate-y-0" leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md mx-auto bg-white rounded-t-2xl shadow-xl p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Confirm Your Order</h2>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-1">Your Name (optional)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {cart.map(({ item, quantity }) => (
                        <div key={item.itemId} className="flex items-center gap-3 border-b pb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                            <div className="text-xs text-gray-500">{getCurrencySymbol(currency)}{item.price.toFixed(2)} x {quantity}</div>
                          </div>
                          <div className="font-bold text-blue-600">{getCurrencySymbol(currency)}{(item.price * quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold mb-2">
                        <span>Total</span>
                        <span>{getCurrencySymbol(currency)}{cartTotal().toFixed(2)}</span>
                      </div>
                      <button
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg mt-2 shadow-lg active:scale-95 transition"
                        onClick={() => setOrderStep('success')}
                      >
                        Confirm & Place Order
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Order Success Screen */}
      <Transition.Root show={orderStep === 'success'} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { setOrderStep('cart'); setCart([]); }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0"
            leave="ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-y-full" enterTo="translate-y-0"
                  leave="transform transition ease-in-out duration-200"
                  leaveFrom="translate-y-0" leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md mx-auto bg-white rounded-t-2xl shadow-xl p-8 flex flex-col items-center justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-center">Order Placed!</h2>
                    <p className="text-gray-600 text-center mb-6">Thank you for your order. We&apos;ll start preparing it right away.</p>
                    <button
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg active:scale-95 transition"
                      onClick={() => { setOrderStep('cart'); setCart([]); }}
                    >
                      Back to Menu
                    </button>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sticky Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-lg">
        <button className="flex flex-col items-center text-blue-600 font-bold">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-xs">Menu</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <MenuIcon className="w-6 h-6 mb-1" />
          <span className="text-xs">Orders</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <User className="w-6 h-6 mb-1" />
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    </div>
  );
}

// QuantitySelector component for item modal
function QuantitySelector({ onChange }: { onChange: (q: number) => void }) {
  const [qty, setQty] = useState(1);
  useEffect(() => { onChange(qty); }, [qty, onChange]);
  return (
    <div className="flex items-center gap-2">
      <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-lg" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
      <span className="font-bold text-lg min-w-[24px] text-center">{qty}</span>
      <button className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg" onClick={() => setQty(q => q + 1)}>+</button>
    </div>
  );
} 