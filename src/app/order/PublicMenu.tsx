'use client';

import { useState, useEffect } from 'react';
import { 
  FireIcon,
  StarIcon,
  SparklesIcon,
  TagIcon
} from '@heroicons/react/24/outline';
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
  new: { icon: SparklesIcon, color: 'bg-green-100 text-green-800', label: 'New' },
  spicy: { icon: FireIcon, color: 'bg-red-100 text-red-800', label: 'Spicy' },
  popular: { icon: StarIcon, color: 'bg-yellow-100 text-yellow-800', label: 'Popular' },
  'chef-special': { icon: TagIcon, color: 'bg-purple-100 text-purple-800', label: 'Chef&apos;s Special' },
};

export default function PublicMenu({ restaurantId }: PublicMenuProps) {
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {menuData.map((category) => (
        <div key={category.categoryId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{category.categoryName}</h2>
          </div>
          
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
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
                      {item.badge && getBadgeDisplay(item.badge)}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        ${item.price.toFixed(2)}
                      </span>
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Add to Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 