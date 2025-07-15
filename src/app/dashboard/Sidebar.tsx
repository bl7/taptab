"use client";
import { usePathname } from "next/navigation";
import { Home, Table, User, LogOut, Utensils, Settings, BookOpen, ChevronLeft, Menu as MenuIcon } from "lucide-react";
import Image from 'next/image';
import { useState } from 'react';

interface SidebarProps {
  restaurant: {
    name?: string;
    logoUrl?: string;
  } | null;
}

const MAIN_NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/reports", label: "Reports", icon: BookOpen },
];

const ORGANISATION_NAV = [
  { href: "/dashboard/menu", label: "Menu Management", icon: Utensils },
  { href: "/dashboard/tables", label: "Tables", icon: Table },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function Sidebar({ restaurant }: SidebarProps) {
  // For demo, static user info
  const user = {
    name: restaurant?.name || "Alicia Vikander",
    email: "alicia@sisyphus.com",
    avatar: restaurant?.logoUrl || undefined,
  };
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className={`bg-white flex flex-col h-screen border-r border-gray-100 shadow-lg transition-all duration-200 ${expanded ? 'w-60' : 'w-20'}`}>
      {/* Top: Logo and toggle */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className={`font-extrabold text-2xl text-green-700 tracking-tight transition-all duration-200 ${expanded ? '' : 'scale-90'}`}>TapTab</span>
        </div>
        <button
          className="ml-2 p-2 rounded hover:bg-gray-100 transition"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <ChevronLeft className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>
      {/* Main nav */}
      <nav className={`flex flex-col gap-1 ${expanded ? 'px-6 pt-6' : 'px-2 pt-6'}`}>
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-base transition ${isActive ? "bg-green-50 text-green-700 shadow-sm" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
              {expanded && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>
      <div className="my-6 border-t border-gray-100" />
      {/* Organisation section */}
      {expanded && <div className="px-6 text-xs font-bold text-gray-400 tracking-widest mb-2 mt-2 uppercase">Organisation</div>}
      <nav className={`flex flex-col gap-1 ${expanded ? 'px-6' : 'px-2'}`}> 
        {ORGANISATION_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-base transition ${isActive ? "bg-green-50 text-green-700 shadow-sm" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
              {expanded && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto" />
      {/* User profile at the bottom */}
      <div className={`mt-auto ${expanded ? 'px-6 py-6' : 'px-2 py-4'} border-t border-gray-100 flex items-center gap-3 bg-gray-50 ${expanded ? 'rounded-b-2xl' : ''}`}>
        {user.avatar ? (
          <Image src={user.avatar} alt="Avatar" width={40} height={40} className="rounded-full object-cover border-2 border-green-200" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">A</div>
        )}
        {expanded && (
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-sm">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        )}
        <button className="text-gray-400 hover:text-green-700 transition">
          <Settings className="w-5 h-5" />
        </button>
      </div>
      {/* Logout button */}
      <div className={`${expanded ? 'px-6 pb-6' : 'px-2 pb-4'}`}>
        <a
          href="/auth/logout"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-base transition text-gray-700 hover:bg-green-50 hover:text-red-600`}
        >
          <LogOut className="w-5 h-5" />
          {expanded && <span>Logout</span>}
        </a>
      </div>
    </aside>
  );
} 