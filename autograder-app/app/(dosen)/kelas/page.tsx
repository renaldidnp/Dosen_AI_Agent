"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, School, Sparkles, Trash2, X } from "lucide-react";

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

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-40";

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold mb-2">
            <Sparkles className="w-[15px] h-[15px]" />
            Manajemen Kelas
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            Kelas
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Kelola daftar kelas per angkatan. Digunakan untuk mengelompokkan mahasiswa,
            soal, dan folder PDF di Google Drive.
          </p>
        </header>

        {/* Tambah kelas */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-xs">
          <h2 className="mb-4 font-heading text-sm font-bold text-[var(--text)]">
            Tambah Kelas Baru
          </h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
            <input
              className={inputClass}
              placeholder="Nama kelas, contoh: TI-A"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Angkatan, contoh: 2024"
              value={angkatan}
              onChange={(e) => setAngkatan(e.target.value)}
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-fg)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-[var(--danger-text)]">{error}</p>}
        </section>

        {/* Daftar kelas */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-[var(--text)]">Daftar Kelas</h2>
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent-ink)]">
              {kelasList.length} kelas
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-[var(--text-faint)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            </div>
          ) : kelasList.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-faint)]">
              Belum ada kelas. Tambahkan kelas pertama di atas.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-soft)]">
              {kelasList.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-3">
                  <Link
                    href={`/kelas/${k.id}`}
                    className="flex items-center gap-3 group min-w-0 flex-1 rounded-xl transition-colors hover:bg-[var(--accent-soft)]/40 -mx-2 px-2 py-1"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                      <School className="h-4 w-4 text-[var(--accent-ink)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent-ink)] transition-colors truncate">
                        {k.nama}
                      </p>
                      <p className="text-xs text-[var(--text-faint)]">Angkatan {k.angkatan}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(k)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-faint)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
                      aria-label="Edit kelas"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(k.id)}
                      disabled={deletingId === k.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-faint)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Hapus kelas"
                    >
                      {deletingId === k.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-soft)] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border-soft)] pb-3">
              <h3 className="font-heading text-base font-bold text-[var(--text)]">Edit Kelas</h3>
              <button
                onClick={closeEditModal}
                className="text-[var(--text-faint)] hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  Angkatan
                </label>
                <input
                  type="text"
                  value={editAngkatan}
                  onChange={(e) => setEditAngkatan(e.target.value)}
                  className={inputClass}
                />
              </div>
              {editError && <p className="text-sm text-[var(--danger-text)]">{editError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-soft)]">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--text)] rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editNama.trim() || !editAngkatan.trim()}
                className="px-5 py-2.5 text-xs font-bold text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
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