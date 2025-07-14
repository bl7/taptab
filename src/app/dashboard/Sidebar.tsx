"use client";
import { usePathname } from "next/navigation";
import { Home, List, ClipboardList, Table, User, LogOut, Utensils, Settings, BookOpen, ChefHat } from "lucide-react";
import Image from 'next/image';

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
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
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

  return (
    <aside className="bg-white flex flex-col h-screen w-72 border-r border-gray-100 shadow-lg">
      {/* Top: Logo and toggle */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl text-blue-900 tracking-tight">TapTab</span>
        </div>
      </div>
      {/* Main nav */}
      <nav className="flex flex-col gap-1 px-6 pt-6">
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-base transition
                ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="my-6 border-t border-gray-100" />
      {/* Organisation section */}
      <div className="px-6 text-xs font-semibold text-gray-400 tracking-widest mb-2 mt-2">ORGANISATION</div>
      <nav className="flex flex-col gap-1 px-6">
        {ORGANISATION_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-base transition
                ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="mt-auto" />
      {/* User profile at the bottom */}
      <div className="mt-auto px-6 py-6 border-t border-gray-100 flex items-center gap-3">
        {user.avatar ? (
          <Image src={user.avatar} alt="Avatar" width={40} height={40} className="rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-blue-900">A</div>
        )}
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
        <button className="text-gray-400 hover:text-blue-700">
          <Settings className="w-5 h-5" />
        </button>
      </div>
      {/* Logout button */}
      <div className="px-6 pb-6">
        <a
          href="/auth/logout"
          className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-base transition text-gray-700 hover:bg-gray-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
} 