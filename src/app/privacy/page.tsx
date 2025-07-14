import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy – TapTab</title>
        <meta name="description" content="Read the privacy policy for TapTab, the QR-based restaurant ordering platform." />
      </Head>
      <div className="bg-white min-h-screen">
        <main className="max-w-2xl mx-auto px-4 py-12 text-gray-900">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">1. Data We Collect</h2>
            <p>We collect information such as your email, name, and order details to provide our service.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Data</h2>
            <p>Your data is used for billing, support, and to enable order processing and printing. We do not sell your data.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">3. Third-Party Services</h2>
            <p>We use trusted third-party services such as Stripe, Brevo, and Cloudinary to operate TapTab. These services may process your data as needed to provide their functionality.</p>
          </section>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">4. Data Deletion & Questions</h2>
            <p>You can request deletion of your data or ask questions by contacting <a href="mailto:support@yourdomain.com" className="text-green-700 underline">support@yourdomain.com</a>.</p>
          </section>
          <p className="text-sm text-gray-500">This is placeholder privacy text. Please update with your actual policy.</p>
        </main>
      </div>
    </>
  );
} 