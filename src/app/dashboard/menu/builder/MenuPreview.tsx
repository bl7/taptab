'use client';

import { Star } from 'lucide-react';
import MenuPublicView from "@/components/MenuPublicView";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  badge?: string;
  visible: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
  visible: boolean;
  order: number;
}

interface Menu {
  id: string | null;
  name: string;
  published: boolean;
  categories: MenuCategory[];
}

interface MenuPreviewProps {
  menu: Menu | null;
  mode: 'desktop' | 'mobile';
}

export default function MenuPreview({ menu, mode }: MenuPreviewProps) {
  if (!menu) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu to Preview</h3>
        <p className="text-gray-600">Create and configure your menu first.</p>
      </div>
    );
  }

  // Map menu.categories to MenuPublicView format
  const mappedMenu = (menu.categories || []).filter(cat => cat.visible).map(cat => ({
    categoryId: cat.id,
    categoryName: cat.name,
    items: (cat.items || []).filter(item => item.visible).map(item => ({
      itemId: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      imageUrl: item.imageUrl || undefined,
      badge: item.badge,
    })),
  }));

  return (
    <div className="flex justify-center">
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${
        mode === 'mobile' ? 'w-80 max-w-full' : 'w-full max-w-4xl'
      }`}>
        <MenuPublicView menu={mappedMenu} />
      </div>
    </div>
  );
} 