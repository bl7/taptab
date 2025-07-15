'use client';
import { useState } from 'react';
import Image from 'next/image';

type Restaurant = { name?: string; logoUrl?: string; address?: string; country?: string; currency?: string; timeZone?: string };

const countries = [
  { code: 'NP', label: 'Nepal', currency: 'NPR', timeZone: 'Asia/Kathmandu' },
  { code: 'US', label: 'United States', currency: 'USD', timeZone: 'America/New_York' },
  { code: 'UK', label: 'United Kingdom', currency: 'GBP', timeZone: 'Europe/London' },
];

export default function ProfileClientForm({ restaurant, userId }: { restaurant: Restaurant; userId: string }) {
  const [form, setForm] = useState({
    name: restaurant?.name || '',
    logoUrl: restaurant?.logoUrl || '',
    address: restaurant?.address || '',
    country: restaurant?.country || 'NP',
    currency: restaurant?.currency || 'NPR',
    timeZone: restaurant?.timeZone || 'Asia/Kathmandu',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(f => ({ ...f, logoUrl: data.url }));
      } else {
        setError(data.error || 'Image upload failed. Please try again.');
      }
    } catch {
      setError('Image upload failed. Please check your network and try again.');
    }
    setLoading(false);
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch('/api/restaurant/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess('Profile updated successfully!');
    } else {
      const data = await res.json();
      setError(data.error || 'Update failed');
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (passwords.next !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }
    setPwLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        currentPassword: passwords.current,
        newPassword: passwords.next,
      }),
    });
    setPwLoading(false);
    if (res.ok) {
      setSuccess('Password updated successfully!');
      setPasswords({ current: '', next: '', confirm: '' });
    } else {
      const data = await res.json();
      setError(data.error || 'Password update failed');
    }
  }

  return (
    <div className="p-8">
      {/* Restaurant Details Section */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Restaurant Information</h2>
            <p className="text-slate-600 text-sm">Update your restaurant details and branding</p>
          </div>
        </div>

        <form onSubmit={handleDetailsSubmit} className="space-y-6">
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Restaurant Name *
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Enter your restaurant name"
              required
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Restaurant Logo
            </label>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-slate-600">
                        Click to upload or drag and drop
                      </span>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </label>
                </div>
              </div>
              {form.logoUrl && (
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden">
                    <Image
                      src={form.logoUrl}
                      alt="Restaurant Logo"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Address
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Enter restaurant address"
            />
          </div>

          {/* Country, Time Zone, and Currency Row */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Country
            </label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 transition-all duration-200"
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Time Zone
              </label>
              <select
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 transition-all duration-200"
                value={form.timeZone}
                onChange={e => setForm(f => ({ ...f, timeZone: e.target.value }))}
              >
                {/* Only show time zone for selected country */}
                {countries.filter(c => c.code === form.country).map(c => (
                  <option key={c.timeZone} value={c.timeZone}>{c.timeZone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Currency
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 transition-all duration-200"
                value={form.currency}
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 font-medium">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Saving Changes...</span>
              </div>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-b border-slate-200 mb-12"></div>

      {/* Password Section */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Security Settings</h2>
            <p className="text-slate-600 text-sm">Update your password to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
              value={passwords.current}
              onChange={e => setPasswords(pw => ({ ...pw, current: e.target.value }))}
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
              value={passwords.next}
              onChange={e => setPasswords(pw => ({ ...pw, next: e.target.value }))}
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
              value={passwords.confirm}
              onChange={e => setPasswords(pw => ({ ...pw, confirm: e.target.value }))}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {pwLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Updating Password...</span>
              </div>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}