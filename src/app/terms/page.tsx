import Head from "next/head";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service – TapTab</title>
        <meta name="description" content="Read the terms of service for TapTab, the QR-based restaurant ordering platform." />
      </Head>
      <div className="bg-white min-h-screen">
        <main className="max-w-2xl mx-auto px-4 py-12 text-gray-900">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By using TapTab, you agree to these terms. If you do not agree, please do not use our service.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">2. Subscription and Billing</h2>
            <p>TapTab is a subscription service. You will be billed according to your selected plan. All payments are handled securely by our payment partners.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">3. Cancellation Policy</h2>
            <p>You may cancel your subscription at any time. Cancellations take effect at the end of your current billing period. No refunds for partial periods.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">4. Limitation of Liability</h2>
            <p>TapTab is provided &quot;as is&quot; without warranties. We are not liable for any damages or losses resulting from your use of the service.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">5. Contact Information</h2>
            <p>For questions, contact us at <a href="mailto:support@yourdomain.com" className="text-green-700 underline">support@yourdomain.com</a>.</p>
          </section>
          <p className="text-sm text-gray-500">This is placeholder legal text. Please update with your actual terms.</p>
        </main>
      </div>
    </>
  );
} 