import OrderPageClient from "./OrderPageClient";
import { headers } from "next/headers";
import MobileOrderPageClientWrapper from "./mobile/MobileOrderPageClientWrapper";

function isMobileOrTablet(userAgent: string | undefined) {
  if (!userAgent) return false;
  return /Mobi|Android|iPhone|iPad|iPod|Tablet|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export default async function Page() {
  const userAgent = (await headers()).get("user-agent") || "";
  const isMobile = isMobileOrTablet(userAgent);
  if (isMobile) {
    // Render the client wrapper for mobile
    return <MobileOrderPageClientWrapper />;
  }
  return <OrderPageClient />;
} 