'use client';
import { useState } from 'react';
import Image from 'next/image';

type Restaurant = { name?: string; logoUrl?: string; address?: string; currency?: string; timeZone?: string };
export default function ProfileClientForm({ restaurant, userId }: { restaurant: Restaurant; userId: string }) {
  const [form, setForm] = useState({
    name: restaurant?.name || '',
    logoUrl: restaurant?.logoUrl || '',
    address: restaurant?.address || '',
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
      setSuccess('Profile updated!');
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
      setSuccess('Password updated!');
      setPasswords({ current: '', next: '', confirm: '' });
    } else {
      const data = await res.json();
      setError(data.error || 'Password update failed');
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Profile</h1>
      <form className="flex flex-col gap-6" onSubmit={handleDetailsSubmit}>
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
        {form.logoUrl && (
          <Image
            src={form.logoUrl}
            alt="Logo"
            width={80}
            height={80}
            className="h-20 my-2 rounded shadow"
          />
        )}
        <label className="font-semibold text-gray-800">Address</label>
        <input
          type="text"
          className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        />
        <label className="font-semibold text-gray-800">Time Zone</label>
        <select
          className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
          value={form.timeZone}
          onChange={e => setForm(f => ({ ...f, timeZone: e.target.value }))}
        >
          {['Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Karachi', 'Asia/Bangkok'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
        <label className="font-semibold text-gray-800">Currency</label>
        <select
          className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
          value={form.currency}
          onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
        >
          {[{ code: 'NPR', label: 'Nepalese Rupee' }, { code: 'INR', label: 'Indian Rupee' }, { code: 'BDT', label: 'Bangladeshi Taka' }, { code: 'PKR', label: 'Pakistani Rupee' }, { code: 'THB', label: 'Thai Baht' }].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        {error && <div className="text-red-600 text-base font-medium bg-red-50 border border-red-200 rounded p-2 text-center">{error}</div>}
        {success && <div className="text-green-700 text-base font-medium bg-green-50 border border-green-200 rounded p-2 text-center">{success}</div>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition text-lg shadow-md disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
      <hr className="my-8" />
      <h2 className="text-xl font-bold mb-4 text-gray-900">Change Password</h2>
      <form className="flex flex-col gap-6" onSubmit={handlePasswordSubmit}>
        <label className="font-semibold text-gray-800">Current Password</label>
        <input
          type="password"
          className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
          value={passwords.current}
          onChange={e => setPasswords(pw => ({ ...pw, current: e.target.value }))}
          required
        />
        <label className="font-semibold text-gray-800">New Password</label>
        <input
          type="password"
          className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
          value={passwords.next}
          onChange={e => setPasswords(pw => ({ ...pw, next: e.target.value }))}
          required
        />
        <label className="font-semibold text-gray-800">Confirm New Password</label>
        <input
          type="password"
          className="input input-bordered w-full px-4 py-3 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
          value={passwords.confirm}
          onChange={e => setPasswords(pw => ({ ...pw, confirm: e.target.value }))}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition text-lg shadow-md disabled:opacity-60"
          disabled={pwLoading}
        >
          {pwLoading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
} 