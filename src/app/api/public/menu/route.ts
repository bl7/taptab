import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg';

interface MenuItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

interface CategoryData {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}

interface LayoutCategory {
  categoryId: string;
  visible: boolean;
  items: LayoutItem[];
}

interface LayoutItem {
  itemId: string;
  visible: boolean;
  badge?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Get the published menu from the new Menu table
    const { rows: menuRows } = await pool.query(
      'SELECT layout FROM "Menu" WHERE "restaurantId" = $1 AND published = true ORDER BY "updatedAt" DESC LIMIT 1',
      [restaurantId]
    );

    if (menuRows.length === 0) {
      // If no published menu exists, return all visible categories and items as fallback
      const { rows: categories } = await pool.query(`
        SELECT 
          mc.id as "categoryId",
          mc.name as "categoryName",
          json_agg(
            json_build_object(
              'itemId', mi.id,
              'name', mi.name,
              'description', mi.description,
              'price', mi.price,
              'imageUrl', mi."imageUrl",
              'isAvailable', mi."isAvailable"
            )
          ) FILTER (WHERE mi.id IS NOT NULL AND mi."isAvailable" = true) as items
        FROM "MenuCategory" mc
        LEFT JOIN "MenuItem" mi ON mc.id = mi."categoryId"
        WHERE mc."restaurantId" = $1
        GROUP BY mc.id, mc.name
        ORDER BY mc."createdAt" ASC
      `, [restaurantId]);

      return NextResponse.json({ 
        layout: categories.map((cat: CategoryData) => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          visible: true,
          items: (cat.items || []).map((item: MenuItem) => ({
            visible: true,
            ...item
          }))
        }))
      });
    }

    const layout = menuRows[0].layout;

    // Get all categories and items for this restaurant (for name/price/etc)
    const { rows: categories } = await pool.query(`
      SELECT 
        mc.id as "categoryId",
        mc.name as "categoryName",
        json_agg(
          json_build_object(
            'itemId', mi.id,
            'name', mi.name,
            'description', mi.description,
            'price', mi.price,
            'imageUrl', mi."imageUrl",
            'isAvailable', mi."isAvailable"
          )
        ) FILTER (WHERE mi.id IS NOT NULL) as items
      FROM "MenuCategory" mc
      LEFT JOIN "MenuItem" mi ON mc.id = mi."categoryId"
      WHERE mc."restaurantId" = $1
      GROUP BY mc.id, mc.name
    `, [restaurantId]);

    // Create a map of category data
    const categoryMap = new Map<string, { categoryName: string; items: MenuItem[] }>();
    categories.forEach((cat: CategoryData) => {
      categoryMap.set(cat.categoryId, {
        categoryName: cat.categoryName,
        items: cat.items || []
      });
    });

    // Build the published menu based on layout config
    const publishedMenu = layout
      .filter((category: LayoutCategory) => category.visible)
      .map((category: LayoutCategory) => {
        const categoryData = categoryMap.get(category.categoryId);
        if (!categoryData) return null;

        const visibleItems = category.items
          .filter((item: LayoutItem) => item.visible)
          .map((item: LayoutItem) => {
            const itemData = categoryData.items.find((i: MenuItem) => i.itemId === item.itemId);
            if (!itemData || !itemData.isAvailable) return null;

            return {
              itemId: item.itemId,
              name: itemData.name,
              description: itemData.description,
              price: itemData.price,
              imageUrl: itemData.imageUrl,
              badge: item.badge || null
            };
          })
          .filter(Boolean);

        return {
          categoryId: category.categoryId,
          categoryName: categoryData.categoryName,
          items: visibleItems
        };
      })
      .filter(Boolean);

    return NextResponse.json({ layout: publishedMenu });
  } catch (error) {
    console.error('Error fetching public menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 