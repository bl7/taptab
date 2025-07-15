'use client';

import { useState, useEffect } from 'react';
import {
  Egg,
  Soup,
  Utensils,
  Sandwich,
  Pizza,
  Leaf,
  GlassWater,
  Flame,
  Sprout,
  Baby,
  Fish,
  Drumstick,
  Beef,
  Star,
  Sparkles,
  Tag
} from 'lucide-react';
import Image from 'next/image';

interface MenuItem {
  itemId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  badge?: string;
}

interface MenuCategory {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}

interface PublicMenuProps {
  restaurantId?: string;
}

const BADGE_CONFIG = {
  new: { icon: Sparkles, color: 'bg-green-100 text-green-800', label: 'New' },
  spicy: { icon: Flame, color: 'bg-red-100 text-red-800', label: 'Spicy' },
  popular: { icon: Star, color: 'bg-yellow-100 text-yellow-800', label: 'Popular' },
  'chef-special': { icon: Tag, color: 'bg-purple-100 text-purple-800', label: "Chef's Special" },
};

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
const DEFAULT_CATEGORY_ICON = <Utensils className="w-5 h-5 mr-1" />;

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

export default function PublicMenu({ restaurantId }: PublicMenuProps) {
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/public/restaurant?restaurantId=${restaurantId}`)
      .then(res => res.json())
      .then(data => setCurrency(data.currency || 'USD'));
  }, [restaurantId]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // For demo purposes, using a hardcoded restaurant ID
        // In production, this would come from URL params or context
        const targetRestaurantId = restaurantId || 'demo-restaurant-id';
        
        const response = await fetch(`/api/public/menu?restaurantId=${targetRestaurantId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch menu');
        }
        
        const data = await response.json();
        setMenuData(data.layout || []);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Unavailable</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (menuData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Available</h3>
        <p className="text-gray-600">This restaurant hasn&apos;t published their menu yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full px-4 pb-2 max-h-32 overflow-y-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex flex-col items-center px-5 py-3 rounded-xl font-semibold text-base border transition-all shadow-sm ${selectedCategory === null ? "bg-[#00932A] text-white" : "bg-gray-100 text-gray-700 hover:bg-[#00932A]/10"}`}
        >
          <span className="mb-1">{DEFAULT_CATEGORY_ICON}</span>
          <span>All</span>
          <span className="text-xs font-normal mt-1">{menuData.reduce((sum, c) => sum + c.items.length, 0)} Items</span>
        </button>
        {menuData.filter(cat => cat.items.length > 0).map((cat) => (
          <button
            key={cat.categoryId}
            onClick={() => setSelectedCategory(cat.categoryName)}
            className={`flex flex-col items-center px-5 py-3 rounded-xl font-semibold text-base border transition-all shadow-sm ${selectedCategory === cat.categoryName ? "bg-[#00932A] text-white ring-2 ring-[#00932A]" : "bg-gray-100 text-gray-700 hover:bg-[#00932A]/10"}`}
          >
            <span className="mb-1">{CATEGORY_ICONS[cat.categoryName] || DEFAULT_CATEGORY_ICON}</span>
            <span>{cat.categoryName}</span>
            <span className="text-xs font-normal mt-1">{cat.items.length} Items</span>
          </button>
        ))}
      </div>
      {/* Filtered Menu Grid */}
      <div className="space-y-8">
        {(selectedCategory
          ? menuData.filter((cat) => cat.categoryName === selectedCategory && cat.items.length > 0)
          : menuData.filter((cat) => cat.items.length > 0)
        ).map((category) => (
          <div key={category.categoryId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{category.categoryName}</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => {
                  const badgeConfig = BADGE_CONFIG[item.badge as keyof typeof BADGE_CONFIG];
                  return (
                    <div
                      key={item.itemId}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative"
                    >
                      {/* Badge on top left */}
                      {item.badge && badgeConfig && (
                        <span className={`absolute top-3 left-3 z-10 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow ${badgeConfig.color}`}
                          style={{ pointerEvents: 'none' }}
                        >
                          <badgeConfig.icon className="h-3 w-3 mr-1" />
                          {badgeConfig.label}
                        </span>
                      )}
                      {item.imageUrl && (
                        <div className="aspect-w-16 aspect-h-9">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                          {/* Remove badge here, now shown on top */}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">
                            {getCurrencySymbol(currency)}{item.price.toFixed(2)}
                          </span>
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Add to Order
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 