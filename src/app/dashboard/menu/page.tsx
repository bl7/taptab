import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import pool from '@/lib/pg';
import MenuManagement from './MenuManagement';

export default async function MenuPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { email?: string };
  if (!user?.email) {
    redirect('/auth/login');
  }

  // Check if user is onboarded
  const { rows } = await pool.query(
    'SELECT r.id, r.name FROM "Restaurant" r JOIN "User" u ON r."userId" = u.id WHERE u.email = $1',
    [user.email]
  );

  if (rows.length === 0 || !rows[0].name) {
    redirect('/dashboard/onboarding');
  }

  // Fetch initial categories and items
  const { rows: categories } = await pool.query(`
    SELECT 
      mc.id,
      mc.name,
      mc."createdAt",
      mc."updatedAt",
      COALESCE(
        json_agg(
          json_build_object(
            'id', mi.id,
            'name', mi.name,
            'price', mi.price,
            'isAvailable', mi."isAvailable"
          )
        ) FILTER (WHERE mi.id IS NOT NULL),
        '[]'::json
      ) as items
    FROM "MenuCategory" mc
    LEFT JOIN "MenuItem" mi ON mc.id = mi."categoryId"
    WHERE mc."restaurantId" = $1
    GROUP BY mc.id, mc.name, mc."createdAt", mc."updatedAt"
    ORDER BY mc."createdAt" ASC
  `, [rows[0].id]);

  const { rows: items } = await pool.query(`
    SELECT 
      mi.id,
      mi.name,
      mi.description,
      mi.price,
      mi."imageUrl",
      mi."isAvailable",
      mi."createdAt",
      mi."updatedAt",
      mc.id as "categoryId",
      mc.name as "categoryName"
    FROM "MenuItem" mi
    JOIN "MenuCategory" mc ON mi."categoryId" = mc.id
    WHERE mi."restaurantId" = $1
    ORDER BY mc.name ASC, mi.name ASC
  `, [rows[0].id]);

  return (
    <div className="min-h-screen bg-mint">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-end mb-4">
            <a
              href="/dashboard/menu/builder"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-700 bg-white rounded-lg shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              Switch to Builder
            </a>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-mint">
            <MenuManagement 
              initialCategories={categories} 
              initialItems={items}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 