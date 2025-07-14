'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}

interface LayoutCategory {
  categoryId: string;
  visible: boolean;
  order: number;
  items: {
    itemId: string;
    visible: boolean;
    badge?: string;
  }[];
}

interface MenuPublishBuilderProps {
  categories: MenuCategory[];
  currentConfig: LayoutCategory[];
  restaurantId: string;
  onPublish?: () => void;
}

const BADGE_OPTIONS = [
  { value: 'new', label: 'New', icon: 'SparklesIcon', color: 'bg-green-100 text-green-800' },
  { value: 'spicy', label: 'Spicy', icon: 'FireIcon', color: 'bg-red-100 text-red-800' },
  { value: 'popular', label: 'Popular', icon: 'StarIcon', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'chef-special', label: "Chef's Special", icon: 'TagIcon', color: 'bg-purple-100 text-purple-800' },
];

interface MenuMeta {
  id: string;
  name: string;
  published: boolean;
  updatedAt: string;
}

export default function MenuPublishBuilder({ 
  categories, 
  onPublish
}: MenuPublishBuilderProps) {
  const [menus, setMenus] = useState<MenuMeta[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [menuName, setMenuName] = useState('');
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // The layout for the selected menu (order/visibility/badges)
  const [menuLayout, setMenuLayout] = useState<LayoutCategory[]>([]);

  // Merge saved layout with all categories/items from DB
  const mergeLayoutWithCategories = useCallback((layout: LayoutCategory[], categories: MenuCategory[]) => {
    // Map for quick lookup
    const savedCatMap = new Map(layout.map(cat => [cat.categoryId, cat]));
    return categories.map((cat, catIdx) => {
      const savedCat = savedCatMap.get(cat.id);
      // If saved, use order/visible/items; else default to all visible, DB order
      return {
        categoryId: cat.id,
        visible: savedCat ? savedCat.visible : true,
        order: savedCat ? savedCat.order : catIdx,
        items: (cat.items || []).map((item) => {
          const savedItem = savedCat?.items.find(i => i.itemId === item.id);
          return {
            itemId: item.id,
            visible: savedItem ? savedItem.visible : item.isAvailable,
            badge: savedItem?.badge
          };
        })
      };
    });
  }, []);

  // Fetch all menus on mount/refresh
  const fetchMenus = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch('/api/menu/menus');
      const data = await res.json();
      setMenus(data);
      if (data.length > 0 && !selectedMenuId) {
        setSelectedMenuId(data[0].id);
      }
    } catch {
      setMenuError('Failed to load menus');
    } finally {
      setMenuLoading(false);
    }
  }, [selectedMenuId]);

  // When a menu is selected, load its layout or default to all categories/items
  useEffect(() => {
    const fetchMenuLayout = async () => {
      setMenuLoading(true);
      setMenuError(null);
      try {
        const res = await fetch(`/api/menu/menus/${selectedMenuId}`);
        const data = await res.json();
        setMenuName(data.name || '');
        // Always show all categories/items, but use saved layout for order/visibility/badges
        setMenuLayout(mergeLayoutWithCategories(data.layout || [], categories));
      } catch {
        setMenuError('Failed to load menu');
      } finally {
        setMenuLoading(false);
      }
    };
    if (selectedMenuId) {
      fetchMenuLayout();
    }
  }, [selectedMenuId, fetchMenus, mergeLayoutWithCategories, categories]);

  async function handleCreateMenu() {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch('/api/menu/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: menuName, layout: [] })
      });
      if (res.ok) {
        await fetchMenus();
        setMenuName('');
      } else {
        const err = await res.json();
        setMenuError(err.error || 'Failed to create menu');
      }
    } catch {
      setMenuError('Failed to create menu');
    } finally {
      setMenuLoading(false);
    }
  }

  async function handleDeleteMenu(menuId: string) {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch(`/api/menu/menus/${menuId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMenus();
        setSelectedMenuId(null);
        setMenuLayout([]);
      } else {
        const err = await res.json();
        setMenuError(err.error || 'Failed to delete menu');
      }
    } catch {
      setMenuError('Failed to delete menu');
    } finally {
      setMenuLoading(false);
    }
  }

  async function handlePublishMenu(menuId: string) {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const res = await fetch('/api/menu/menus/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId })
      });
      if (res.ok) {
        await fetchMenus();
        if (onPublish) onPublish();
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
      } else {
        const err = await res.json();
        setMenuError(err.error || 'Failed to publish menu');
      }
    } catch {
      setMenuError('Failed to publish menu');
    } finally {
      setMenuLoading(false);
    }
  }

  async function handleSaveMenuLayout() {
    if (!selectedMenuId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setMenuError(null);
    try {
      const res = await fetch(`/api/menu/menus/${selectedMenuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: menuName, layout: menuLayout })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await fetchMenus();
      } else {
        const err = await res.json();
        setMenuError(err.error || 'Failed to save menu');
      }
    } catch {
      setMenuError('Failed to save menu');
    } finally {
      setIsSaving(false);
    }
  }

  const toggleCategoryVisibility = (categoryIndex: number) => {
    const newLayout = [...menuLayout];
    newLayout[categoryIndex].visible = !newLayout[categoryIndex].visible;
    setMenuLayout(newLayout);
  };

  const toggleItemVisibility = (categoryIndex: number, itemIndex: number) => {
    const newLayout = [...menuLayout];
    newLayout[categoryIndex].items[itemIndex].visible = !newLayout[categoryIndex].items[itemIndex].visible;
    setMenuLayout(newLayout);
  };

  const updateItemBadge = (categoryIndex: number, itemIndex: number, badge: string | undefined) => {
    const newLayout = [...menuLayout];
    if (badge) {
      newLayout[categoryIndex].items[itemIndex].badge = badge;
    } else {
      delete newLayout[categoryIndex].items[itemIndex].badge;
    }
    setMenuLayout(newLayout);
  };

  const getCategoryData = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getItemData = (categoryId: string, itemId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.items?.find(item => item.id === itemId);
  };

  const getBadgeDisplay = (badgeValue: string) => {
    const badge = BADGE_OPTIONS.find(b => b.value === badgeValue);
    if (!badge) return null;
    
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Menu List */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">Your Menus</h2>
          {menuLoading && <div className="text-gray-500">Loading menus...</div>}
          {menuError && <div className="text-red-600 mb-2">{menuError}</div>}
          <ul className="space-y-2">
            {menus.map(menu => (
              <li key={menu.id} className={`p-3 rounded border flex items-center justify-between ${menu.published ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <button
                  className={`font-semibold ${selectedMenuId === menu.id ? 'text-blue-700 underline' : 'text-gray-900'}`}
                  onClick={() => setSelectedMenuId(menu.id)}
                >
                  {menu.name}
                </button>
                <div className="flex items-center gap-2">
                  {menu.published && <span className="text-green-700 text-xs font-bold">Published</span>}
                  <button onClick={() => handlePublishMenu(menu.id)} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Publish</button>
                  <button onClick={() => handleDeleteMenu(menu.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              className="border rounded px-2 py-1 w-full"
              placeholder="New menu name"
              value={menuName}
              onChange={e => setMenuName(e.target.value)}
            />
            <button onClick={handleCreateMenu} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
          </div>
        </div>
        {/* Menu Layout Editor */}
        <div className="w-full md:w-2/3 bg-white rounded-lg shadow p-4">
          {selectedMenuId ? (
            <>
              <h2 className="text-lg font-bold mb-4">Edit Menu Layout: {menuName}</h2>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Menu Layout</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Drag to reorder categories and items. Toggle visibility and add badges.
                  </p>
                </div>

                {menuLayout.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-500 mb-4">
                      <Bars3Icon className="h-12 w-12 mx-auto text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
                    <p className="text-gray-600 mb-4">
                      Add some menu items first before publishing your menu.
                    </p>
                    <a 
                      href="/dashboard/menu" 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Go to Menu Management
                    </a>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {menuLayout.map((category, categoryIndex) => {
                      const categoryData = getCategoryData(category.categoryId);
                      if (!categoryData) return null;

                      return (
                        <div key={category.categoryId} className="p-6">
                          {/* Category Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Bars3Icon className="h-5 w-5 text-gray-400 cursor-move" />
                              <h3 className="text-lg font-medium text-gray-900">{categoryData.name}</h3>
                              <span className="text-sm text-gray-500">
                                ({category.items.filter(item => item.visible).length} of {category.items.length} items visible)
                              </span>
                              <button
                                onClick={() => toggleCategoryVisibility(categoryIndex)}
                                className={`p-1 rounded-md ${
                                  category.visible 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                {category.visible ? (
                                  <EyeIcon className="h-5 w-5" />
                                ) : (
                                  <EyeSlashIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Category Items */}
                          {category.visible && (
                            <div className="ml-8 space-y-3">
                              {category.items.map((item, itemIndex) => {
                                const itemData = getItemData(category.categoryId, item.itemId);
                                if (!itemData) return null;

                                return (
                                  <div
                                    key={item.itemId}
                                    className={`flex items-center justify-between p-3 rounded-md border ${
                                      item.visible ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 flex-1">
                                      <Bars3Icon className="h-4 w-4 text-gray-400 cursor-move" />
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <h4 className="font-medium text-gray-900">{itemData.name}</h4>
                                          {item.badge && getBadgeDisplay(item.badge)}
                                        </div>
                                        <p className="text-sm text-gray-500">${itemData.price.toFixed(2)}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {/* Badge Selector */}
                                      <select
                                        value={item.badge || ''}
                                        onChange={(e) => updateItemBadge(categoryIndex, itemIndex, e.target.value || undefined)}
                                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                                      >
                                        <option value="">No badge</option>
                                        {BADGE_OPTIONS.map(badge => (
                                          <option key={badge.value} value={badge.value}>
                                            {badge.label}
                                          </option>
                                        ))}
                                      </select>

                                      {/* Visibility Toggle */}
                                      <button
                                        onClick={() => toggleItemVisibility(categoryIndex, itemIndex)}
                                        className={`p-1 rounded-md ${
                                          item.visible 
                                            ? 'text-green-600 hover:bg-green-50' 
                                            : 'text-gray-400 hover:bg-gray-50'
                                        }`}
                                      >
                                        {item.visible ? (
                                          <EyeIcon className="h-4 w-4" />
                                        ) : (
                                          <EyeSlashIcon className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={handleSaveMenuLayout}
                disabled={isSaving}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Menu Layout'}
              </button>
              {saveSuccess && <div className="text-green-700 mt-2">Menu saved!</div>}
            </>
          ) : (
            <div className="text-gray-500">Select a menu to edit or create a new one.</div>
          )}
        </div>
      </div>
      {/* Removed publishError and isPublished state/display as they were removed from props */}
    </div>
  );
} 