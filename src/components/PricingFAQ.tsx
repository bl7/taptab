'use client'
import { useState } from "react";

const faqs = [
  {
    q: "What happens after the trial ends?",
    a: "You can choose a plan and continue using all features. If you do nothing, your account will pause with no charges."
  },
  {
    q: "Can I cancel before I’m charged?",
    a: "Yes! Cancel anytime during the trial and you won’t be charged."
  },
  {
    q: "Do I need any hardware?",
    a: "No special hardware is needed. Just a printer connected to your local network."
  },
  {
    q: "Will it work on my printer?",
    a: "It works with most standard thermal receipt printers via our Zentra print bridge."
  }
];

export default function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg">
              <button
                className="w-full text-left px-4 py-3 font-semibold text-gray-900 flex justify-between items-center focus:outline-none"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
                aria-controls={`faq-${idx}`}
              >
                {faq.q}
                <span className="ml-2 text-green-600">{open === idx ? "−" : "+"}</span>
              </button>
              {open === idx && (
                <div id={`faq-${idx}`} className="px-4 pb-4 text-gray-800 text-base bg-gray-50 rounded-b-lg">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 