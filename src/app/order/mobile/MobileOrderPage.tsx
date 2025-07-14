"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { ShoppingCart, Home, User, Menu as MenuIcon } from "lucide-react";

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

  // Get all categories from menu
  const categories = menu.map((category: MenuCategory) => ({
    id: category.categoryId,
    name: category.categoryName,
  }));

  // Cart badge count
  // const cartCount = cart.reduce((sum, i) => sum + (i as any).quantity, 0); // Remove or fix if cart is not used

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
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.name}
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
                {cat.items.map((item) => (
                  <button
                    key={item.itemId}
                    className="bg-white rounded-xl shadow border border-gray-100 flex items-center gap-3 p-3 active:scale-95 transition-transform"
                    // onClick={() => setSelectedItem(item)}
                  >
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
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {item.badge.charAt(0).toUpperCase() + item.badge.slice(1)}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mb-1 line-clamp-2">{item.description}</div>
                      )}
                      <div className="text-blue-600 font-bold text-lg">${item.price.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
      </main>

      {/* Floating Cart Button */}
      <button
        className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform"
        // onClick={() => setCartOpen(true)}
        aria-label="View cart"
      >
        <ShoppingCart className="w-8 h-8" />
        {/* {cartCount > 0 && (
          <span className="absolute top-2 right-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold shadow">
            {cartCount}
          </span>
        )} */}
      </button>

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

      {/* TODO: Cart Drawer, Item Modal, Checkout Stepper */}
    </div>
  );
} 