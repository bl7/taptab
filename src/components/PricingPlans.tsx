import Link from "next/link";

export default function PricingPlans() {
  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
          {/* Monthly Plan */}
          <div className="flex-1 bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">🗓️ Monthly Plan</h3>
            <div className="text-3xl font-bold mb-2 text-gray-900">₹X<span className="text-base font-normal text-gray-700">/month</span></div>
            <ul className="text-gray-700 mb-4 text-sm space-y-1">
              <li>Includes all features</li>
              <li>Cancel anytime</li>
            </ul>
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-4">✅ Includes 14-day free trial</span>
            <Link href="/auth/signup" className="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-full shadow hover:bg-green-700 transition">Start Free Trial</Link>
          </div>
          {/* Annual Plan */}
          <div className="flex-1 bg-gray-50 rounded-xl p-8 flex flex-col items-center text-center shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">📆 Annual Plan</h3>
            <div className="text-3xl font-bold mb-2 text-gray-900">₹Y<span className="text-base font-normal text-gray-700">/year</span></div>
            <div className="text-xs text-green-700 mb-1">(2 months free)</div>
            <ul className="text-gray-700 mb-4 text-sm space-y-1">
              <li>Includes all features</li>
              <li>Cancel anytime</li>
            </ul>
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-4">✅ Includes 14-day free trial</span>
            <Link href="/auth/signup" className="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-full shadow hover:bg-green-700 transition">Start Free Trial</Link>
          </div>
        </div>
      </div>
    </section>
  );
} 