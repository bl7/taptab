'use client';
import { useSearchParams } from 'next/navigation';
import PublicMobileMenu from './PublicMobileMenu';

export default function MenuPageClient({ restaurantId }: { restaurantId: string }) {
  const searchParams = useSearchParams();
  const tableId = searchParams?.get('tableId') || '';
  return <PublicMobileMenu restaurantId={restaurantId} tableId={tableId} />;
} 