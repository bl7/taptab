"use client";
import dynamic from "next/dynamic";
import React from "react";

const MobileOrderPage = dynamic(() => import("./MobileOrderPage"), { ssr: false });

export default function MobileOrderPageClientWrapper() {
  return <MobileOrderPage />;
} 