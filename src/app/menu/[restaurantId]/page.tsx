import { Suspense } from 'react';
import MenuPageClient from './MenuPageClient';

export default async function MenuPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  // Use a client component to access search params
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading menu...</p>
      </div>
    }>
      <MenuPageClient restaurantId={restaurantId} />
    </Suspense>
  );
} 