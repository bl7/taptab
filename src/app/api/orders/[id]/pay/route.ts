import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/index.js';
import { broadcastOrder } from '../../../socket/broadcast';

const prisma = new PrismaClient();

// Mark an order as paid/locked
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.isLocked && order.paid) {
      return NextResponse.json({ error: 'Order is already paid/locked' }, { status: 400 });
    }
    // If not already COMPLETED or CANCELED, set status to COMPLETED
    const newStatus = (order.status !== 'COMPLETED' && order.status !== 'CANCELED') ? 'COMPLETED' : order.status;
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { isLocked: true, paid: true, status: newStatus, updatedAt: new Date() },
      include: { items: true, table: true },
    });
    const orderForBroadcast = {
      ...updatedOrder,
      createdAt: updatedOrder.createdAt instanceof Date ? updatedOrder.createdAt.toISOString() : updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt instanceof Date ? updatedOrder.updatedAt.toISOString() : updatedOrder.updatedAt,
    };
    broadcastOrder(orderForBroadcast);
    return NextResponse.json(orderForBroadcast);
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 