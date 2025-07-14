"use client";
import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { QRCodeCanvas } from "qrcode.react";

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
    const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-${table.name}-qr.png`;
    a.click();
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
    <div className="min-h-screen bg-mint">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-forest mb-8">Tables</h1>
        <form className="flex flex-col gap-4 mb-8" onSubmit={handleCreate}>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Table Name"
              className="input input-bordered flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-lg bg-gray-100"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              className="input input-bordered flex-1 px-4 py-2 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <button
              type="submit"
              className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition text-lg shadow-md disabled:opacity-60"
              disabled={creating}
            >
              {creating ? "Adding..." : "Add Table"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-600 text-base font-medium bg-red-50 border border-red-200 rounded p-2 text-center mb-4">{error}</div>}
        {loading ? (
          <div className="text-center text-forest/60">Loading tables...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tables.map((table) => (
              <div key={table.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border border-mint">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg font-bold text-forest">{table.name}</div>
                  <button
                    className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    onClick={() => openEditModal(table)}
                    title="Edit table"
                  >
                    Edit
                  </button>
                  <button
                    className="ml-2 text-red-500 hover:text-red-700 text-sm font-semibold"
                    onClick={() => handleDelete(table.id)}
                    title="Delete table"
                  >
                    Delete
                  </button>
                </div>
                {table.description && <div className="text-forest/60 mb-2">{table.description}</div>}
                {(table.restaurantId && table.id) ? (
                  <>
                    <QRCodeCanvas
                      id={`qr-${table.id}`}
                      value={getOrderUrl(table.restaurantId, table.id)}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                    <button
                      className="mt-3 bg-forest text-mint font-semibold px-4 py-2 rounded hover:bg-forest/90 transition text-sm"
                      onClick={() => handleDownloadQR(table)}
                    >
                      Download QR
                    </button>
                    <div className="text-xs text-forest/60 mt-2 break-all text-center">
                      {getOrderUrl(table.restaurantId, table.id)}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-center w-full">
                    Cannot generate QR code: missing restaurant or table ID.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Transition.Root show={!!editTable} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeEditModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 mb-4">
                    Edit Table
                  </Dialog.Title>
                  <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
                    <label className="font-semibold text-gray-800">Table Name</label>
                    <input
                      type="text"
                      className="input input-bordered w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900 text-lg bg-gray-100"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                    <label className="font-semibold text-gray-800">Description</label>
                    <input
                      type="text"
                      className="input input-bordered w-full px-4 py-2 rounded border border-gray-300 text-gray-900 text-lg bg-gray-100"
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition"
                        onClick={closeEditModal}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                        disabled={editLoading}
                      >
                        {editLoading ? "Saving..." : "Save Changes"}
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