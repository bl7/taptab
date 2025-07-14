'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import CategoryManagement from './CategoryManagement';
import ItemManagement from './ItemManagement';

interface MenuCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
  }> | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
}

interface MenuManagementProps {
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
}

export default function MenuManagement({ 
  initialCategories, 
  initialItems
}: MenuManagementProps) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [selectedTab, setSelectedTab] = useState(0);

  const refreshCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  };

  const refreshItems = async () => {
    try {
      const response = await fetch('/api/menu/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error refreshing items:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-forest">Menu Management</h1>
        <p className="mt-2 text-forest/60">
          Manage your menu categories and items to create a complete menu for your customers.
        </p>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-mint p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${selected
                ? 'bg-forest text-mint shadow'
                : 'text-forest/60 hover:bg-forest/20 hover:text-forest'}
               `
            }
          >
            Categories
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${selected
                ? 'bg-forest text-mint shadow'
                : 'text-forest/60 hover:bg-forest/20 hover:text-forest'}
               `
            }
          >
            Menu Items
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <CategoryManagement 
              categories={categories}
              onCategoriesChange={refreshCategories}
              onItemsChange={refreshItems}
            />
          </Tab.Panel>
          <Tab.Panel>
            <ItemManagement 
              items={items}
              categories={categories.map(cat => ({
                ...cat,
                items: cat.items ?? []
              }))}
              onItemsChange={refreshItems}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 