import { NextResponse } from 'next/server';
import pool from '@/lib/pg';

// GET: Return the currently published menu's layout for the current restaurant
export async function GET() {
  try {
    // TODO: Re-implement authentication. getToken import is currently broken.
    // const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // if (!token || !token.restaurantId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // For now, allow all requests (INSECURE!)
    const { rows } = await pool.query(
      'SELECT layout FROM "Menu" WHERE published = true ORDER BY "updatedAt" DESC LIMIT 1'
    );
    if (rows.length === 0) {
      return NextResponse.json({ layout: [] });
    }
    return NextResponse.json({ layout: rows[0].layout });
  } catch (error) {
    console.error('Error fetching published menu config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Deprecated
export async function POST() {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use /api/menu/menus instead.' }, { status: 400 });
} 