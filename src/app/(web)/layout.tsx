import SiteFooter from "@/components/blocks/navigation/SiteFooter";
import HeaderNav from "@/components/blocks/navigation/HeaderNav";

export default function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="min-h-screen overflow-x-hidden scroll-smooth">
      <HeaderNav />
      {children}
      <SiteFooter />
    </main>
  )
}
