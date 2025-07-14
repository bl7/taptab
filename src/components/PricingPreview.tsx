import Link from "next/link";

export default function PricingPreview() {
  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Simple Pricing</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-8">
          <div className="flex-1 bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">Monthly</h3>
            <div className="text-3xl font-bold mb-2">$19</div>
            <div className="text-gray-500 mb-4">per restaurant / month</div>
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-4">14-day free trial</span>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">Annual</h3>
            <div className="text-3xl font-bold mb-2">$190</div>
            <div className="text-gray-500 mb-4">per restaurant / year</div>
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-4">14-day free trial</span>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <Link href="/pricing" className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-full shadow hover:bg-green-700 transition">See Full Pricing</Link>
        </div>
      </div>
    </section>
  );
} 