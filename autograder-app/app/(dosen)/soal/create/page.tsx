"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Plus, Send, Sparkles, Trash2, User, Wand2 } from "lucide-react";

type IndikatorInput = { nama: string; bobot: number; rubrik: string; skorMax: number };
type ChatRole = "user" | "assistant";
type SoalDraft = { judul?: string; deskripsi?: string; indikator?: Partial<IndikatorInput>[] };
type ChatMessage = { id: string; role: ChatRole; content: string; draft?: SoalDraft };
type Kelas = { id: string; nama: string; angkatan: string };

const emptyIndikator = (): IndikatorInput => ({ nama: "", bobot: 0, rubrik: "", skorMax: 100 });

export default function CreateSoalPage() {
  const router = useRouter();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [indikator, setIndikator] = useState<IndikatorInput[]>([emptyIndikator()]);
  const [saving, setSaving] = useState(false);

  // Kelas & mata kuliah
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(true);
  const [kelasId, setKelasId] = useState("");
  const [mataKuliah, setMataKuliah] = useState("");

  // State khusus untuk tombol dan penanganan draf postingan
  const [isDraftApplied, setIsDraftApplied] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo! Ceritakan topik, mata kuliah, dan tingkat kesulitan soal yang Anda inginkan. Saya akan susun draf judul, deskripsi, dan indikator penilaiannya.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

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

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          deskripsi,
          googleFormUrl,
          dosenId: "clx1abc123realid",
          kelasId: kelasId || null,
          mataKuliah: mataKuliah.trim() || null,
          indikator,
        }),
      });
      if (res.ok) {
        router.refresh();
        router.push("/dashboard");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSendChat() {
    const prompt = chatInput.trim();
    if (!prompt || isThinking) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/ai-agent/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: messages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "Berikut draf soal yang saya susun berdasarkan permintaan Anda.",
        draft: data.draft,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Maaf, terjadi kendala saat menghubungi AI agent. Coba lagi sebentar lagi.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
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
    // Menandai bahwa draf postingan telah berhasil dimuat ke form
    setIsDraftApplied(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-indigo-600">Manajemen Soal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Buat Soal Baru</h1>
          <p className="mt-2 text-sm text-slate-500">Susun soal secara manual, atau minta AI Assistant menyusunkan draf lengkap dengan indikator penilaiannya.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Form column */}
          <div className="lg:col-span-3 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Detail Soal</h2>
                {isDraftApplied && <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Draf Posting Aktif</span>}
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Kelas</label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
                      value={kelasId}
                      onChange={(e) => setKelasId(e.target.value)}
                      disabled={loadingKelas}
                    >
                      <option value="">{loadingKelas ? "Memuat kelas..." : kelasList.length === 0 ? "Belum ada kelas" : "Pilih kelas (opsional)"}</option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} — Angkatan {k.angkatan}
                        </option>
                      ))}
                    </select>
                    {!loadingKelas && kelasList.length === 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        Belum ada kelas terdaftar. Tambahkan dulu di halaman{" "}
                        <a href="/kelas" className="text-indigo-600 hover:underline">
                          Kelas
                        </a>
                        .
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Mata Kuliah</label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Contoh: Algoritma dan Struktur Data"
                      value={mataKuliah}
                      onChange={(e) => setMataKuliah(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul soal</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Contoh: Analisis Kompleksitas Algoritma Sorting"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi soal</label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Jelaskan instruksi dan konteks soal untuk mahasiswa..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Link Google Form</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="https://forms.google.com/..."
                    value={googleFormUrl}
                    onChange={(e) => setGoogleFormUrl(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Indikator Penilaian</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{indikator.length} indikator</span>
              </div>

              <div className="space-y-3">
                {indikator.map((ind, i) => (
                  <div key={i} className="group relative rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    {indikator.length > 1 && (
                      <button onClick={() => removeIndikator(i)} className="absolute right-3 top-3 text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100" aria-label="Hapus indikator">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                      <input
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        placeholder="Nama indikator"
                        value={ind.nama}
                        onChange={(e) => updateIndikator(i, "nama", e.target.value)}
                      />
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                          placeholder="Bobot"
                          value={ind.bobot}
                          onChange={(e) => updateIndikator(i, "bobot", Number(e.target.value))}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      className="mt-3 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Deskripsi rubrik penilaian"
                      value={ind.rubrik}
                      onChange={(e) => updateIndikator(i, "rubrik", e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button onClick={addIndikator} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700">
                <Plus className="h-4 w-4" />
                Tambah indikator
              </button>
            </section>

            <div className="flex justify-end gap-3">
              <button onClick={() => router.push("/dashboard")} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !judul}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Soal
              </button>
            </div>
          </div>

          {/* AI chat column */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                  <p className="text-xs text-slate-400">Bantu susun soal & indikator otomatis</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-slate-200" : "bg-indigo-100"}`}>
                      {m.role === "user" ? <User className="h-3.5 w-3.5 text-slate-600" /> : <Bot className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <div className={`flex max-w-[85%] flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-tr-sm bg-indigo-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}>{m.content}</div>
                      {m.draft && (
                        <button
                          onClick={() => applyDraft(m.draft!)}
                          className="flex items-center gap-1.5 self-start rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Bot className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-slate-100 p-3">
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
                  <textarea
                    rows={1}
                    className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="Tulis topik soal yang diinginkan..."
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Kirim"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">AI dapat membuat kesalahan. Periksa kembali sebelum menyimpan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
