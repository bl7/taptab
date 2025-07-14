import Head from "next/head";
import PricingPlans from "@/components/PricingPlans";
import PricingFeatures from "@/components/PricingFeatures";
import PricingFAQ from "@/components/PricingFAQ";

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing – TapTab</title>
        <meta name="description" content="Monthly or yearly plans, 14-day trial included. QR ordering and automatic printing for restaurants." />
        <meta property="og:title" content="Pricing – TapTab" />
        <meta property="og:description" content="Monthly or yearly plans, 14-day trial included. QR ordering and automatic printing for restaurants." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/pricing" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing – TapTab" />
        <meta name="twitter:description" content="Monthly or yearly plans, 14-day trial included. QR ordering and automatic printing for restaurants." />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>
      <main className="min-h-screen bg-white">
        <section className="w-full py-16 text-center bg-gradient-to-b from-white to-gray-50">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-black">Simple, Transparent Pricing</h1>
          <p className="text-lg sm:text-xl text-gray-900 mb-8">Try it free for 14 days. No commitment. No credit card required.</p>
        </section>
        <PricingPlans />
        <PricingFeatures />
        <PricingFAQ />
        <section className="mt-12">
        </section>
      </main>
    </>
  );
} 