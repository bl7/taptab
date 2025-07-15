'use client'
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { SidebarContext } from './SidebarContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Persist sidebar state in localStorage
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarExpanded');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarExpanded', String(expanded));
    }
  }, [expanded]);

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      <div className="min-h-screen bg-mint">
        <Sidebar restaurant={null} expanded={expanded} setExpanded={setExpanded} />
        <main className={`${expanded ? 'ml-60' : 'ml-20'} flex-1 p-0 bg-mint min-h-screen shadow-inner transition-all duration-200`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
} 



