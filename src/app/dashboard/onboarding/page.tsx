"use client";
import { useState } from "react";
import { z } from "zod";
import Image from 'next/image';

const countries = [
  { code: 'NP', label: 'Nepal', currency: 'NPR', timeZone: 'Asia/Kathmandu' },
  { code: 'US', label: 'United States', currency: 'USD', timeZone: 'America/New_York' },
  { code: 'UK', label: 'United Kingdom', currency: 'GBP', timeZone: 'Europe/London' },
];

const OnboardingSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  logoUrl: z.string().url().optional(),
  address: z.string().optional(),
  country: z.string().min(2),
  currency: z.string().optional(),
  timeZone: z.string().optional(),
});

export default function OnboardingPage() {
  const [form, setForm] = useState({ name: "", logoUrl: "", address: "", country: "NP", currency: "NPR", timeZone: "Asia/Kathmandu" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(f => ({ ...f, logoUrl: data.url }));
      } else {
        setError(data.error || "Image upload failed. Please try again.");
      }
    } catch {
      setError("Image upload failed. Please check your network and try again.");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const result = OnboardingSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/restaurant/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      window.location.href = "/dashboard";
    } else {
      const data = await res.json();
      setError(data.error || "Update failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-10">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900">Set Up Your Restaurant</h1>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <label className="font-semibold text-gray-800">Restaurant Name *</label>
          <input
            type="text"
            className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-lg bg-gray-100"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <label className="font-semibold text-gray-800">Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="mb-2" />
          {form.logoUrl && <Image
            src={form.logoUrl}
            alt="Logo"
            width={400}
            height={128}
            className="h-20 my-2 rounded shadow"
          />}
          <label className="font-semibold text-gray-800">Address</label>
          <input
            type="text"
            className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
          <label className="font-semibold text-gray-800">Country</label>
          <select
            className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
            value={form.country}
            onChange={e => {
              const selected = countries.find(c => c.code === e.target.value);
              setForm(f => ({
                ...f,
                country: selected?.code || 'NP',
                currency: selected?.currency || 'NPR',
                timeZone: selected?.timeZone || 'Asia/Kathmandu',
              }));
            }}
          >
            {countries.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <label className="font-semibold text-gray-800">Currency</label>
          <input
            type="text"
            className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
            value={form.currency}
            disabled
            readOnly
          />
          <label className="font-semibold text-gray-800">Time Zone</label>
          <select
            className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
            value={form.timeZone}
            onChange={e => setForm(f => ({ ...f, timeZone: e.target.value }))}
          >
            {/* Only show time zones for the selected country */}
            {countries.filter(c => c.code === form.country).map(c => (
              <option key={c.timeZone} value={c.timeZone}>{c.timeZone}</option>
            ))}
          </select>
          {error && <div className="text-red-600 text-base font-medium bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
          {success && <div className="text-green-700 text-base font-medium bg-green-50 border border-green-200 rounded p-2 text-center">Profile updated!</div>}
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition text-lg shadow-md disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
} 