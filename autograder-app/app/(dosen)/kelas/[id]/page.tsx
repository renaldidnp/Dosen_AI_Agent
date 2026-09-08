"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, Plus, Trash2, User } from "lucide-react";

type Mahasiswa = { id: string; nama: string; nim: string; email: string };
type Kelas = { id: string; nama: string; angkatan: string };

export default function DetailKelasPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  // Ditandai terpisah dari `loading` supaya kita bisa membedakan
  // "masih memuat" vs "sudah selesai memuat tapi kelasnya tidak ada / gagal".
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleAdd() {
    setError(null);
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
      await loadData();
    } finally {
      setSaving(false);
    }
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
      await loadData();
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-40";

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
        <h2 className="mb-4 font-heading text-sm font-bold text-[var(--text)]">
          Tambah Mahasiswa
        </h2>
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
        {error && <p className="mt-2 text-sm text-[var(--danger-text)]">{error}</p>}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}