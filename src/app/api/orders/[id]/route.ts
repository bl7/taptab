import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { generateReceiptPNG } from '../../print/receipt';
import { broadcastOrder } from '../../socket/broadcast';

const prisma = new PrismaClient();

// Get a single order by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Edit an order (replace items, only if not locked)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.isLocked) {
      return NextResponse.json({ error: 'Order is locked and cannot be edited' }, { status: 403 });
    }
    const body = await req.json();
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }
    // Fetch menu items for price/name snapshot
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i: unknown) => (i as { itemId: string }).itemId) }, restaurantId: order.restaurantId },
    });
    if (menuItems.length !== items.length) {
      return NextResponse.json({ error: 'Invalid menu items' }, { status: 400 });
    }
    // Build new order items
    const orderItems = items.map((cartItem: unknown) => {
      const typedCartItem = cartItem as { itemId: string; quantity: number };
      const menuItem = menuItems.find((mi) => mi.id === typedCartItem.itemId);
      if (!menuItem) throw new Error('Menu item not found');
      return {
        itemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: typedCartItem.quantity,
        orderId: id,
      };
    });
    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Detect added items (by comparing with previous order)
    const prevItemsMap = new Map(order.items.map((i: unknown) => [(i as { itemId: string }).itemId, (i as { quantity: number }).quantity]));
    const addedItems = orderItems.filter((item) => {
      const prevQty = prevItemsMap.get(item.itemId) || 0;
      return item.quantity > prevQty;
    }).map((item) => ({ ...item, quantity: item.quantity - (prevItemsMap.get(item.itemId) || 0) })).filter(i => i.quantity > 0);
    // Delete old items and create new
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.orderItem.createMany({ data: orderItems });
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { total, updatedAt: new Date() },
      include: { items: true, table: true, restaurant: true },
    });
    // Print receipt if items were added
    if (addedItems.length > 0) {
      const orderForPrint = {
        ...updatedOrder,
        addedItems,
        createdAt: updatedOrder.createdAt instanceof Date ? updatedOrder.createdAt.toISOString() : updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt instanceof Date ? updatedOrder.updatedAt.toISOString() : updatedOrder.updatedAt,
        restaurant: updatedOrder.restaurant
          ? {
              logoUrl: updatedOrder.restaurant.logoUrl ?? undefined,
              name: updatedOrder.restaurant.name ?? undefined,
            }
          : undefined,
        note: updatedOrder.note ?? undefined,
      };
      try {
        const png = await generateReceiptPNG(orderForPrint);
        await fetch('http://localhost:8080/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: png }),
        });
      } catch (err) {
        console.error('Failed to print edited order:', err);
      }
    }
    broadcastOrder({
      ...updatedOrder,
      createdAt: updatedOrder.createdAt instanceof Date ? updatedOrder.createdAt.toISOString() : updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt instanceof Date ? updatedOrder.updatedAt.toISOString() : updatedOrder.updatedAt,
    });
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 