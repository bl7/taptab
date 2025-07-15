'use client';
import { useState, useEffect, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';import { Settings, X } from 'lucide-react';
import type { Menu, MenuCategory, MenuItem } from './MenuBuilder';
import MenuBuilder from './MenuBuilder';
import toast from 'react-hot-toast';
import { SidebarContext } from '../../SidebarContext';
import { createId } from '@paralleldrive/cuid2';

// Types for layout parsing
type LayoutItem = { id: string; visible?: boolean; badge?: string };
type LayoutCategory = { id: string; visible?: boolean; order?: number; items?: LayoutItem[] };

export default function MenuBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { expanded } = useContext(SidebarContext);
  // Remove preview state
  const [menu, setMenu] = useState<Menu | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Sidebar/Menu List State ---
  const [allCategories, setAllCategories] = useState<MenuCategory[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [allItems, setAllItems] = useState<Array<MenuItem & { categoryId: string }>>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/auth/login');
      return;
    }
    loadMenu();
  }, [session, status, router]);

  // --- Load all categories on mount ---
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) return;
    fetch('/api/menu/categories')
      .then(res => res.json())
      .then(setAllCategories)
      .catch(() => setAllCategories([]));
  }, [session, status]);

  // --- Always show published menu by default ---
  useEffect(() => {
    if (allMenus.length > 0 && !selectedMenuId) {
      const published = allMenus.find(m => m.published);
      setSelectedMenuId(published ? published.id : allMenus[0].id);
    }
  }, [allMenus, selectedMenuId]);

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
      const items: Array<MenuItem & { categoryId: string }> = itemsRaw;
      setAllItems(items); // <-- store all items for later use
      setAllMenus(menus);
      // Always select the published menu by default
      const publishedMenu = menus.find((m: Menu) => m.published);
      const defaultMenuId = publishedMenu ? publishedMenu.id : (menus.length > 0 ? menus[0].id : null);
      setSelectedMenuId(defaultMenuId);
      // Find the selected menu's layout
      const selectedMenu = menus.find((m: Menu) => m.id === defaultMenuId) as (Menu & { layout?: { categories?: LayoutCategory[] } });
      let savedCategories: MenuCategory[] = [];
      if (selectedMenu && selectedMenu.layout && selectedMenu.layout.categories) {
        // Merge layout with master data, preserving badges and visibility
        const catMap: Record<string, MenuCategory> = Object.fromEntries(categories.map((c: MenuCategory) => [c.id, c]));
        const itemMap: Record<string, MenuItem> = Object.fromEntries(items.map((i: MenuItem) => [i.id, i]));
        savedCategories = (selectedMenu.layout.categories as LayoutCategory[]).map((catCfg, idx) => {
          const cat = catMap[catCfg.id] || {};
          return {
            ...cat,
            visible: catCfg.visible ?? true,
            order: catCfg.order ?? idx,
            items: (catCfg.items || []).map((itemCfg: LayoutItem) => {
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
      } else {
        // fallback: show all categories/items
        savedCategories = categories.map((cat: MenuCategory) => ({
          ...cat,
          items: (items as Array<MenuItem & { categoryId: string }>).filter((item) => item.categoryId === cat.id)
        }));
        savedCategories.sort((a, b) => a.order - b.order);
      }
      const menuData: Menu = {
        id: defaultMenuId,
        name: selectedMenu ? selectedMenu.name : 'My Menu',
        published: selectedMenu ? selectedMenu.published : false,
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
    setSelectedMenuId(menuId);
    const selectedMenu = allMenus.find((m) => m.id === menuId) as (Menu & { layout?: { categories?: LayoutCategory[] } });
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
        const items: Array<MenuItem & { categoryId: string }> = itemsRaw;
        let mergedCategories: MenuCategory[] = [];
        if (selectedMenu.layout && selectedMenu.layout.categories) {
          // Merge layout with master data, preserving badges and visibility
          const catMap: Record<string, MenuCategory> = Object.fromEntries(categories.map((c: MenuCategory) => [c.id, c]));
          const itemMap: Record<string, MenuItem> = Object.fromEntries(items.map((i: MenuItem) => [i.id, i]));
          mergedCategories = (selectedMenu.layout.categories as LayoutCategory[]).map((catCfg, idx) => {
            const cat = catMap[catCfg.id] || {};
            return {
              ...cat,
              visible: catCfg.visible ?? true,
              order: catCfg.order ?? idx,
              items: (catCfg.items || []).map((itemCfg: LayoutItem) => {
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
        } else {
          // fallback: show all categories/items
          mergedCategories = categories.map((cat: MenuCategory) => ({
            ...cat,
            items: (items as Array<MenuItem & { categoryId: string }>).filter((item) => item.categoryId === cat.id)
          }));
          mergedCategories.sort((a, b) => a.order - b.order);
        }
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
      const data = await res.json();
      toast.success('Menu saved!');
      // If a new id is returned, update menu and selectedMenuId
      if (data.id && data.id !== menu.id) {
        setMenu(m => m ? { ...m, id: data.id } : m);
        setSelectedMenuId(data.id);
      } else if (data.id) {
        setSelectedMenuId(data.id);
      }
      await loadMenu();
      if (data.id) setSelectedMenuId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu');
      toast.error(err instanceof Error ? err.message : 'Failed to save menu');
    }
  };

  const handlePublish = async () => {
    if (!menu) return;
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
      const data = await res.json();
      setMenu((prev: Menu | null) => prev ? { ...prev, published: true, id: data.id || prev.id } : null);
      toast.success('Menu published!');
      if (data.id && data.id !== menu.id) {
        setSelectedMenuId(data.id);
      } else if (data.id) {
        setSelectedMenuId(data.id);
      }
      await loadMenu();
      if (data.id) setSelectedMenuId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish menu');
      toast.error(err instanceof Error ? err.message : 'Failed to publish menu');
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <aside
        className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm fixed top-0"
        style={{
          minHeight: '100vh',
          maxHeight: '100vh',
          left: expanded ? '15rem' : '5rem',
          transition: 'left 0.2s',
          zIndex: 'auto',
        }}
      >
        {/* Sticky header for create button */}
        <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-100 flex flex-col gap-2">
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow"
            onClick={() => {
              setMenu({ id: createId(), name: 'Untitled Menu', published: false, categories: [] });
              setSelectedMenuId(null);
            }}
          >
            + Create New Menu
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 mb-2 px-2">Menus</h3>
          {allMenus
            .sort((a, b) => (b.published ? 1 : 0) - (a.published ? 1 : 0))
            .map(menu => (
              <div
                key={menu.id}
                className={`flex items-center group rounded-lg transition border border-transparent ${menu.published ? 'bg-green-50 text-green-900 font-bold' : 'bg-white hover:bg-gray-50'} ${selectedMenuId === menu.id ? 'border-blue-400 ring-2 ring-blue-200' : ''}`}
              >
                <button
                  className="flex-1 text-left px-4 py-2 truncate focus:outline-none"
                  onClick={() => menu.id && handleMenuChange(menu.id)}
                >
                  <span className="truncate block">{menu.name}</span> {menu.published && <span className="ml-1 text-xs align-middle">🌟 Published</span>}
                </button>
                {menu.id && (
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                    title="Delete menu"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm('Are you sure you want to delete this menu? This cannot be undone.')) return;
                      try {
                        await fetch(`/api/menu/builder?id=${menu.id}`, { method: 'DELETE' });
                        await loadMenu();
                        toast.success('Menu deleted!');
                      } catch {
                        toast.error('Failed to delete menu');
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-xs text-gray-500 bg-white">
          Need to add or edit categories/items? <a href="/dashboard/menu" className="text-blue-600 underline">Go to Menu Management</a>
        </div>
      </aside>
      {/* Main Content */}
      <main
        className="flex-1 p-8"
        style={{ marginLeft: expanded ? '31rem' : '21rem', transition: 'margin-left 0.2s' }}
      >
        <div className="flex items-center justify-between mb-6">
          <input
            type="text"
            className="text-2xl font-bold bg-transparent border-b-2 border-blue-200 focus:border-blue-600 outline-none px-2 py-1 w-72"
            value={menu?.name || ''}
            placeholder="Menu name..."
            onChange={e => setMenu(m => m ? { ...m, name: e.target.value } : m)}
            disabled={!menu}
          />
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => setShowCategoryPicker(true)}
              disabled={!menu}
            >
              + Add Category
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              onClick={handleSave}
              disabled={!menu}
            >
              Save
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={handlePublish}
              disabled={!menu}
            >
              Publish
            </button>
          </div>
        </div>
        {showCategoryPicker && (
          <div className="mb-6 p-4 bg-white border rounded-lg">
            <h2 className="font-semibold mb-2">Add Category to Menu</h2>
            <ul>
              {allCategories.filter(cat => !menu?.categories.some(c => c.id === cat.id)).map(cat => (
                <li key={cat.id} className="mb-2 flex items-center justify-between">
                  <span>{cat.name}</span>
                  <button
                    className="px-2 py-1 bg-green-500 text-white rounded"
                    onClick={() => {
                      // Find all items for this category from allItems
                      const itemsForCategory = allItems.filter((item: MenuItem & { categoryId: string }) => item.categoryId === cat.id);
                      setMenu(m => m ? { ...m, categories: [...m.categories, { ...cat, items: itemsForCategory, visible: true, order: m.categories.length }] } : m);
                      setShowCategoryPicker(false);
                    }}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
            <button className="mt-2 text-sm text-gray-500 underline" onClick={() => setShowCategoryPicker(false)}>Cancel</button>
          </div>
        )}
        <MenuBuilder menu={menu} onMenuChange={setMenu} />
      </main>
    </div>
  );
} 