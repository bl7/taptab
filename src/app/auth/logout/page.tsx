"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/auth/login" });
  }, []);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-700">Logging out...</div>
    </div>
  );
} 