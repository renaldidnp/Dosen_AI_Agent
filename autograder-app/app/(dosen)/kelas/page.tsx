"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, School, Trash2, X } from "lucide-react";

type Kelas = { id: string; nama: string; angkatan: string; createdAt: string };

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // state modal edit
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editAngkatan, setEditAngkatan] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function loadKelas() {
    setLoading(true);
    try {
      const res = await fetch("/api/kelas");
      if (res.ok) setKelasList(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKelas();
  }, []);

  async function handleAdd() {
    setError(null);
    if (!nama.trim() || !angkatan.trim()) {
      setError("Nama kelas dan angkatan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), angkatan: angkatan.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah kelas.");
        return;
      }
      setNama("");
      setAngkatan("");
      await loadKelas();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kelas ini? Aksi tidak dapat dibatalkan.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/kelas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Gagal menghapus kelas.");
        return;
      }
      await loadKelas();
    } finally {
      setDeletingId(null);
    }
  }

  function openEditModal(k: Kelas) {
    setEditingKelas(k);
    setEditNama(k.nama);
    setEditAngkatan(k.angkatan);
    setEditError(null);
  }

  function closeEditModal() {
    setEditingKelas(null);
    setEditNama("");
    setEditAngkatan("");
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingKelas) return;
    setEditError(null);
    if (!editNama.trim() || !editAngkatan.trim()) {
      setEditError("Nama kelas dan angkatan wajib diisi.");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/kelas/${editingKelas.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: editNama.trim(), angkatan: editAngkatan.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      closeEditModal();
      await loadKelas();
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">Manajemen Kelas</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Kelas</h1>
          <p className="mt-2 text-sm text-slate-500">Kelola daftar kelas per angkatan. Digunakan untuk mengelompokkan mahasiswa, soal, dan folder PDF di Google Drive.</p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Tambah Kelas Baru</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
            <input
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="Nama kelas, contoh: TI-A"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="Angkatan, contoh: 2024"
              value={angkatan}
              onChange={(e) => setAngkatan(e.target.value)}
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Daftar Kelas</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{kelasList.length} kelas</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : kelasList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada kelas. Tambahkan kelas pertama di atas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {kelasList.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-3">
                  <Link href={`/kelas/${k.id}`} className="flex items-center gap-3 hover:opacity-70">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
                      <School className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{k.nama}</p>
                      <p className="text-xs text-slate-400">Angkatan {k.angkatan}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(k)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600" aria-label="Edit kelas">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(k.id)}
                      disabled={deletingId === k.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Hapus kelas"
                    >
                      {deletingId === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Modal Edit Kelas */}
      {editingKelas && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Edit Kelas</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Nama Kelas</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Angkatan</label>
                <input
                  type="text"
                  value={editAngkatan}
                  onChange={(e) => setEditAngkatan(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editNama.trim() || !editAngkatan.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
