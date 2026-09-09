"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  User,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";

type Mahasiswa = { id: string; nama: string; nim: string; email: string };
type Kelas = {
  id: string;
  nama: string;
  angkatan: string;
};
type ParsedRow = { nama: string; nim: string; email: string };
type BulkPreview = {
  valid: ParsedRow[];
  duplicate: string[];
  invalid: string[];
};

export default function DetailKelasPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form satuan
  const [mode, setMode] = useState<"satuan" | "massal">("satuan");
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form massal
  const [bulkText, setBulkText] = useState("");
  const [preview, setPreview] = useState<BulkPreview | null>(null);

  // Modal edit
  const [editingM, setEditingM] = useState<Mahasiswa | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editNim, setEditNim] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [kelasRes, mahasiswaRes] = await Promise.all([
        fetch(`/api/kelas/${id}`),
        fetch(`/api/mahasiswa?kelasId=${id}`),
      ]);

      if (kelasRes.ok) {
        setKelas(await kelasRes.json());
      } else if (kelasRes.status === 404) {
        setLoadError("Kelas tidak ditemukan.");
      } else {
        setLoadError("Gagal memuat data kelas.");
      }

      if (mahasiswaRes.ok) {
        setMahasiswaList(await mahasiswaRes.json());
      }
    } catch {
      setLoadError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // ---------- Tambah satuan ----------
  async function handleAdd() {
    setError(null);
    setSuccess(null);
    if (!nama.trim() || !nim.trim() || !email.trim()) {
      setError("Nama, NIM, dan email wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), nim: nim.trim(), email: email.trim(), kelasId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah mahasiswa.");
        return;
      }
      setNama("");
      setNim("");
      setEmail("");
      setSuccess("Mahasiswa berhasil ditambahkan.");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  // ---------- Tambah massal ----------
  function parseBulk(text: string, existing: Mahasiswa[]): BulkPreview {
    const existingNim = new Set(existing.map((m) => m.nim));
    const seenNim = new Set<string>();
    const valid: ParsedRow[] = [];
    const duplicate: string[] = [];
    const invalid: string[] = [];

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const parts = line.includes("\t") ? line.split("\t") : line.split(/[;,&]/);
      const [na, ni, em] = parts.map((p) => p.trim());

      if (!na || !ni || !em) {
        invalid.push(line);
        continue;
      }
      if (seenNim.has(ni)) {
        duplicate.push(`${na} (${ni}) — duplikat di dalam daftar`);
        continue;
      }
      if (existingNim.has(ni)) {
        duplicate.push(`${na} (${ni}) — sudah ada di kelas`);
        continue;
      }
      seenNim.add(ni);
      valid.push({ nama: na, nim: ni, email: em });
    }

    return { valid, duplicate, invalid };
  }

  function handlePreview() {
    setError(null);
    setSuccess(null);
    if (!bulkText.trim()) {
      setError("Tempel dulu daftar mahasiswa ke kolom di bawah.");
      return;
    }
    setPreview(parseBulk(bulkText, mahasiswaList));
  }

  async function handleBulkConfirm() {
    if (!preview || preview.valid.length === 0) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/mahasiswa/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kelasId: id, items: preview.valid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah mahasiswa massal.");
        return;
      }
      const skippedCount = Array.isArray(data.skipped) ? data.skipped.length : 0;
      const msg = `${data.added} mahasiswa berhasil ditambahkan.${
        skippedCount > 0 ? ` ${skippedCount} dilewati (sudah ada di kelas).` : ""
      }`;
      setSuccess(msg);
      setBulkText("");
      setPreview(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  function handleUpdateBulkText(v: string) {
    setBulkText(v);
    if (preview) setPreview(null);
  }

  async function handleDelete(mid: string) {
    if (!confirm("Hapus mahasiswa ini dari kelas?")) return;
    setDeletingId(mid);
    try {
      const res = await fetch(`/api/mahasiswa/${mid}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Gagal menghapus mahasiswa.");
        return;
      }
      setSuccess("Mahasiswa dihapus dari kelas.");
      await loadData();
    } finally {
      setDeletingId(null);
    }
  }

  // ---------- Edit mahasiswa ----------
  function openEditModal(m: Mahasiswa) {
    setEditingM(m);
    setEditNama(m.nama);
    setEditNim(m.nim);
    setEditEmail(m.email);
    setEditError(null);
  }

  function closeEditModal() {
    setEditingM(null);
    setEditNama("");
    setEditNim("");
    setEditEmail("");
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingM) return;
    setEditError(null);
    if (!editNama.trim() || !editNim.trim() || !editEmail.trim()) {
      setEditError("Nama, NIM, dan email wajib diisi.");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/mahasiswa/${editingM.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: editNama.trim(), nim: editNim.trim(), email: editEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      closeEditModal();
      setSuccess("Data mahasiswa berhasil diperbarui.");
      await loadData();
    } finally {
      setIsSavingEdit(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-40";

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
      active
        ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs"
        : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
    }`;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {loading ? (
            <div className="h-9 w-64 rounded-lg bg-[var(--border-soft)] animate-pulse" />
          ) : loadError ? (
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--danger-text)] sm:text-3xl">
              {loadError}
            </h1>
          ) : (
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              {kelas ? `${kelas.nama} - Angkatan ${kelas.angkatan}` : "Kelas tidak ditemukan"}
            </h1>
          )}

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Daftar mahasiswa di kelas ini akan otomatis menerima email notifikasi setiap
            kali dosen membuat soal baru.
          </p>
        </div>

        <button
          onClick={() => router.push("/kelas")}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] shadow-xs transition-all hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
      </header>

      {loadError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4">
          <AlertTriangle className="h-5 w-5 text-[var(--danger-text)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--danger-text)]">{loadError}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Periksa kembali link kelas, atau{" "}
              <button onClick={loadData} className="underline underline-offset-2 hover:text-[var(--text)]">
                coba muat ulang
              </button>
              .
            </p>
          </div>
        </div>
      )}

      {/* Tambah mahasiswa */}
      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 sm:p-6 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-sm font-bold text-[var(--text)]">
            Tambah Mahasiswa
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-soft)] p-1">
            <button type="button" onClick={() => setMode("satuan")} className={tabClass(mode === "satuan")}>
              <Plus className="h-3.5 w-3.5" />
              Satuan
            </button>
            <button type="button" onClick={() => setMode("massal")} className={tabClass(mode === "massal")}>
              <UserPlus className="h-3.5 w-3.5" />
              Massal
            </button>
          </div>
        </div>

        {mode === "satuan" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px_1fr_auto]">
            <input
              className={inputClass}
              placeholder="Nama mahasiswa"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="NIM"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
        ) : (
          <div>
            <textarea
              className={`${inputClass} min-h-[120px] font-mono text-[13px] resize-y`}
              placeholder={`Nama, NIM, Email — satu baris per mahasiswa.\nBisa langsung paste dari Excel (kolom: Nama, NIM, Email).\nContoh:\nBudi Santoso, 2220101, budi@mail.com\nSari Lestari, 2220102, sari@mail.com`}
              value={bulkText}
              onChange={(e) => handleUpdateBulkText(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={handlePreview}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-fg)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardList className="h-4 w-4" />
                Parsing &amp; Pratinjau
              </button>
              {preview && preview.valid.length > 0 && (
                <button
                  onClick={handleBulkConfirm}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-2.5 text-sm font-bold text-[var(--success-ink)] shadow-xs transition-all hover:border-[var(--success-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Konfirmasi Tambah {preview.valid.length > 0 ? `(${preview.valid.length})` : ""}
                </button>
              )}
            </div>

            {preview && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] px-3 py-2.5 text-sm text-[var(--success-ink)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>{preview.valid.length}</strong> mahasiswa valid, siap ditambahkan.
                  </span>
                </div>

                {preview.duplicate.length > 0 && (
                  <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2.5 text-sm text-[var(--danger-text)]">
                    <p className="flex items-center gap-2 font-semibold mb-1.5">
                      <XCircle className="h-4 w-4 shrink-0" />
                      {preview.duplicate.length} dilewati
                    </p>
                    <ul className="space-y-0.5 text-xs max-h-24 overflow-y-auto">
                      {preview.duplicate.map((d, i) => (
                        <li key={i} className="truncate">• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {preview.invalid.length > 0 && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text-muted)]">
                    <p className="flex items-center gap-2 font-semibold mb-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--danger-text)]" />
                      {preview.invalid.length} baris tidak lengkap
                    </p>
                    <ul className="space-y-0.5 text-xs max-h-24 overflow-y-auto">
                      {preview.invalid.map((d, i) => (
                        <li key={i} className="truncate">• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-sm text-[var(--danger-text)]">{error}</p>}
        {success && (
          <p className="mt-2 text-sm text-[var(--success-ink)] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </p>
        )}
      </section>

      {/* Daftar mahasiswa */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold text-[var(--text)]">Daftar Mahasiswa</h2>
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent-ink)]">
            {mahasiswaList.length} mahasiswa
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-[var(--text-faint)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
          </div>
        ) : mahasiswaList.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-faint)]">
            Belum ada mahasiswa. Tambahkan di atas — kalau kosong, notifikasi soal baru
            tidak akan terkirim.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-soft)]">
            {mahasiswaList.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                    <User className="h-4 w-4 text-[var(--accent-ink)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{m.nama}</p>
                    <p className="text-xs text-[var(--text-faint)] truncate">
                      {m.nim} &middot; {m.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(m)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-faint)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
                    aria-label="Edit mahasiswa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-faint)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Hapus mahasiswa"
                  >
                    {deletingId === m.id ? (
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

      {/* Modal Edit Mahasiswa */}
      {editingM && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-soft)] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border-soft)] pb-3">
              <h3 className="font-heading text-base font-bold text-[var(--text)]">Edit Mahasiswa</h3>
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
                  Nama
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
                  NIM
                </label>
                <input
                  type="text"
                  value={editNim}
                  onChange={(e) => setEditNim(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
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
                disabled={isSavingEdit || !editNama.trim() || !editNim.trim() || !editEmail.trim()}
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