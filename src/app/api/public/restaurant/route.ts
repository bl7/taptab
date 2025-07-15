import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        address: true,
        currency: true,
        timeZone: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 