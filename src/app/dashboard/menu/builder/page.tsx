'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';import { ArrowLeft, Save, Eye, Settings } from 'lucide-react';
import type { Menu, MenuCategory, MenuItem } from './MenuBuilder';
import MenuBuilder from './MenuBuilder';

export default function MenuBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Remove preview state
  const [menu, setMenu] = useState<Menu | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/auth/login');
      return;
    }
    loadMenu();
  }, [session, status, router]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current menu data
      const [categoriesRes, itemsRes, menusRes] = await Promise.all([
        fetch('/api/menu/categories'),
        fetch('/api/menu/items'),
        fetch('/api/menu/menus')
      ]);

      if (!categoriesRes.ok || !itemsRes.ok || !menusRes.ok) {
        throw new Error('Failed to load menu data');
      }

      const [categories, itemsRaw, menus] = await Promise.all([
        categoriesRes.json(),
        itemsRes.json(),
        menusRes.json()
      ]);
      const items = itemsRaw as Array<MenuItem & { categoryId: string }>;

      setAllMenus(menus);
      
      // Select the first menu by default, or create a default menu
      const defaultMenuId = menus.length > 0 ? menus[0].id : null;
      setSelectedMenuId(defaultMenuId);

      // Load categories and items with their current visibility and badge settings from database
      const savedCategories: MenuCategory[] = categories.map((cat: MenuCategory) => ({
        ...cat,
        items: (items as Array<MenuItem & { categoryId: string }>).filter((item) => item.categoryId === cat.id)
      }));

      // Sort by order
      savedCategories.sort((a, b) => a.order - b.order);

      // Create menu structure for the selected menu (or create default)
      const menuData: Menu = {
        id: defaultMenuId,
        name: menus.length > 0 ? menus[0].name : 'My Menu',
        published: menus.length > 0 ? menus[0].published : false,
        categories: savedCategories
      };

      setMenu(menuData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuChange = async (menuId: string) => {
    if (menuId === 'new') {
      // Create a new menu
      setMenu({ id: null, name: 'Untitled Menu', published: false, categories: [] });
      setSelectedMenuId(null);
      return;
    }
    setSelectedMenuId(menuId);
    const selectedMenu = allMenus.find((m) => m.id === menuId) as (Menu & { layout?: unknown });
    
    if (selectedMenu) {
      try {
        const [categoriesRes, itemsRes] = await Promise.all([
          fetch('/api/menu/categories'),
          fetch('/api/menu/items')
        ]);

        if (!categoriesRes.ok || !itemsRes.ok) {
          throw new Error('Failed to load menu data');
        }

        const [categories, itemsRaw] = await Promise.all([
          categoriesRes.json(),
          itemsRes.json()
        ]);
        const items = itemsRaw as Array<MenuItem & { categoryId: string }>;

        // Helper to merge master data with menu layout config
        function mergeMenuLayout(
          categories: MenuCategory[],
          items: MenuItem[],
          layout: { categories?: unknown[] } | null
        ): MenuCategory[] {
          if (!layout || !layout.categories) {
            // fallback: show all categories/items
            return categories.map((cat) => ({
              ...cat,
              visible: true,
              order: 0,
              items: (items as Array<MenuItem & { categoryId: string }>).filter((item) => item.categoryId === cat.id).map((item) => ({
                ...item,
                visible: true,
                badge: undefined,
                categoryId: cat.id,
              })),
            }));
          }
          // Map for quick lookup
          const catMap: Record<string, MenuCategory> = Object.fromEntries(categories.map((c) => [c.id, c]));
          const itemMap: Record<string, MenuItem> = Object.fromEntries(items.map((i) => [i.id, i]));
          // Build categories in layout order
          return layout.categories.map((catCfgUnknown, idx: number) => {
            if (typeof catCfgUnknown !== 'object' || catCfgUnknown === null) return {} as MenuCategory;
            const catCfg = catCfgUnknown as { id: string; visible?: boolean; order?: number; items?: unknown[] };
            const cat = catMap[catCfg.id] || {};
            return {
              ...cat,
              visible: catCfg.visible ?? true,
              order: catCfg.order ?? idx,
              items: (catCfg.items || []).map((itemCfgUnknown) => {
                if (typeof itemCfgUnknown !== 'object' || itemCfgUnknown === null) return {} as MenuItem;
                const itemCfg = itemCfgUnknown as { id: string; visible?: boolean; badge?: string };
                const item = itemMap[itemCfg.id] || {};
                return {
                  ...item,
                  visible: itemCfg.visible ?? true,
                  badge: itemCfg.badge ?? undefined,
                  categoryId: cat.id,
                };
              }),
            };
          });
        }

        const mergedCategories = mergeMenuLayout(categories, items, selectedMenu.layout ?? null);

        const menuData = {
          id: selectedMenu.id,
          name: selectedMenu.name,
          published: selectedMenu.published,
          categories: mergedCategories
        };

        setMenu(menuData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu data');
      }
    }
  };

  const handleSave = async () => {
    if (!menu) return;
    
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/menu/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          menu: menu
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save menu');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!menu) return;
    
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch('/api/menu/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          menu: menu
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish menu');
      }

      setMenu((prev: Menu | null) => prev ? { ...prev, published: true } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish menu');
    } finally {
      setPublishing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu builder...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Menu</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadMenu}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menu Builder</h1>
                <p className="text-sm text-gray-600">Create and customize your menu</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Menu Selector */}
              <div className="flex items-center space-x-3">
                <label htmlFor="menu-select" className="text-sm font-medium text-gray-700">
                  Select Menu:
                </label>
                <select
                  id="menu-select"
                  value={String(selectedMenuId ?? '')}
                  onChange={(e) => handleMenuChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allMenus.map((menu) => (
                    <option key={menu.id} value={String(menu.id ?? '')}>
                      {menu.name} {menu.published ? '🌟 (Published)' : '(Draft)'}
                    </option>
                  ))}
                  <option value="new">+ Create New Menu</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-forest text-mint rounded-lg hover:bg-[#223127] transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !menu?.categories?.some((cat: MenuCategory) => cat.items?.length > 0)}
                className="flex items-center px-4 py-2 bg-forest text-mint rounded-lg hover:bg-[#223127] transition disabled:opacity-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                {publishing ? 'Publishing...' : 'Publish Menu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MenuBuilder 
          menu={menu} 
          onMenuChange={(m) => setMenu(m)}
        />
      </div>
    </div>
  );
} 