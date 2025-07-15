"use client";
import { useEffect, useState, Fragment, useMemo, createRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import StyledQRCode, { StyledQRCodeHandle } from "@/components/StyledQRCode";

function getOrderUrl(restaurantId: string, tableId: string) {
  return `${window.location.origin}/order?rid=${restaurantId}&tid=${tableId}`;
}

export default function TablesPage() {
  type Table = { id: string; name: string; description?: string; restaurantId?: string };
  const [tables, setTables] = useState<Table[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Map of refs for each table QR, created once per tables array
  const qrRefs: Record<string, React.RefObject<StyledQRCodeHandle>> = useMemo(
    () => Object.fromEntries(tables.map((table) => [table.id, createRef<StyledQRCodeHandle>()])) as Record<string, React.RefObject<StyledQRCodeHandle>>,
    [tables]
  );

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tables");
    const data = await res.json();
    if (res.ok) {
      setTables(data.tables);
      if (data.tables.length > 0) {
        setRestaurantId(data.tables[0].restaurantId || null);
      } else {
        // Try to get restaurantId from session (fallback)
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        setRestaurantId(sessionData?.user?.restaurantId || null);
      }
    } else {
      setError(data.error || "Failed to load tables");
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setTables([data.table, ...tables]);
      setForm({ name: "", description: "" });
      if (!restaurantId) setRestaurantId(data.table.restaurantId);
    } else {
      setError(data.error || "Failed to create table");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this table?")) return;
    setError(null);
    const res = await fetch("/api/tables", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTables(tables.filter((t) => t.id !== id));
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete table");
    }
  }

  function handleDownloadQR(table: Table) {
    if (!qrRefs[table.id]) return;
    qrRefs[table.id]?.current?.download(`table-${table.name}-qr`, 'png');
  }

  function openEditModal(table: Table) {
    setEditTable(table);
    setEditForm({ name: table.name, description: table.description || "" });
  }

  function closeEditModal() {
    setEditTable(null);
    setEditForm({ name: "", description: "" });
    setEditLoading(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setError(null);
    const res = await fetch("/api/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: (editTable as Table).id, ...editForm }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (res.ok) {
      setTables(tables.map((t) => t.id === (editTable as Table).id ? { ...t, ...data.table } : t));
      closeEditModal();
    } else {
      setError(data.error || "Failed to update table");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-slate-900">Restaurant Manager</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-700">Table Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Table Management</h1>
                <p className="text-slate-600 mt-1">Create and manage your restaurant tables with QR codes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span>{tables.length} tables</span>
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <span>QR codes ready</span>
            </div>
          </div>
        </div>

        {/* Add Table Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add New Table</h2>
              <p className="text-slate-600 text-sm">Create a new table with QR code for customer orders</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Table Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Table 1, VIP Table, Patio A"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Window seat, Near kitchen, Outdoor"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {creating ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Creating Table...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Table</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Tables Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
            <div className="flex items-center justify-center space-x-3 text-slate-600">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-lg font-medium">Loading tables...</span>
            </div>
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No tables yet</h3>
            <p className="text-slate-600 mb-6">Create your first table to get started with QR code ordering</p>
            <button
              onClick={() => (document.querySelector('input[placeholder*="Table"]') as HTMLInputElement | null)?.focus()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Create First Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 hover:shadow-2xl transition-all duration-200">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{table.name}</h3>
                      {table.description && (
                        <p className="text-sm text-slate-600">{table.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(table)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit table"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete table"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center space-y-4">
                  {(table.restaurantId && table.id) ? (
                    <>
                      {/* Create or reuse a ref for each table QR */}
                        <StyledQRCode
                          ref={qrRefs[table.id]}
                          value={getOrderUrl(table.restaurantId || '', table.id || '')}
                          size={160}
                          logo="/qr-logo.svg"
                        />
                      <button
                        onClick={() => handleDownloadQR(table)}
                        className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:from-slate-900 hover:to-black focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download QR Code</span>
                        </div>
                      </button>
                      <div className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 text-center font-mono break-all">
                          {getOrderUrl(table.restaurantId, table.id)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium text-sm">
                        Cannot generate QR code
                      </p>
                      <p className="text-red-600 text-xs mt-1">
                        Missing restaurant or table ID
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Transition.Root show={!!editTable} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeEditModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-2xl transition-all border border-slate-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-bold text-slate-900">
                        Edit Table
                      </Dialog.Title>
                      <p className="text-slate-600 text-sm">Update table information</p>
                    </div>
                  </div>

                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Table Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 transition-all duration-200"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-slate-900 transition-all duration-200"
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeEditModal}
                        disabled={editLoading}
                        className="flex-1 bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editLoading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}