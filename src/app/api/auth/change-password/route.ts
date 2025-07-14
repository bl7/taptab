import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/pg';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // Fetch user
    const { rows } = await pool.query('SELECT "passwordHash" FROM "User" WHERE id = $1', [userId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }
    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE "User" SET "passwordHash" = $1 WHERE id = $2', [newHash, userId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 