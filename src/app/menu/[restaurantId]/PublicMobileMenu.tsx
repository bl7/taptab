'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  FireIcon,
  StarIcon,
  SparklesIcon,
  TagIcon,
  CakeIcon,
  BeakerIcon,
  HeartIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  UserIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  chicken: BeakerIcon,
  pizza: CakeIcon,
  sweets: CakeIcon,
  drinks: BeakerIcon,
  desserts: CakeIcon,
  special: SparklesIcon,
  spicy: FireIcon,
  popular: StarIcon,
  chef: TagIcon,
};

const BADGE_CONFIG = {
  new: { icon: SparklesIcon, color: 'bg-green-100 text-green-800', label: 'New' },
  spicy: { icon: FireIcon, color: 'bg-red-100 text-red-800', label: 'Spicy' },
  popular: { icon: StarIcon, color: 'bg-yellow-100 text-yellow-800', label: 'Popular' },
  'chef-special': { icon: TagIcon, color: 'bg-purple-100 text-purple-800', label: "Chef's Special" },
};

function getCategoryIcon(name: string) {
  const key = name.toLowerCase().replace(/\s/g, '');
  return CATEGORY_ICONS[key] || BeakerIcon;
}

export default function PublicMobileMenu({ restaurantId, tableId }: { restaurantId: string, tableId?: string }) {
  type MenuItem = { itemId: string; name: string; price: number; description?: string; imageUrl?: string; badge?: string };
  type MenuCategory = { categoryId: string; categoryName: string; items: MenuItem[] };
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [tab, setTab] = useState<'home' | 'saved' | 'profile'>('home');

  useEffect(() => {
    const fetchMenu = async () => {
      const res = await fetch(`/api/public/menu?restaurantId=${restaurantId}`);
      const data = await res.json();
      setMenuData(data.layout || []);
      if (data.layout?.length) setActiveCategory(data.layout[0].categoryId);
    };
    fetchMenu();
    setSaved(JSON.parse(localStorage.getItem('savedMenuItems') || '[]'));
    if (tableId) {
      localStorage.setItem('currentTableId', tableId);
    }
  }, [restaurantId, tableId]);

  const handleSave = (itemId: string) => {
    const newSaved = saved.includes(itemId)
      ? saved.filter((id) => id !== itemId)
      : [...saved, itemId];
    setSaved(newSaved);
    localStorage.setItem('savedMenuItems', JSON.stringify(newSaved));
  };

  const filteredMenu = useMemo(() => {
    if (!search) return menuData;
    return menuData.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase())
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [menuData, search]);

  const displayedMenu = tab === 'saved'
    ? menuData.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => saved.includes(item.itemId)),
      })).filter((cat) => cat.items.length > 0)
    : filteredMenu;

  const getBadgeDisplay = (badgeValue: string) => {
    const badge = BADGE_CONFIG[badgeValue as keyof typeof BADGE_CONFIG];
    if (!badge) return null;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Table Banner */}
      {tableId && (
        <div className="bg-orange-50 text-orange-700 text-center py-2 text-sm font-medium">
          Ordering for Table <span className="font-bold">{tableId}</span>
        </div>
      )}
      {/* Category Bar */}
      <div className="sticky top-0 z-10 bg-white pt-4 pb-2">
        <div className="flex overflow-x-auto no-scrollbar space-x-2 px-4">
          {menuData.map((cat) => {
            const Icon = getCategoryIcon(cat.categoryName);
            return (
              <button
                key={cat.categoryId}
                onClick={() => setActiveCategory(cat.categoryId)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors ${
                  activeCategory === cat.categoryId
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{cat.categoryName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="What do you want to eat today?"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 pb-24">
        {displayedMenu.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No menu items found.</div>
        ) : (
          displayedMenu.map((cat) => (
            <div key={cat.categoryId} className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 px-1">
                {cat.categoryName}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {cat.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={112}
                        height={112}
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{item.name}</h3>
                        <button
                          onClick={() => handleSave(item.itemId)}
                          className="ml-2 text-orange-500 hover:text-orange-600"
                          aria-label={saved.includes(item.itemId) ? 'Unsave' : 'Save'}
                        >
                          {saved.includes(item.itemId) ? (
                            <BookmarkIcon className="h-5 w-5 fill-orange-500" />
                          ) : (
                            <BookmarkSlashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {item.badge && getBadgeDisplay(item.badge)}
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-base font-semibold text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                        {/* Mocked rating/time/distance for demo */}
                        <span className="flex items-center text-xs text-gray-500">
                          <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />4.9 (302) · 20-25 min · 2km
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-20">
        <button
          className={`flex flex-col items-center text-xs ${tab === 'home' ? 'text-orange-500' : 'text-gray-400'}`}
          onClick={() => setTab('home')}
        >
          <HomeIcon className="h-6 w-6 mb-1" />Home
        </button>
        <button
          className={`flex flex-col items-center text-xs ${tab === 'saved' ? 'text-orange-500' : 'text-gray-400'}`}
          onClick={() => setTab('saved')}
        >
          <HeartIcon className="h-6 w-6 mb-1" />Saved
        </button>
        <button
          className={`flex flex-col items-center text-xs ${tab === 'profile' ? 'text-orange-500' : 'text-gray-400'}`}
          onClick={() => setTab('profile')}
        >
          <UserIcon className="h-6 w-6 mb-1" />Profile
        </button>
      </nav>
    </div>
  );
} 