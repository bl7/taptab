import Head from "next/head";

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact – TapTab</title>
        <meta name="description" content="Contact TapTab for support, questions, or feedback." />
      </Head>
      <div className="bg-white min-h-screen">
        <main className="max-w-xl mx-auto px-4 py-12 text-gray-900">
          <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
          <p className="mb-4">Have a question or need help? Reach out to us and we’ll get back to you as soon as possible.</p>
          <div className="mb-6">
            <span className="font-semibold">Email:</span> <a href="mailto:support@yourdomain.com" className="text-green-700 underline">support@yourdomain.com</a>
          </div>
          {/* Optionally add social links here */}
          <div className="flex gap-4 mt-4">
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-green-700 underline">Twitter</a>
            <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-green-700 underline">Facebook</a>
          </div>
        </main>
      </div>
    </>
  );
} 