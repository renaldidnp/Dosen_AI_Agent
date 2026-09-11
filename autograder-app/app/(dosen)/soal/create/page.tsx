"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Bot, FileText, Loader2, Paperclip, Plus, Send, Sparkles, Trash2, User, Wand2, X } from "lucide-react";
import { uid } from "@/lib/uid";

type IndikatorInput = { nama: string; bobot: number; rubrik: string; skorMax: number };
type ChatRole = "user" | "assistant";
type SoalDraft = { judul?: string; deskripsi?: string; indikator?: Partial<IndikatorInput>[] };
type ChatMessage = { id: string; role: ChatRole; content: string; draft?: SoalDraft };
type Kelas = { id: string; nama: string; angkatan: string };

const emptyIndikator = (): IndikatorInput => ({ nama: "", bobot: 0, rubrik: "", skorMax: 100 });

// Konversi byte → base64 ber-chunk. Spread satu kali (`...new Uint8Array`) bisa
// melempar "Maximum call stack size exceeded" untuk PDF > ~100KB.
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000; // 32 KB per iterasi, aman untuk file sampai puluhan MB
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default function CreateSoalPage() {
  const router = useRouter();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [indikator, setIndikator] = useState<IndikatorInput[]>([emptyIndikator()]);
  const [saving, setSaving] = useState(false);

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [kelasId, setKelasId] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");
  const [masaBerlakuJam, setMasaBerlakuJam] = useState(24);

  const [isDraftApplied, setIsDraftApplied] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Upload dulu file PDF materi kuliah di atas agar soal yang saya buat benar-benar mendalam dan tidak keluar dari materi tersebut. Kalau tanpa materi, saya tetap bisa menyusun soal berdasarkan topik yang Anda ceritakan - sebutkan topik, mata kuliah, dan tingkat kesulitannya.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [materiFile, setMateriFile] = useState<File | null>(null);
  const [materiFilename, setMateriFilename] = useState("");
  const [materiError, setMateriError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKelas() {
      setLoadingKelas(true);
      try {
        const res = await fetch("/api/kelas");
        if (res.ok) setKelasList(await res.json());
      } finally {
        setLoadingKelas(false);
      }
    }
    loadKelas();
  }, []);

  function addIndikator() {
    setIndikator([...indikator, emptyIndikator()]);
  }

  function removeIndikator(i: number) {
    setIndikator(indikator.filter((_, idx) => idx !== i));
  }

  function updateIndikator(i: number, field: keyof IndikatorInput, value: string | number) {
    const next = [...indikator];
    next[i] = { ...next[i], [field]: value };
    setIndikator(next);
  }

  const [submitError, setSubmitError] = useState<string | null>(null);

async function handleSubmit() {
  setSaving(true);
  setSubmitError(null);
  try {
    const res = await fetch("/api/soal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
        judul,
        deskripsi,
        kelasId: kelasId || null,
        mataKuliah: mataKuliah.trim() || null,
        masaBerlakuJam,
        indikator,
      }),
    });

    if (res.ok) {
      router.refresh();
      router.push("/dashboard");
      return;
    }

    const data = await res.json().catch(() => null);
    setSubmitError(data?.error ?? "Gagal menyimpan soal. Silakan coba lagi.");
  } catch {
    setSubmitError("Terjadi kendala jaringan. Periksa koneksi Anda.");
  } finally {
    setSaving(false);
  }
}

  async function handleSendChat() {
    const prompt = chatInput.trim();
    if (!prompt || isThinking) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsThinking(true);

    try {
      // Jika ada materi, baca file → base64 dulu (stateless: hanya hidup untuk request ini)
      let materiPayload: { filename: string; contentBase64: string } | null = null;

      if (materiFile) {
        const arrayBuf = await materiFile.arrayBuffer();
        const contentBase64 = toBase64(new Uint8Array(arrayBuf));
        materiPayload = { filename: materiFilename, contentBase64 };
      }

      const res = await fetch("/api/ai-agent/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: messages.map(({ role, content }) => ({ role, content })),
          materi: materiPayload,
        }),
      });

      const data = await res.json();
      const reply = data.reply ?? "Berikut draf soal yang saya susun berdasarkan permintaan Anda.";

      // Jika draft berhasil dibuat → auto-clear materi dari memori browser
      if (data.draft) {
        setMateriFile(null);
        setMateriFilename("");
      }

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: reply, draft: data.draft },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Maaf, terjadi kendala saat menghubungi AI agent. Coba lagi sebentar lagi.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSelectMateri(file: File) {
    setMateriError(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMateriError("Hanya file PDF yang didukung.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setMateriError("Ukuran file maksimal 15 MB.");
      return;
    }
    setMateriFile(file);
    setMateriFilename(file.name);
  }

  function removeMateri() {
    setMateriFile(null);
    setMateriFilename("");
    setMateriError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function applyDraft(draft: SoalDraft) {
    if (draft.judul) setJudul(draft.judul);
    if (draft.deskripsi) setDeskripsi(draft.deskripsi);
    if (draft.indikator?.length) {
      setIndikator(
        draft.indikator.map((d) => ({
          nama: d.nama ?? "",
          bobot: d.bobot ?? 0,
          rubrik: d.rubrik ?? "",
          skorMax: d.skorMax ?? 100,
        })),
      );
    }
    setIsDraftApplied(true);
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-40";

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      {submitError && (
  <div className="fixed right-4 top-4 z-50 w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300 sm:right-6 sm:top-6">
    <div className="flex items-start gap-3 rounded-xl border border-[var(--danger-border)] bg-[var(--bg-panel)] p-4 shadow-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--danger-soft)]">
        <svg
          className="h-4 w-4 text-[var(--danger-text)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm font-semibold text-[var(--text)]">Gagal menyimpan soal</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{submitError}</p>
      </div>
      <button
        onClick={() => setSubmitError(null)}
        className="shrink-0 rounded-lg p-1 text-[var(--text-faint)] transition hover:bg-[var(--border-soft)] hover:text-[var(--text)]"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
)}
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="relative mb-6 pr-14 sm:mb-8 sm:pr-0">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Buat Soal Baru
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Susun soal secara manual, atau minta AI Assistant menyusunkan draf lengkap
              dengan indikator penilaiannya.
            </p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Form column — di bawah pada mobile/tablet, kiri pada desktop */}
          <div className="order-2 lg:order-1 lg:col-span-3 xl:col-span-1 space-y-5 sm:space-y-6 min-w-0">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs p-4 sm:p-6 transition-colors duration-300">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-heading text-sm font-bold text-[var(--text)]">Detail Soal</h2>
                {isDraftApplied && (
                  <span className="inline-flex items-center rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--success-ink)] whitespace-nowrap">
                    Draf Posting Aktif
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                      Kelas
                    </label>
                    <select
                      className={inputClass}
                      value={kelasId}
                      onChange={(e) => setKelasId(e.target.value)}
                      disabled={loadingKelas}
                    >
                      <option value="" className="bg-[var(--bg-panel)]">
                        {loadingKelas ? "Memuat kelas..." : kelasList.length === 0 ? "Belum ada kelas" : "Pilih kelas"}
                      </option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id} className="bg-[var(--bg-panel)]">
                          {k.nama} — Angkatan {k.angkatan}
                        </option>
                      ))}
                    </select>
                    {!loadingKelas && kelasList.length === 0 && (
                      <p className="mt-1 text-xs text-[var(--text-faint)]">
                        Belum ada kelas terdaftar. Tambahkan dulu di halaman{" "}
                        <a href="/kelas" className="text-[var(--accent-ink)] hover:underline underline-offset-4">
                          Kelas
                        </a>
                        .
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                      Mata Kuliah
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Contoh: Algoritma dan Struktur Data"
                      value={mataKuliah}
                      onChange={(e) => setMataKuliah(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                    Judul soal
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Contoh: Analisis Kompleksitas Algoritma Sorting"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                    Masa berlaku link submit
                  </label>
                  <select
                    className={inputClass}
                    value={masaBerlakuJam}
                    onChange={(e) => setMasaBerlakuJam(Number(e.target.value))}
                  >
                    <option value={6} className="bg-[var(--bg-panel)]">6 jam</option>
                    <option value={24} className="bg-[var(--bg-panel)]">1 hari (24 jam)</option>
                    <option value={72} className="bg-[var(--bg-panel)]">3 hari</option>
                    <option value={168} className="bg-[var(--bg-panel)]">7 hari</option>
                  </select>
                  <p className="mt-1 text-xs text-[var(--text-faint)]">
                    Batas waktu mahasiswa mengumpulkan jawaban lewat link email.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--text-muted)]">
                    Deskripsi soal
                  </label>
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Jelaskan instruksi dan konteks soal untuk mahasiswa..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs p-4 sm:p-6 transition-colors duration-300">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-heading text-sm font-bold text-[var(--text)]">Indikator Penilaian</h2>
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-ink)] whitespace-nowrap">
                  {indikator.length} indikator
                </span>
              </div>

              <div className="space-y-3">
                {indikator.map((ind, i) => (
                  <div key={i} className="group relative rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                    {indikator.length > 1 && (
                      <button
                        onClick={() => removeIndikator(i)}
                        className="absolute right-3 top-3 text-[var(--text-faint)] transition hover:text-[var(--danger-text)]"
                        aria-label="Hapus indikator"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <input
                        className={inputClass}
                        placeholder="Nama indikator"
                        value={ind.nama}
                        onChange={(e) => updateIndikator(i, "nama", e.target.value)}
                      />
                      <div className="relative">
                        <input
                          type="number"
                          className={`${inputClass} pr-8`}
                          placeholder="Bobot"
                          value={ind.bobot}
                          onChange={(e) => updateIndikator(i, "bobot", Number(e.target.value))}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-faint)]">
                          %
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      className={`${inputClass} resize-none mt-3`}
                      placeholder="Deskripsi rubrik penilaian"
                      value={ind.rubrik}
                      onChange={(e) => updateIndikator(i, "rubrik", e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addIndikator}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--accent-ink)] transition hover:text-[var(--accent-hover)]"
              >
                <Plus className="h-4 w-4" />
                Tambah indikator
              </button>
            </section>
            <div className="flex flex-row justify-end gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-center text-xs font-bold text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text)] sm:flex-initial"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !judul}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-bold text-[var(--accent-fg)] shadow-xs transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-initial"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Soal
              </button>
            </div>
          </div>

          {/* AI chat column — di atas pada mobile/tablet, kanan pada desktop */}
          <div className="order-1 lg:order-2 lg:col-span-2 xl:col-span-1 min-w-0">
            <div className="flex h-[min(75vh,560px)] flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-xs lg:sticky lg:top-8 lg:h-[calc(100vh-7rem)] lg:max-h-[820px] transition-colors duration-300">
              <div className="flex items-center gap-2.5 border-b border-[var(--border-soft)] px-4 sm:px-5 py-3.5 sm:py-4 shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] shrink-0">
                  <Sparkles className="h-4 w-4 text-[var(--accent-ink)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-[var(--text)]">AI Assistant</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">Bantu susun soal &amp; indikator otomatis</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 sm:px-5 py-4 min-h-0">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-2.5 sm:gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user"
                        ? "bg-[var(--border-soft)]"
                        : "bg-[var(--accent-soft)]"
                        }`}
                    >
                      {m.role === "user" ? (
                        <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                      )}
                    </div>
                    <div className={`flex max-w-[85%] flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user"
                          ? "bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--text)]"
                          : "bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]"
                          }`}
                      >
                        {m.content}
                      </div>
                      {m.draft && (
                        <button
                          onClick={() => applyDraft(m.draft!)}
                          className="flex items-center gap-1.5 self-start rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--accent-ink)] transition hover:bg-[var(--accent)] hover:text-[var(--accent-fg)]"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          Gunakan draf ini di form
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                      <Bot className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent)]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border-soft)] p-3 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSelectMateri(file);
                  }}
                />

                {materiFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] px-2.5 py-1.5">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--success-ink)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-[var(--text)]">{materiFilename}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {(materiFile.size / 1024).toFixed(1)} KB — acuan soal (otomatis terhapus setelah draft dibuat)
                      </p>
                    </div>
                    <button
                      onClick={removeMateri}
                      className="shrink-0 rounded-md p-1 text-[var(--text-faint)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]"
                      aria-label="Hapus materi"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {materiError && (
                  <p className="mb-1.5 text-[11px] font-semibold text-[var(--danger-text)]">{materiError}</p>
                )}

                <div className="flex items-end gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1.5 transition-all focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      materiFile
                        ? "text-[var(--success-ink)] hover:bg-[var(--success-soft)]"
                        : "text-[var(--text-faint)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
                    }`}
                    title={materiFile ? `Materi terpasang: ${materiFilename} (klik untuk ganti)` : "Upload materi PDF sebagai acuan soal"}
                    aria-label="Upload materi PDF"
                  >
                    <Paperclip className="h-4 w-4" />
                    {materiFile && (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--success)] ring-2 ring-[var(--bg-panel)]" />
                    )}
                  </button>
                  <textarea
                    rows={1}
                    className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
                    placeholder={materiFile ? "Materi terpasang — minta soal dari materi ini..." : "Tulis topik soal yang diinginkan..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || isThinking}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--border-soft)] disabled:text-[var(--text-faint)]"
                    aria-label="Kirim"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-[var(--text-faint)]">
                  AI dapat membuat kesalahan. Periksa kembali sebelum menyimpan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}