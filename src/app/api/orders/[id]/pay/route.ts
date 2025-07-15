import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastOrder } from '../../../socket/broadcast';

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
    
    // Only broadcast in production/runtime
    if (process.env.NODE_ENV === 'production') {
      broadcastOrder(orderForBroadcast);
    }
    
    return NextResponse.json(orderForBroadcast);
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}