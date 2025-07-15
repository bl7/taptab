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
    console.log('DEBUG: Loaded layout from DB:', JSON.stringify(layout));

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
    console.log('DEBUG: Loaded categories from DB:', JSON.stringify(categories));

    // Create a map of category data
    const categoryMap = new Map<string, { categoryName: string; items: MenuItem[] }>();
    categories.forEach((cat: CategoryData) => {
      categoryMap.set(cat.categoryId, {
        categoryName: cat.categoryName,
        items: cat.items || []
      });
    });

    // Build the published menu based on layout config
    const layoutArray: unknown = Array.isArray(layout)
      ? layout
      : layout && typeof layout === 'object' && Array.isArray((layout as { categories?: unknown }).categories)
        ? (layout as { categories: unknown }).categories
        : [];

    interface LayoutCategoryLike {
      id?: string;
      categoryId?: string;
      visible?: boolean;
      items?: LayoutItemLike[];
    }
    interface LayoutItemLike {
      id?: string;
      itemId?: string;
      visible?: boolean;
      badge?: string;
    }

    const publishedMenu = (layoutArray as LayoutCategoryLike[])
      .filter((category) => (category.visible !== false))
      .map((category) => {
        const catId = category.categoryId || category.id;
        const categoryData = categoryMap.get(catId ?? '');
        if (!categoryData) return undefined;

        const visibleItems = (category.items || [])
          .filter((item) => (item.visible !== false))
          .map((item) => {
            const itemId = item.itemId || item.id;
            const itemData = (categoryData.items || []).find((i: { itemId?: string; id?: string }) => (i.itemId || i.id) === itemId);
            if (!itemData || itemData.isAvailable === false) return undefined;

            return {
              itemId: itemId,
              name: itemData.name,
              description: itemData.description,
              price: itemData.price,
              imageUrl: itemData.imageUrl,
              badge: item.badge || null
            };
          })
          .filter((item): item is { itemId: string | undefined; name: string; description: string; price: number; imageUrl: string; badge: string | null } => Boolean(item));

        return {
          categoryId: catId,
          categoryName: categoryData.categoryName,
          items: visibleItems
        };
      })
      .filter((cat): cat is { categoryId: string; categoryName: string; items: { itemId: string | undefined; name: string; description: string; price: number; imageUrl: string; badge: string | null }[] } => Boolean(cat));
    // Only include categories with at least one item
    const nonEmptyMenu = publishedMenu.filter((cat) => Array.isArray(cat.items) && cat.items.length > 0);
    return NextResponse.json({ layout: nonEmptyMenu });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching public menu:', error.message, error.stack);
    } else {
      console.error('Error fetching public menu:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 