import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { broadcastOrder } from '../socket/broadcast';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

// Create a new order (customer or staff)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { tableId, note, items, createdVia, customerName } = body;
    if (!tableId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Fetch menu items for price/name snapshot
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i: unknown) => (i as { itemId: string }).itemId) }, restaurantId: user.restaurantId },
    });
    if (menuItems.length !== items.length) {
      return NextResponse.json({ error: 'Invalid menu items' }, { status: 400 });
    }
    // Build order items snapshot
    const orderItems = items.map((cartItem: unknown) => {
      const typedCartItem = cartItem as { itemId: string; quantity: number; note?: string };
      const menuItem = menuItems.find((mi: { id: string; name: string; price: number }) => mi.id === typedCartItem.itemId);
      if (!menuItem) throw new Error('Menu item not found');
      return {
        itemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: typedCartItem.quantity,
        note: typedCartItem.note || null,
      };
    });
    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await prisma.order.create({
      data: {
        restaurantId: user.restaurantId,
        tableId,
        note: note || null,
        createdVia: createdVia || 'CUSTOMER',
        status: 'PENDING',
        isLocked: false,
        paid: false,
        total,
        items: { create: orderItems },
        customerName: customerName || null,
      },
      include: { items: true },
    });
    const orderForBroadcast = {
      ...order,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    };
    broadcastOrder(orderForBroadcast);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// List all orders (for dashboard)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { restaurantId?: string };
    if (!user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orders = await prisma.order.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, table: true },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 