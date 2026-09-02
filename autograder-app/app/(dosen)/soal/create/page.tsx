"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Loader2, Plus, Send, Sparkles, Trash2, User, Wand2 } from "lucide-react";

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
      content:
        "Halo! Ceritakan topik, mata kuliah, dan tingkat kesulitan soal yang Anda inginkan. Saya akan susun draf judul, deskripsi, dan indikator penilaiannya.",
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

  const inputClass =
    "w-full rounded-[2px] border border-white/10 bg-[#0a0a0f] px-3.5 py-2.5 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] disabled:opacity-40";

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="relative mb-6 pr-14 sm:mb-8 sm:pr-0">
          <div>
            <div className="font-mono text-[11px] text-[#00f0ff] tracking-widest uppercase flex items-center gap-2 mb-2">
              <span
                className="w-1.5 h-1.5 bg-[#00f0ff] rounded-[2px]"
                style={{ boxShadow: "0 0 8px rgba(0,240,255,1)" }}
              />
              Manajemen Soal
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[32px]">
              Buat <span className="text-[#00f0ff]" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Soal Baru_</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
              Susun soal secara manual, atau minta AI Assistant menyusunkan draf lengkap dengan indikator penilaiannya.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-[2px] border border-white/10 bg-white/5 p-2 font-mono text-xs uppercase tracking-wider text-[#8b949e] transition-all hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/10 hover:text-[#00f0ff] sm:px-4 sm:py-2.5"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
          {/* Form column */}
          <div className="lg:col-span-3 xl:col-span-1 space-y-5 sm:space-y-6 min-w-0">
            <section className="relative rounded-[4px] border border-[#00f0ff]/15 bg-[#111118]/80 backdrop-blur-xl p-6">
              <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
              <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-sm text-[#00f0ff] uppercase tracking-widest">Detail Soal</h2>
                {isDraftApplied && (
                  <span className="inline-flex items-center rounded-[2px] border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-[#00f0ff]">
                    Draf Posting Aktif
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Kelas</label>
                    <select
                      className={inputClass}
                      value={kelasId}
                      onChange={(e) => setKelasId(e.target.value)}
                      disabled={loadingKelas}
                    >
                      <option value="" className="bg-[#111118]">
                        {loadingKelas ? "Memuat kelas..." : kelasList.length === 0 ? "Belum ada kelas" : "Pilih kelas (opsional)"}
                      </option>
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id} className="bg-[#111118]">
                          {k.nama} — Angkatan {k.angkatan}
                        </option>
                      ))}
                    </select>
                    {!loadingKelas && kelasList.length === 0 && (
                      <p className="mt-1 text-xs text-[#6b7280]">
                        Belum ada kelas terdaftar. Tambahkan dulu di halaman{" "}
                        <a href="/kelas" className="text-[#00f0ff] hover:underline underline-offset-4">
                          Kelas
                        </a>
                        .
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Mata Kuliah</label>
                    <input
                      className={inputClass}
                      placeholder="Contoh: Algoritma dan Struktur Data"
                      value={mataKuliah}
                      onChange={(e) => setMataKuliah(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Judul soal</label>
                  <input
                    className={inputClass}
                    placeholder="Contoh: Analisis Kompleksitas Algoritma Sorting"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Deskripsi soal</label>
                  <textarea
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Jelaskan instruksi dan konteks soal untuk mahasiswa..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Link Google Form</label>
                  <input
                    className={inputClass}
                    placeholder="https://forms.google.com/..."
                    value={googleFormUrl}
                    onChange={(e) => setGoogleFormUrl(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="relative rounded-[4px] border border-[#00f0ff]/15 bg-[#111118]/80 backdrop-blur-xl p-6">
              <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
              <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-sm text-[#00f0ff] uppercase tracking-widest">Indikator Penilaian</h2>
                <span className="rounded-[2px] border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-[#8b949e]">
                  {indikator.length} indikator
                </span>
              </div>

              <div className="space-y-3">
                {indikator.map((ind, i) => (
                  <div key={i} className="group relative rounded-[4px] border border-white/10 bg-[#0a0a0f]/60 p-4">
                    {indikator.length > 1 && (
                      <button
                        onClick={() => removeIndikator(i)}
                        className="absolute right-3 top-3 text-[#6b7280] opacity-0 transition hover:text-[#ff8fa8] group-hover:opacity-100"
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
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#6b7280]">%</span>
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
                className="mt-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#00f0ff] transition hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Tambah indikator
              </button>
            </section>

            <div className="flex flex-row justify-end gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-[2px] border border-white/15 px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-[#8b949e] transition hover:border-white/30 hover:bg-white/5 hover:text-white sm:flex-initial"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !judul}
                className="flex flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#00f0ff] bg-[#00f0ff]/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-initial"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Soal
              </button>
            </div>
          </div>

          {/* AI chat column */}
          <div className="lg:col-span-2 xl:col-span-1 min-w-0">
            <div className="flex h-[560px] flex-col rounded-[4px] border border-[#00f0ff]/15 bg-[#111118]/80 backdrop-blur-xl relative lg:sticky lg:top-8 lg:h-[calc(100vh-7rem)] lg:max-h-[820px]">
              <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
              <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

              <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-[#00f0ff]/40 bg-[#00f0ff]/10"
                  style={{ boxShadow: "0 0 10px rgba(0,240,255,0.2)" }}
                >
                  <Sparkles className="h-4 w-4 text-[#00f0ff]" />
                </div>
                <div>
                  <p className="font-mono text-sm text-white uppercase tracking-wide">AI Assistant</p>
                  <p className="text-xs text-[#8b949e]">Bantu susun soal & indikator otomatis</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border ${
                        m.role === "user" ? "border-white/15 bg-white/5" : "border-[#00f0ff]/30 bg-[#00f0ff]/10"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User className="h-3.5 w-3.5 text-[#8b949e]" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-[#00f0ff]" />
                      )}
                    </div>
                    <div className={`flex max-w-[85%] flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-[4px] px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-white"
                            : "bg-white/5 border border-white/10 text-[#c9d1d9]"
                        }`}
                      >
                        {m.content}
                      </div>
                      {m.draft && (
                        <button
                          onClick={() => applyDraft(m.draft!)}
                          className="flex items-center gap-1.5 self-start rounded-[2px] border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-[#00f0ff] transition hover:bg-[#00f0ff]/20"
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-[#00f0ff]/30 bg-[#00f0ff]/10">
                      <Bot className="h-3.5 w-3.5 text-[#00f0ff]" />
                    </div>
                    <div className="flex items-center gap-1 rounded-[4px] border border-white/10 bg-white/5 px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00f0ff]/60 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00f0ff]/60 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00f0ff]/60" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-white/10 p-3">
                <div className="flex items-end gap-2 rounded-[4px] border border-white/10 bg-[#0a0a0f] p-2 focus-within:border-[#00f0ff] focus-within:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] transition-all">
                  <textarea
                    rows={1}
                    className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-[#4b5563] outline-none"
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] transition hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:border-white/10 disabled:text-[#6b7280]"
                    aria-label="Kirim"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-[#6b7280]">AI dapat membuat kesalahan. Periksa kembali sebelum menyimpan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}