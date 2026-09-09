"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

type SoalInfo = {
  id: string;
  judul: string;
  deskripsi: string | null;
  mataKuliah: string | null;
  pdfUrl: string | null;
  dosen: { nama: string } | null;
  kelas: { nama: string; angkatan: string } | null;
  indikator: { nama: string; bobot: number; rubrik: string; skorMax: number }[];
  deadline: string | null;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function SubmitSoalPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const [soal, setSoal] = useState<SoalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/submit/${token}/soal`);
        const data = await res.json();

        if (!res.ok) {
          setLoadError(data.error ?? "Gagal memuat soal.");
          return;
        }

        setSoal(data);
      } catch {
        setLoadError("Gagal terhubung ke server. Periksa koneksi dan coba lagi.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);

    if (!selected) return;

    const isPdf = selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Hanya file PDF yang dapat diunggah.");
      return;
    }
    if (selected.size === 0) {
      setFileError("File jawaban kosong.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError("Ukuran file maksimal 10MB.");
      return;
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    setFileError(null);

    if (!nama.trim() || !nim.trim() || !email.trim()) {
      setSubmitError("Nama, NIM, dan email wajib diisi.");
      return;
    }
    if (!file) {
      setFileError("Pilih file jawaban (PDF) terlebih dahulu.");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Hanya file PDF yang dapat diunggah.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("Ukuran file maksimal 10MB.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("nama", nama.trim());
      formData.append("nim", nim.trim());
      formData.append("email", email.trim());
      formData.append("file", file);

      const res = await fetch(`/api/submit/${token}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitError(data?.error ?? "Gagal mengumpulkan jawaban. Coba lagi.");
        return;
      }

      setSuccess(true);
    } catch {
      setSubmitError("Terjadi kendala jaringan. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PublicShell>
        <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
          <p className="text-sm">Memuat soal...</p>
        </div>
      </PublicShell>
    );
  }

  if (loadError) {
    return (
      <PublicShell>
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-[var(--danger-text)] mb-3" />
          <h2 className="font-heading text-lg font-bold text-[var(--danger-text)] mb-2">
            Link Tidak Dapat Digunakan
          </h2>
          <p className="text-sm text-[var(--text-muted)]">{loadError}</p>
        </div>
      </PublicShell>
    );
  }

  if (!soal) return null;

  if (success) {
    return (
      <PublicShell>
        <div className="rounded-2xl border border-[var(--success-border)] bg-[var(--bg-panel)] p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--success-soft)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--success-ink)]" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[var(--text)] mb-2">
            Jawaban Berhasil Dikumpulkan
          </h2>
          <p className="mx-auto max-w-md text-sm text-[var(--text-muted)] leading-relaxed">
            Terima kasih, <strong className="text-[var(--text)]">{nama.trim()}</strong>. Jawaban
            kamu untuk <strong className="text-[var(--text)]">{soal.judul}</strong> sudah kami
            terima dan sedang diperiksa. Hasil penilaian akan dikirim ke email{" "}
            <strong className="text-[var(--text)]">{email.trim()}</strong>.
          </p>
        </div>
      </PublicShell>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-40";

  return (
    <PublicShell>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] items-start">
        {/* Form */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 sm:p-7 shadow-xs min-w-0">
          <div className="mb-5 border-b border-[var(--border-soft)] pb-4">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[var(--text)] leading-snug">
              {soal.judul}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">
              {soal.kelas ? `${soal.kelas.nama} · Angkatan ${soal.kelas.angkatan}` : "Autograder"}{" "}
              — {soal.dosen?.nama ? `oleh ${soal.dosen.nama}` : ""}
            </p>
          </div>

          {soal.deskripsi && (
            <p className="mb-5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)]">
              {soal.deskripsi}
            </p>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                  Nama Lengkap
                </label>
                <input
                  className={inputClass}
                  placeholder="Nama sesuai data kelas"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                  NIM
                </label>
                <input
                  className={inputClass}
                  placeholder="Nomor Induk Mahasiswa"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                Email
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder="Email menerima hasil penilaian"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                File Jawaban (PDF)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div
                  className="flex items-center gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-3 cursor-pointer transition hover:bg-[var(--accent)]/60"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-panel)] text-[var(--accent-ink)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">{file.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-panel)] hover:text-[var(--danger-text)]"
                    aria-label="Hapus file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg)] p-6 text-center transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/50"
                >
                  <UploadCloud className="h-6 w-6 text-[var(--text-faint)]" />
                  <span className="text-sm font-semibold text-[var(--text)]">
                    Klik untuk memilih file
                  </span>
                  <span className="text-xs text-[var(--text-faint)]">
                    Format PDF, maksimal 10MB
                  </span>
                </button>
              )}
              {fileError && <p className="mt-1.5 text-xs text-[var(--danger-text)]">{fileError}</p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--accent-fg)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? "Mengirim jawaban..." : "Kumpulkan Jawaban"}
            </button>

            {submitError && (
              <p className="text-sm text-[var(--danger-text)]">{submitError}</p>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4 lg:sticky lg:top-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 shadow-xs">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-[var(--text)]">
              <GraduationCap className="h-4 w-4 text-[var(--accent)]" />
              Rubrik Penilaian
            </h2>
            <ul className="space-y-2">
              {soal.indikator.map((ind, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">{ind.nama}</p>
                    <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-ink)]">
                      {ind.bobot}%
                    </span>
                  </div>
                  {ind.rubrik && (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                      {ind.rubrik}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {soal.deadline && (
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4">
              <CalendarClock className="h-5 w-5 shrink-0 text-[var(--warning-ink)]" />
              <div>
                <p className="text-sm font-bold text-[var(--warning-ink)]">Batas Submit</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {new Date(soal.deadline).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 text-[var(--accent-ink)]">
            <Sparkles className="h-5 w-5" />
            <span className="font-heading text-sm font-bold">
              Autograder<span className="text-[var(--text-faint)]"> · Ujian Digital</span>
            </span>
          </div>
          <h2 className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <ShieldCheck className="h-4 w-4 text-[var(--success-ink)]" />
            Halaman submit jawaban resmi — data Anda dikirim langsung ke sistem penilaian.
          </h2>
        </header>
        {children}
      </div>
    </div>
  );
}