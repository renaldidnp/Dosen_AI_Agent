"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, User } from "lucide-react";

type Mahasiswa = { id: string; nama: string; nim: string; email: string };
type Kelas = { id: string; nama: string; angkatan: string };

export default function DetailKelasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [kelasRes, mahasiswaRes] = await Promise.all([fetch(`/api/kelas/${id}`), fetch(`/api/mahasiswa?kelasId=${id}`)]);
      if (kelasRes.ok) setKelas(await kelasRes.json());
      if (mahasiswaRes.ok) setMahasiswaList(await mahasiswaRes.json());
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={() => router.push("/kelas")} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar kelas
        </button>

        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">Manajemen Mahasiswa</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{kelas ? `${kelas.nama} — Angkatan ${kelas.angkatan}` : "Memuat..."}</h1>
          <p className="mt-2 text-sm text-slate-500">Daftar mahasiswa di kelas ini akan otomatis menerima email notifikasi setiap kali dosen membuat soal baru.</p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Tambah Mahasiswa</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_1fr_auto]">
            <input
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="Nama mahasiswa"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="NIM"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <h2 className="text-base font-semibold text-slate-900">Daftar Mahasiswa</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{mahasiswaList.length} mahasiswa</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : mahasiswaList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada mahasiswa. Tambahkan di atas — kalau kosong, notifikasi soal baru tidak akan terkirim.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {mahasiswaList.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.nama}</p>
                      <p className="text-xs text-slate-400">
                        {m.nim} · {m.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Hapus mahasiswa"
                  >
                    {deletingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
