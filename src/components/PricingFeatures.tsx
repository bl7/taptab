export default function PricingFeatures() {
  const features = [
    "QR-based ordering",
    "Live dashboard",
    "Automatic receipt printing",
    "Unlimited tables",
    "Menu with image uploads",
    "Admin control panel",
    "No app downloads required"
  ];
  return (
    <section className="w-full py-12 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">All plans include:</h2>
        <ul className="space-y-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center text-lg text-gray-800">
              <span className="text-green-600 mr-3 text-xl">✔️</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
} 