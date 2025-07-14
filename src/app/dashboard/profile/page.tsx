import { getServerSession } from 'next-auth/next';
import pool from '@/lib/pg';
import { authOptions } from '../../api/auth/[...nextauth]/authOptions';
import ProfileClientForm from './ProfileClientForm';
import React from 'react';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return <div className="text-center mt-20 text-red-600">Not authenticated</div>;
  }
  const user = session.user as { id: string };
  // Fetch restaurant details
  const { rows } = await pool.query(
    'SELECT name, "logoUrl", address, currency, "timeZone" FROM "Restaurant" WHERE "userId" = $1',
    [user.id]
  );
  const restaurant = rows[0];

  return (
    <div className="min-h-screen bg-mint flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl border border-mint">
        <ProfileClientForm restaurant={restaurant} userId={user.id} />
      </div>
    </div>
  );
} 


