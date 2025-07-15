"use client";
import { useState, useEffect } from "react";

type MenuItem = { itemId: string; name: string; price: number; description?: string };
type MenuCategory = { categoryId: string; categoryName: string; items: MenuItem[] };

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

export default function OrderCart({ menu, restaurantId, tableId, selectedCategory }: { menu: MenuCategory[]; restaurantId: string; tableId: string; selectedCategory?: string | null }) {
  const [cart, setCart] = useState<{ itemId: string; name: string; price: number; quantity: number }[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/public/restaurant?restaurantId=${restaurantId}`)
      .then(res => res.json())
      .then(data => setCurrency(data.currency || 'USD'));
  }, [restaurantId]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          note,
          items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
          createdVia: "CUSTOMER",
        }),
      });
      const data: { id: string } | { error: string } = await res.json();
      if (res.ok && 'id' in data) {
        setSuccess({ orderId: data.id });
        setCart([]);
        setNote("");
      } else if ('error' in data) {
        setError(data.error || "Failed to submit order");
      } else {
        setError("Failed to submit order");
      }
    } catch {
      setError("Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h3>
          <p className="text-gray-600 mb-6">Thank you for your order. We&apos;ll start preparing it right away.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="font-mono text-lg font-bold text-gray-900">{success.orderId}</p>
          </div>
          <p className="text-sm text-gray-500">You&apos;ll receive a notification when your order is ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Menu Section */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menu
            .filter((category) => !selectedCategory || category.categoryId === selectedCategory)
            .map((category) => (
              <div key={category.categoryId}>
                <h2 className="text-lg font-semibold mb-2 text-black">{category.categoryName}</h2>
                {category.items.map((item) => {
                  const cartItem = cart.find((i) => i.itemId === item.itemId);
                  return (
                    <div key={item.itemId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{item.name}</div>
                          <div className="text-sm text-gray-600 mb-2">{item.description || "Delicious item from our menu"}</div>
                          <div className="text-lg font-bold text-blue-600">{getCurrencySymbol(currency)}{item.price.toFixed(2)}</div>
                        </div>
                        <div className="ml-4">
                          {!cartItem ? (
                            <button
                              type="button"
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                              onClick={() => addToCart(item)}
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
                                onClick={() => updateQuantity(item.itemId, cartItem.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="font-semibold text-gray-900 min-w-[20px] text-center">{cartItem.quantity}</span>
                              <button
                                type="button"
                                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition"
                                onClick={() => updateQuantity(item.itemId, cartItem.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
        {/* On mobile, show cart summary at the bottom */}
        <div className="block md:hidden mt-8">
          <CartSummary
            cart={cart}
            total={total}
            note={note}
            setNote={setNote}
            error={error}
            submitting={submitting}
            handleSubmit={handleSubmit}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            currency={currency}
          />
        </div>
      </form>
      {/* Cart Summary Section (desktop) */}
      <div className="hidden md:block w-full max-w-sm">
        <CartSummary
          cart={cart}
          total={total}
          note={note}
          setNote={setNote}
          error={error}
          submitting={submitting}
          handleSubmit={handleSubmit}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          currency={currency}
        />
      </div>
    </div>
  );
}

function CartSummary({ cart, total, note, setNote, error, submitting, handleSubmit, updateQuantity, removeFromCart, currency }: {
  cart: { itemId: string; name: string; price: number; quantity: number }[];
  total: number;
  note: string;
  setNote: (v: string) => void;
  error: string | null;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  currency: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-4">
      <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
        Your Order
      </h3>
      {cart.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-sm text-gray-400">Add items to get started</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {cart.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600">{getCurrencySymbol(currency)}{item.price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    type="button"
                    className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                    onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-semibold text-gray-900 min-w-[24px] text-center">{item.quantity}</span>
                  <button
                    type="button"
                    className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition"
                    onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-red-700 transition"
                    onClick={() => removeFromCart(item.itemId)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">{getCurrencySymbol(currency)}{total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
      {cart.length > 0 && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Any special requests or dietary requirements..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={submitting || cart.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Placing Order...
              </div>
            ) : (
              `${getCurrencySymbol(currency)}${total.toFixed(2)}`
            )}
          </button>
        </>
      )}
    </div>
  );
} 