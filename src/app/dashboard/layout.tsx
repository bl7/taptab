import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import pool from '@/lib/pg';
import { authOptions } from '../api/auth/[...nextauth]/authOptions';
import Sidebar from './Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  let restaurant = null;
  let dbError = null;
  
  if (session && session.user) {
    try {
      const user = session.user as { id: string };
      const { rows } = await pool.query(
        'SELECT name, "logoUrl" FROM "Restaurant" WHERE "userId" = $1',
        [user.id]
      );
      restaurant = rows[0];
    } catch (err: unknown) {
      console.error('Database error in dashboard layout:', err);
      dbError = (err as Error)?.message || 'Database connection error';
    }
  }

  // If there's a database error, redirect to login
  if (dbError) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-mint">
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar restaurant={restaurant} />
      </div>
      <main className="ml-64 flex-1 p-8 bg-mint min-h-screen shadow-inner">
        {children}
      </main>
    </div>
  );
} 



