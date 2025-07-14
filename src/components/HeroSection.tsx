import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="w-full py-16 flex flex-col items-center text-center bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-center mb-6">
          {/* Placeholder logo/icon */}
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold">TT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">QR-based Ordering for Restaurants – With Instant Kitchen Printing</h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-8">Let your customers order from their table. Print instantly. No hardware setup.</p>
        <Link href="/auth/signup" className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-full shadow hover:bg-green-700 transition">Start Free Trial</Link>
      </div>
    </section>
  );
} 