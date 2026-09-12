// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Cloud,
  Lock,
  Bot,
  ShieldCheck,
  Undo2,
  ArrowRight,
  Play,
  CheckCircle2,
Sun,
  Moon,
  Menu,
  X,
  LogIn,
  GraduationCap,
} from "lucide-react";
import { useTheme } from "./theme-provider";

const NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#alur-kerja", label: "Alur Kerja" },
  { href: "#arsitektur", label: "Integrasi" },
  { href: "#faq", label: "Dokumentasi" },
];

const WORKFLOW_STEPS = [
  {
    number: "01",
    label: "NO-LOGIN FLOW",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    title: "Submit Berbasis Token",
    desc: "Mahasiswa mengunggah file PDF / naskah via URL submission bertoken unik tanpa repot login akun baru.",
    footer: "Drive Upload Sync",
  },
  {
    number: "02",
    label: "PASS 1: EVALUATOR",
    color: "text-indigo-400",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    title: "Agent Penilai (Scorer)",
    desc: "Membaca rubrik spesifik dosen. Menghitung skor per indikator (argumen, sitasi, metodologi, kerapian struktur).",
    footer: "JSON Schema Validated",
  },
  {
    number: "03",
    label: "PASS 2: AUDITOR",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    title: "Agent Peninjau (Cross-check)",
    desc: "Menguji kesesuaian skor agent 1 terhadap teks asli. Mencegah halusinasi skor, menajamkan catatan feedback konstruktif.",
    footer: "Zero-Hallucination Shield",
  },
  {
    number: "04",
    label: "CALLBACK & VAULT",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    title: "Sinkronisasi & Notifikasi",
    desc: "Nilai & lembar anotasi otomatis tersimpan rapi ke Google Drive Dosen, serta email feedback terkirim ke mahasiswa.",
    footer: "Drive + Email Notifier",
  },
];

const FEATURES = [
  {
    icon: Zap,
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    title: "Multi-Provider Failover",
    desc: "Dukungan trio model AI tier-1: Gemini 3.6 Flash sebagai mesin utama, dengan failover cerdas ke DeepSeek & Groq Llama 3.3 jika terjadi bottleneck API.",
  },
  {
    icon: Cloud,
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    title: "Integrasi Google Drive Native",
    desc: "Hubungkan folder Google Drive dosen Anda; PDF mahasiswa dan lembar rekapitulasi nilai otomatis tersinkron tanpa database terpisah.",
  },
  {
    icon: Lock,
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    title: "Portal Mahasiswa Tanpa Login",
    desc: "Mahasiswa tak perlu mendaftar akun. Cukup link tugas bertoken yang aman, anti-plagiarisme, dan terlacak.",
  },
  {
    icon: Bot,
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    title: "AI Rubric & Soal Generator",
    desc: "Ketik Capaian Pembelajaran Lulusan (CPL), sistem merumuskan rubrik berstandar OBE (Outcome-Based Education) dalam hitungan detik.",
  },
  {
    icon: ShieldCheck,
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    title: "Auditability & Transparansi",
    desc: "Mahasiswa menerima lembar umpan balik berisi alasan rinci di balik setiap pengurangan poin, mengurangi komplain nilai.",
  },
  {
    icon: Undo2,
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    title: "Human-in-the-Loop Override",
    desc: "Dosen tetap memegang kendali mutlak: setujui, sunting catatan evaluasi, atau anulir nilai hanya dengan satu klik.",
  },
];

const FAQS = [
  {
    q: "Bagaimana sistem memastikan nilai tidak 'halusinasi' seperti AI biasa?",
    a: "SwaKoreksiIn menerapkan arsitektur 2-Pass Multi-Agent. Agent Penilai memberikan draft skor dan sitasi kalimat bukti dari teks mahasiswa. Agent Peninjau yang independen lalu memverifikasi apakah poin rubrik benar-benar bersumber dari teks mahasiswa atau rekayasa model. Jika ada inkonsistensi di atas 5%, lembar ditandai khusus untuk perhatian dosen.",
  },
  {
    q: "Apakah data tugas mahasiswa aman dan tidak dijadikan bahan latihan LLM publik?",
    a: "Ya, 100% aman. Kami menggunakan endpoint Enterprise API (Zero Data Retention) dari Gemini Enterprise dan OpenRouter. Dokumen mahasiswa hanya diproses secara in-memory untuk inferensi dan langsung disimpan di folder Google Drive privat instansi Anda.",
  },
  {
    q: "Apakah format rubrik harus baku atau bisa custom sesuai silabus program studi?",
    a: "Sangat fleksibel! Anda dapat mengunggah rubrik dalam bentuk teks biasa, poin-poin persentase CPL, matriks tabel, atau meminta Asisten AI mengubah silabus mata kuliah menjadi rubrik evaluasi otomatis.",
  },
];

// =============================================
// Robot visual — model 3D interaktif (parallax
// mengikuti gerakan mouse + animasi float)
// =============================================
function RobotVisual() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let targetRX = 0;
    let targetRY = 0;
    let targetTX = 0;
    let targetTY = 0;
    let curRX = 0;
    let curRY = 0;
    let curTX = 0;
    let curTY = 0;

    const heroZone = document.getElementById("hero-interactive-zone");

    function onMove(e: MouseEvent) {
      if (!heroZone) return;
      const rect = heroZone.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);

      const clampedX = Math.max(-1, Math.min(1, x));
      const clampedY = Math.max(-1, Math.min(1, y));

      targetRY = clampedX * 22;
      targetRX = -clampedY * 16;
      targetTX = clampedX * 20;
      targetTY = clampedY * 16;
    }

    function onLeave() {
      targetRX = 0;
      targetRY = 0;
      targetTX = 0;
      targetTY = 0;
    }

    function loop() {
      curRX += (targetRX - curRX) * 0.08;
      curRY += (targetRY - curRY) * 0.08;
      curTX += (targetTX - curTX) * 0.08;
      curTY += (targetTY - curTY) * 0.08;
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `perspective(1000px) translate3d(${curTX}px, ${curTY}px, 0px) rotateX(${curRX}deg) rotateY(${curRY}deg)`;
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      id="robot-container"
      className="relative w-full max-w-[460px] h-[480px] sm:h-[510px] flex items-center justify-center select-none"
      style={{ perspective: "1100px" }}
    >
      {/* The Robot Element: background eliminated via blend & radial mask,
          gentle float + interactive 3D parallax tilt */}
      <div
        ref={wrapperRef}
        id="robot-interactive-wrapper"
        className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="relative w-full h-full flex items-center justify-center animate-robot-float">
          <img
            alt="SwaKoreksiIn AI Professor Robot Mascot"
            className="robot-agent-cutout w-full h-full object-contain pointer-events-none max-h-[470px] sm:max-h-[500px] drop-shadow-sm"
            src="/images/icon.png"
          />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="antialiased min-h-screen selection:bg-blue-500 selection:text-white">
      {/* Full-page ambient gradient + grid overlay */}
      <div className="pointer-events-none fixed inset-0 bg-theme-gradient" />
      <div className="pointer-events-none fixed inset-0 bg-cyber-grid opacity-[0.4]" />

      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-panel-translucent)] border-b border-[var(--border)] transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <a
              aria-label="SwaKoreksiIn Homepage"
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-lg py-1 px-1.5 transition shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition duration-300">
                <div className="w-full h-full bg-[var(--bg-panel)] rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-400 group-hover:scale-105 transition-transform duration-300" />
                </div>
              </div>
              <span className="font-heading font-bold text-base tracking-tight text-[var(--text)]">
                SwaKoreksi<span className="text-blue-500">In</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]"
            >
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="nav-link hover:text-blue-400 transition-colors py-1">
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                aria-label="Ganti Tema (Dark / Light)"
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
<Link
                href="/auth/login"
                className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--accent-border)] text-xs font-semibold text-[var(--text)] hover:text-[var(--accent-ink)] hover:bg-[var(--accent-soft)] transition"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/25"
              >
                Daftar
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="md:hidden p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {menuOpen && (
            <nav
              aria-label="Mobile Navigation"
              className="md:hidden px-6 pb-5 pt-1 flex flex-col gap-1 border-t border-[var(--border)] bg-[var(--bg-panel-translucent)] backdrop-blur-md"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t border-[var(--border-soft)]">
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-md shadow-blue-500/25"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk Portal Dosen
                </Link>
              </div>
            </nav>
          )}
        </header>

        {/* ===== MAIN ===== */}
        <main>
          {/* ===== HERO ===== */}
          <section
            className="relative pt-10 pb-12 lg:pt-14 lg:pb-16 overflow-hidden border-b border-[var(--border-soft)]"
            id="hero-interactive-zone"
          >
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -top-24 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Copywriting */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-blue-400 text-xs font-medium tracking-wide mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    <span>✦ Multi-Agent AI Autograding for Higher Education</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight leading-tight mb-4 text-[var(--text)]">
                    KOREKSI JAWABAN <br className="hidden sm:inline" />
                    <span className="text-blue-500 drop-shadow-sm">MAHASISWA DENGAN</span> <br className="hidden sm:inline" />
                    KETELITIAN AGENTIK AI
                  </h1>

                  <p className="text-sm sm:text-base text-[var(--text-muted)] font-normal leading-relaxed mb-6 max-w-xl">
                    Otomasi penilaian ujian &amp; esai perguruan tinggi secara objektif. Melibatkan{" "}
                    <span className="text-[var(--text)] font-medium">Dual-Pass Verification</span> (Agent Penilai +
                    Agent Peninjau) serta failover multi-LLM (Gemini, DeepSeek, &amp; Groq) tersinkronisasi otomatis ke
                    Google Drive dosen.
                  </p>

                  {/* CTA Cluster */}
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-8">
                    <Link
                      href="/auth/register"
                      className="w-full sm:w-auto inline-flex justify-center items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 border border-blue-300/40 transition-all transform hover:-translate-y-0.5"
                    >
                      Mulai Sekarang
                    </Link>
                    <a
                      href="#arsitektur"
                      className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-[var(--text)] glass-panel hover:bg-[var(--accent-soft)] transition border border-[var(--border)]"
                    >
                      <Play className="w-4 h-4 text-blue-400" />
                      Jelajahi Alur 2-Pass
                    </a>
                  </div>

                  {/* Trust Metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-5 border-t border-[var(--border)] w-full max-w-lg">
                    <div>
                      <p className="text-xl lg:text-2xl font-heading font-bold text-[var(--text)]">99.4%</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Konsistensi Rubrik</p>
                    </div>
                    <div className="border-l border-[var(--border)] pl-4">
                      <p className="text-xl lg:text-2xl font-heading font-bold text-[var(--text)]">0.8 Detik</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Per Lembar Tugas</p>
                    </div>
                    <div className="border-l border-[var(--border)] pl-4">
                      <p className="text-xl lg:text-2xl font-heading font-bold text-[var(--text)]">3 Model</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Automated Failover</p>
                    </div>
                  </div>
                </div>

                {/* Right: Interactive 3D Robot */}
                <div className="lg:col-span-5 relative flex items-center justify-center">
                  <RobotVisual />
                </div>
              </div>
            </div>
          </section>

          {/* ===== ACADEMIC PARTNERS ===== */}
          <section className="py-8 border-b border-[var(--border)] bg-[var(--bg-panel)]/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-xs uppercase tracking-widest text-[var(--text-faint)] font-semibold mb-6">
                Dioptimalkan untuk kurikulum dan rubrik asesmen perguruan tinggi di Indonesia
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-70">
                {[
                  { uni: "UI", campus: "Depok & Salemba" },
                  { uni: "ITB", campus: "Ganesha" },
                  { uni: "UGM", campus: "Bulaksumur" },
                  { uni: "ITS", campus: "Sukolilo" },
                  { uni: "UNDIP", campus: "Tembalang" },
                ].map((p) => (
                  <div
                    key={p.uni}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-xs font-semibold text-[var(--text-muted)]"
                  >
                    <span className="text-blue-400 font-bold">🏛️ {p.uni}</span> {p.campus}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== WORKFLOW 2-PASS ===== */}
          <section className="py-14 lg:py-16 relative" id="alur-kerja">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Pipeline Validasi Kritis
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] mt-3 mb-3">
                  Alur Kerja 2-Pass Multi-Agent Autograding
                </h2>
                <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                  Sistem tidak mengandalkan satu kali prompt LLM. Pipeline agentik berpasangan menjamin validitas,
                  konsistensi rubrik, dan transparansi evaluasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                {WORKFLOW_STEPS.map((step) => (
                  <div
                    key={step.number}
                    className="glass-panel p-5 rounded-2xl relative border border-[var(--border)] flex flex-col justify-between hover:border-blue-500/40 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`w-9 h-9 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center font-heading font-bold ${step.color} text-xs`}
                        >
                          {step.number}
                        </span>
                        <span className={`text-[10px] font-mono ${step.color}`}>{step.label}</span>
                      </div>
                      <h3 className="text-base font-heading font-semibold text-[var(--text)] mb-2 group-hover:text-blue-400 transition">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-[var(--border-soft)] text-xs text-blue-400 font-medium flex items-center gap-1.5">
                      <span>{step.footer}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== LIVE TRACE DEMO ===== */}
          <section className="py-16 bg-[var(--bg-panel)]/40 border-y border-[var(--border)]" id="live-trace">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5">
                  <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
                    Real-Time Observability
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] mt-2 mb-3">
                    Transparansi Penuh Melalui &quot;Live Agent Trace&quot;
                  </h2>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-5">
                    Dosen dapat memantau proses inferensi langkah-demi-langkah. Dari tahap unduhan file, parsing
                    naskah, kalkulasi poin rubrik, hingga verifikasi silang agen peninjau.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded bg-blue-500/10 text-blue-400 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text)]">Auto Failover Fallback</h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          Jika Gemini mencapai rate-limit, pipeline beralih sekejap ke DeepSeek V3 atau Groq Llama 3.3.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded bg-blue-500/10 text-blue-400 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text)]">Audit Trail Bebas Manipulasi</h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          Setiap pertimbangan nilai dicatat dengan timestamp dan checksum rubrik.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Console-Style Terminal */}
                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-[var(--border-strong)] bg-[#070b14] p-5 shadow-xl font-mono text-xs text-slate-300">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        <span className="ml-2 text-slate-400 text-[11px]">
                          swakoreksi-agent-daemon :: session #SWK-9041
                        </span>
                      </div>
                      <span className="text-cyan-400 font-semibold text-[11px]">STATUS: RUNNING</span>
                    </div>
                    <div className="space-y-1.5 leading-relaxed">
                      <div className="text-slate-500">[10:42:01.012] INFO: Incoming webhook from student submission portal.</div>
                      <div className="text-slate-400">
                        [10:42:01.120] INGEST: Parsing PDF &quot;Tugas4_MetodePenelitian_1301210088.pdf&quot; (1.8 MB)... OK
                      </div>
                      <div className="text-blue-400">
                        [10:42:01.450] PASS 1: Invoking [Primary: Gemini 3.6 Flash] with Rubric Schema ID #RBR-METOPEL-02
                      </div>
                      <div className="text-blue-300 pl-4">↳ Scoring Criteria A (Rumusan Masalah): 25/25 [Sangat Tajam]</div>
                      <div className="text-blue-300 pl-4">↳ Scoring Criteria B (Kajian Literatur): 22/25 [Sitasi mutakhir 5 thn terakhir]</div>
                      <div className="text-blue-300 pl-4">↳ Scoring Criteria C (Metodologi): 23/25 [Desain kuantitatif jelas]</div>
                      <div className="text-blue-300 pl-4">↳ Scoring Criteria D (Etika &amp; Format): 24/25 [Struktur IMRAD presisi]</div>
                      <div className="text-purple-400">
                        [10:42:02.100] PASS 2: Agent Peninjau [DeepSeek V3 Verification Pass] evaluating fairness...
                      </div>
                      <div className="text-purple-300 pl-4">
                        ↳ Audit Result: Selisih poin = 0%. Feedback diverifikasi objektif tanpa bias linguistik.
                      </div>
                      <div className="text-emerald-400">
                        [10:42:02.650] DRIVE_SYNC: Exported report to &quot;G-Drive:/MataKuliah_Metopen/Kelas_A/Nilai_Final.xlsx&quot;
                      </div>
                      <div className="text-emerald-300">
                        [10:42:02.810] SUCCESS: Total Process Time: 1.798s | Final Score: 94.0/100 (A)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== CORE FEATURES ===== */}
          <section className="py-14 lg:py-16" id="fitur">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Fitur Kelas Enterprise
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] mt-3 mb-3">
                  Dibuat Khusus untuk Kebutuhan Dosen Modern
                </h2>
                <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                  Bukan sekadar pembaca teks otomatis, melainkan ekosistem penunjang tri dharma perguruan tinggi yang
                  menjamin keadilan penilaian.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="glass-panel p-6 rounded-2xl border border-[var(--border)] hover:border-blue-500/50 transition relative group"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${f.bg} ${f.text} flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300`}
                    >
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-heading font-semibold text-[var(--text)] mb-2">{f.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== DUAL PERSPECTIVE SHOWCASE ===== */}
          <section className="py-14 lg:py-16 bg-[var(--bg-panel)]/30 border-t border-[var(--border)]" id="arsitektur">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                <div>
                  <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
                    Dual Architectural View
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] mt-2">
                    Sinergi Dashboard Dosen &amp; Hasil Mahasiswa
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mt-3 md:mt-0 leading-relaxed">
                  Dua antarmuka yang tersinkronisasi langsung lewat backend agentik: kontrol penuh di tangan pendidik,
                  feedback mendalam bagi pembelajar.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dosen Workspace */}
                <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-[var(--border)] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        DR
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text)]">Portal Asesmen Dosen</h4>
                        <p className="text-xs text-[var(--text-muted)]">Kelas: Pemrograman Web Lanjut (TI-402)</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      48/48 Terkoreksi
                    </span>
                  </div>

                  <div className="space-y-2.5 font-sans text-xs">
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-soft)] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[var(--text)]">Aditya Pratama (1301204011)</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Tugas 3: Microservice Architecture REST API</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-emerald-400">92 / 100</span>
                        <div className="text-[10px] text-blue-400 font-semibold">Dual-Pass Verified ✓</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-soft)] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[var(--text)]">Siti Nurhaliza (1301204089)</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Tugas 3: Microservice Architecture REST API</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-emerald-400">88 / 100</span>
                        <div className="text-[10px] text-blue-400 font-semibold">Dual-Pass Verified ✓</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-soft)] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[var(--text)]">Budi Wicaksono (1301204122)</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Tugas 3: Microservice Architecture REST API</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-amber-400">76 / 100</span>
                        <div className="text-[10px] text-amber-400 font-semibold">Dosen Review Suggested</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-between items-center text-xs text-[var(--text-faint)]">
                    <span>Drive Location: /Drive/SemesterGenap2025/TI402/</span>
                    <button className="text-blue-400 font-semibold hover:underline">Ekspor ke Excel ↗</button>
                  </div>
                </div>

                {/* Student Feedback */}
                <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-[var(--border)] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        MHS
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text)]">Tampilan Umpan Balik Mahasiswa</h4>
                        <p className="text-xs text-[var(--text-muted)]">Laporan Analisis Hasil Koreksi Otomatis</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      Transparan &amp; Terukur
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-[var(--text)]">1. Kedalaman Analisis Teoretis</span>
                        <span className="text-blue-400 font-mono">28 / 30 Poin</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--border-soft)] leading-relaxed">
                        &quot;Kekuatan: Eksplorasi konsep CAP Theorem sangat mendalam. Kelemahan: Belum menyertakan
                        perbandingan latency benchmark pada throughput tinggi.&quot;
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-[var(--text)]">2. Implementasi &amp; Standard Koding</span>
                        <span className="text-emerald-400 font-mono">30 / 30 Poin</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--border-soft)] leading-relaxed">
                        &quot;Kekuatan: Repository Git rapi, isolasi Docker container optimal, menerapkan Twelve-Factor
                        App principles secara konsisten.&quot;
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                      <span className="text-blue-300 font-medium">Telah Diverifikasi Dua Agen AI</span>
                      <span className="text-[11px] text-blue-400 font-mono">Hash: a8f9c7e012</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== FAQ ===== */}
          <section className="py-14 lg:py-16" id="faq">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Tanya Jawab Dosen
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] mt-3 mb-2">
                  Pertanyaan yang Sering Diajukan
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  Ketahui bagaimana SwaKoreksiIn menjaga integritas akademik dan mempermudah beban koreksi ratusan
                  naskah esai.
                </p>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq) => (
                  <div key={faq.q} className="glass-panel rounded-2xl border border-[var(--border)] p-5 transition">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                      <span className="text-blue-500 font-bold">Q:</span> {faq.q}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed pl-5">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== CTA ===== */}
          <section className="py-14 lg:py-16 relative overflow-hidden" id="mulai">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-blue-900/60 via-indigo-950/80 to-slate-950 border border-blue-500/40 shadow-xl relative text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium mb-4 border border-blue-400/30">
                  🚀 Akses Dosen Perguruan Tinggi Indonesia
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white tracking-tight leading-tight mb-4">
                  Hemat Waktu Mengoreksi Hingga 85%. <br className="hidden sm:inline" />
                  Fokus Pada Bimbingan Mahasiswa.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
                  Bergabunglah dengan ratusan dosen progresif yang telah mengotomatisasi evaluasi tugas dan ujian esai
                  dengan akurasi teruji.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/auth/register"
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/30 border border-blue-400/30 transform hover:-translate-y-0.5"
                  >
                    Mulai Sekarang
                  </Link>
                  <a
                    href="#alur-kerja"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm text-[var(--text)] glass-panel hover:bg-[var(--accent-soft)] transition border border-[var(--border)]"
                  >
                    Jadwalkan Demo Kampus
                  </a>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Tanpa perlu instalasi server lokal. Cukup hubungkan dengan akun Google Drive Dosen.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-[var(--border)] bg-[var(--bg-panel)] py-10 text-sm text-[var(--text-muted)] transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-heading font-extrabold text-lg text-[var(--text)]">
                    SwaKoreksi<span className="text-blue-500">In</span>
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-400">ENTERPRISE</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Inisiatif AI akademik terdepan untuk modernisasi asesmen pendidikan tinggi Indonesia dengan
                  arsitektur 2-pass multi-agent.
                </p>
                <div className="text-xs text-[var(--text-faint)]">
                  © {new Date().getFullYear()} SwaKoreksiIn Platform. <br />
                  Hak cipta dilindungi undang-undang.
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text)] mb-4">
                  Fitur Produk
                </h4>
                <ul className="space-y-2 text-xs">
                  <li><a className="hover:text-blue-400 transition" href="#fitur">Dual-Pass Multi-Agent</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#fitur">Multi-LLM Failover Engine</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#fitur">Integrasi Google Drive &amp; Vault</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#fitur">Student No-Login Portal</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#fitur">Rubric AI Generator</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text)] mb-4">
                  Integrasi Akademik
                </h4>
                <ul className="space-y-2 text-xs">
                  <li><a className="hover:text-blue-400 transition" href="#">Konektor Moodle LMS</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#">Canvas &amp; Blackboard Support</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#">Standarisasi Akreditasi LAM-INFOKOM</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#">Panduan Outcome-Based Education</a></li>
                  <li><a className="hover:text-blue-400 transition" href="#">SLA &amp; Keamanan Dokumen Dosen</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text)] mb-4">
                  Bantuan &amp; Komunitas Dosen
                </h4>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Butuh integrasi khusus untuk fakultas atau universitas Anda? Tim teknis kami siap mendampingi.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="text-[var(--text)] font-semibold">Email: dukungan@swakoreksi.id</div>
                  <div className="text-[var(--text-faint)]">Gedung Riset AI &amp; EduTech Indonesia, Jakarta</div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[var(--border-soft)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-faint)] gap-4">
              <div className="flex items-center gap-6">
                <a className="hover:underline" href="#">Kebijakan Privasi</a>
                <a className="hover:underline" href="#">Syarat &amp; Ketentuan Layanan</a>
                <a className="hover:underline" href="#">Protokol Keamanan Data Kampus</a>
              </div>
              <div className="font-mono">
                System Status: <span className="text-emerald-400 font-semibold">● All Agents Operational (99.98%)</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}