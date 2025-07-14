export default function HowItWorks() {
  const steps = [
    {
      icon: "📱",
      title: "Scan QR",
      desc: "Customer scans the QR code at their table."
    },
    {
      icon: "🛒",
      title: "Order from Phone",
      desc: "Browse menu and place order directly from their phone."
    },
    {
      icon: "🖨️",
      title: "Kitchen Prints Instantly",
      desc: "Order is printed instantly in the kitchen."
    }
  ];
  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">How It Works</h2>
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="flex-1 bg-gray-50 rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-4xl mb-4">{step.icon}</span>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">{step.title}</h3>
              <p className="text-gray-700 text-base">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 