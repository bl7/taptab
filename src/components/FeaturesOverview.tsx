export default function FeaturesOverview() {
  const features = [
    {
      icon: "⚡",
      title: "Real-time Orders",
      desc: "See new orders instantly on your dashboard."
    },
    {
      icon: "🖨️",
      title: "Auto-print Receipts",
      desc: "Orders print automatically in the kitchen."
    },
    {
      icon: "☁️",
      title: "Cloud Menu",
      desc: "Easily update your menu with images from anywhere."
    },
    {
      icon: "🚫",
      title: "No App Needed",
      desc: "Customers order with just their phone browser."
    },
    {
      icon: "🔒",
      title: "Secure & Reliable",
      desc: "Protected data and reliable printing, always."
    }
  ];
  return (
    <section className="w-full py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-3xl mb-3">{feature.icon}</span>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-700 text-base">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 