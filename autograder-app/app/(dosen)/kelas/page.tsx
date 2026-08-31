"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, School, Trash2 } from "lucide-react";

type Kelas = { id: string; nama: string; angkatan: string; createdAt: string };

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
                      <School className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{k.nama}</p>
                      <p className="text-xs text-slate-400">Angkatan {k.angkatan}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(k.id)}
                    disabled={deletingId === k.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Hapus kelas"
                  >
                    {deletingId === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
