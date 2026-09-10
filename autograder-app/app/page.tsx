// app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import {
  GraduationCap,
  ArrowRight,
  FileCheck2,
  Users2,
  ListChecks,
  FolderSync,
  ShieldCheck,
  Link2,
  Activity,
  Quote,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "./theme-provider";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const NAV_LINKS = [
  { href: "#alur", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#dashboard", label: "Dashboard" },
];

const STEPS = [
  {
    icon: Users2,
    title: "Buat kelas & mahasiswa",
    desc: "Kelompokkan mahasiswa per kelas dan angkatan.",
  },
  {
    icon: ListChecks,
    title: "Susun soal & rubrik",
    desc: "Atur indikator penilaian beserta bobot dan skor maksimalnya.",
  },
  {
    icon: Link2,
    title: "Kirim link submit",
    desc: "Setiap soal punya link bertoken dengan batas waktu, dikirim otomatis ke email mahasiswa.",
  },
  {
    icon: FolderSync,
    title: "Mahasiswa submit",
    desc: "Jawaban diunggah tanpa login, tersimpan otomatis ke Google Drive.",
  },
  {
    icon: ShieldCheck,
    title: "Dua agent AI mengoreksi",
    desc: "Agent Penilai menskor tiap indikator, Agent Peninjau memverifikasi ulang sebelum hasil terkirim.",
  },
];

const FEATURES = [
  {
    icon: ListChecks,
    title: "Rubrik custom per soal",
    desc: "Setiap indikator punya bobot dan skor maksimal sendiri, sesuai standar penilaian Anda.",
  },
  {
    icon: ShieldCheck,
    title: "Verifikasi ganda oleh AI",
    desc: "Agent Peninjau mengecek ulang hasil Agent Penilai per indikator sebelum skor final dikirim.",
  },
  {
    icon: Link2,
    title: "Link submit tanpa login",
    desc: "Mahasiswa cukup buka link bertoken dan unggah jawaban — bisa dibatasi masa berlakunya.",
  },
  {
    icon: FileCheck2,
    title: "Skor per indikator",
    desc: "Mahasiswa tahu persis di bagian mana nilainya kurang, lengkap dengan catatan.",
  },
  {
    icon: FolderSync,
    title: "Terhubung Google Drive",
    desc: "PDF soal dan jawaban mahasiswa tersimpan rapi di Drive Anda, tanpa platform tambahan.",
  },
  {
    icon: Activity,
    title: "Live trace tiap submission",
    desc: "Pantau proses unduh, dua tahap penilaian, hingga pengiriman email langsung dari dashboard.",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main
      className={`${display.variable} ${mono.variable} min-h-screen w-full bg-[var(--bg)] text-[var(--text)] font-sans antialiased overflow-x-hidden transition-colors duration-300`}
    >
      {/* navbar */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border-soft)]">
        <div className="px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="text-base sm:text-lg tracking-tight truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Swa<span className="text-[var(--accent-ink)]">KoreksiIn</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[var(--text-muted)] shrink-0">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[var(--text)] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              title={theme === "dark" ? "Mode terang" : "Mode gelap"}
              className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              className="md:hidden h-10 w-10 shrink-0 rounded-full flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden px-4 sm:px-6 pb-5 pt-1 flex flex-col gap-4 text-[14px] text-[var(--text-muted)] border-t border-[var(--border-soft)]">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="hover:text-[var(--text)] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="sm:hidden rounded-full bg-[var(--accent)] text-[var(--accent-fg)] px-5 py-2.5 text-[13px] font-medium flex items-center justify-center gap-2"
            >
              Login Dosen
            </Link>
          </nav>
        )}
      </header>

      {/* hero */}
      <section className="px-4 sm:px-6 md:px-10 pt-14 sm:pt-20 lg:pt-24 pb-14 sm:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-[1.85rem] xs:text-[2.1rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.15] text-[var(--text)] mx-auto max-w-2xl break-words"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Koreksi ratusan tugas tanpa begadang semalaman.
          </h1>

          <p className="mt-5 sm:mt-6 max-w-lg mx-auto text-[14.5px] sm:text-[16px] leading-relaxed text-[var(--text-muted)]">
            SwaKoreksiIn mengoreksi jawaban mahasiswa otomatis berdasarkan rubrik yang
            Anda susun sendiri. Setiap jawaban dinilai oleh Agent Penilai, lalu
            diverifikasi ulang oleh Agent Peninjau sebelum hasilnya terkirim.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-full bg-[var(--accent)] text-[var(--accent-fg)] px-6 py-3.5 text-[14px] font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              Mulai koreksi otomatis
            </Link>
            <a
              href="#alur"
              className="rounded-full px-6 py-3.5 text-[14px] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors text-center"
            >
              Lihat cara kerja
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-[var(--text-faint)]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
            Diverifikasi 2 agent AI sebelum skor terkirim
          </div>

          <div className="mt-10 sm:mt-12 flex items-center justify-center gap-5 xs:gap-6 sm:gap-10 flex-wrap">
            <div>
              <div className="text-xl sm:text-2xl md:text-[1.75rem] text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>1,204</div>
              <div className="text-[12px] text-[var(--text-faint)] mt-0.5">submission dikoreksi</div>
            </div>
            <div className="h-9 w-px bg-[var(--border-soft)] shrink-0" />
            <div>
              <div className="text-xl sm:text-2xl md:text-[1.75rem] text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>42</div>
              <div className="text-[12px] text-[var(--text-faint)] mt-0.5">soal aktif</div>
            </div>
            <div className="h-9 w-px bg-[var(--border-soft)] shrink-0" />
            <div>
              <div className="text-xl sm:text-2xl md:text-[1.75rem] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>-90%</div>
              <div className="text-[12px] text-[var(--text-faint)] mt-0.5">waktu koreksi</div>
            </div>
          </div>
        </div>
      </section>

      {/* dashboard preview */}
      <section id="dashboard" className="px-4 sm:px-6 md:px-10 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-panel)] shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border-soft)] overflow-x-auto">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dot)] shrink-0" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dot)] shrink-0" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dot)] shrink-0" />
            <span className="ml-3 text-[12px] text-[var(--text-faint)] whitespace-nowrap font-mono">
              swakoreksiin.id/dashboard
            </span>
          </div>

          <div className="p-4 sm:p-6 md:p-9">
            <div className="flex items-center justify-between mb-6 gap-3">
              <h2
                className="text-lg sm:text-xl md:text-2xl text-[var(--text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Dashboard Dosen
              </h2>
              <span className="hidden sm:block text-[11.5px] text-[var(--text-faint)] rounded-full border border-[var(--border)] px-3 py-1.5 shrink-0">
                Pratinjau
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-[var(--accent-border)] p-4">
                <div className="text-[12px] text-[var(--text-faint)] mb-2">Total soal</div>
                <div className="text-xl sm:text-2xl md:text-3xl text-[var(--text)]">42</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-[12px] text-[var(--text-faint)] mb-2">Total submission</div>
                <div className="text-xl sm:text-2xl md:text-3xl text-[var(--text)]">1,204</div>
                <div className="text-[11.5px] text-[var(--accent-ink)] mt-2">+12% dari periode lalu</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="text-[12px] text-[var(--text-faint)] mb-2">Rata-rata waktu koreksi</div>
                <div className="text-xl sm:text-2xl md:text-3xl text-[var(--text)]">4.2 detik</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Ujian Tengah Semester", sub: "Algoritma & Pemrograman", progress: 90 },
                { title: "Tugas Harian", sub: "UI/UX Design Principles", progress: 91 },
              ].map((m) => (
                <div key={m.title} className="rounded-xl border border-[var(--border)] p-4 min-w-0">
                  <div className="flex items-center gap-2 text-[11.5px] text-[var(--accent-ink)] mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                    Aktif
                  </div>
                  <div className="text-[var(--text)] text-[15px] truncate">{m.title}</div>
                  <div className="text-[12px] text-[var(--text-faint)] mt-1 mb-4 truncate">{m.sub}</div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--border-soft)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--accent)]"
                      style={{ width: m.progress + "%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* alur kerja */}
      <section id="alur" className="px-4 sm:px-6 md:px-10 py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mb-10 sm:mb-12">
            <h2
              className="text-xl sm:text-2xl md:text-3xl text-[var(--text)] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Lima langkah, satu kali setup.
            </h2>
            <p className="text-[var(--text-muted)] text-[14px] sm:text-[15px]">
              Setelah rubrik dan kelas dibuat, sisanya berjalan otomatis setiap
              ada submission baru — tanpa mahasiswa perlu login.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-[var(--border-soft)] p-5 sm:p-6 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
                    <step.icon className="h-[18px] w-[18px] text-[var(--accent-ink)]" />
                  </div>
                  <span className="text-[12px] text-[var(--text-faint)] font-mono">0{i + 1}</span>
                </div>
                <div className="text-[var(--text)] text-[14.5px] mb-2">{step.title}</div>
                <div className="text-[13px] text-[var(--text-faint)] leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* fitur */}
      <section id="fitur" className="px-4 sm:px-6 md:px-10 py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-xl sm:text-2xl md:text-3xl text-[var(--text)] mb-10 sm:mb-12 max-w-md"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Yang Anda dapat.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--border-soft)] p-5 sm:p-6 hover:border-[var(--border-strong)] hover:shadow-sm transition-all"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mb-4">
                  <f.icon className="h-[18px] w-[18px] text-[var(--accent-ink)]" />
                </div>
                <div className="text-[var(--text)] text-[14.5px] mb-2">{f.title}</div>
                <div className="text-[13px] text-[var(--text-faint)] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* quote / testimonial-style section */}
      <section className="px-4 sm:px-6 md:px-10 py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--accent-ink)] mx-auto mb-5" />
          <p
            className="text-base sm:text-xl md:text-2xl text-[var(--text)] leading-snug break-words"
            style={{ fontFamily: "var(--font-display)" }}
          >
            "Waktu koreksi turun drastis, dan mahasiswa justru dapat feedback
            yang lebih rinci dibanding saat saya koreksi manual."
          </p>
          <p className="mt-5 text-[13.5px] text-[var(--text-faint)]">
            Simulasi pengalaman dosen pengguna SwaKoreksiIn
          </p>
        </div>
      </section>

      {/* cta footer */}
      <section className="px-4 sm:px-6 md:px-10 py-16 sm:py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto text-center rounded-[28px] bg-[var(--accent-soft)] px-5 sm:px-12 py-10 sm:py-16">
          <h2
            className="text-lg sm:text-2xl md:text-3xl text-[var(--text)] mb-4 break-words"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Semester ini, biarkan SwaKoreksiIn yang mengoreksi.
          </h2>
          <p className="text-[var(--text-muted)] text-[14px] sm:text-[15px] mb-8">
            Masuk dengan akun dosen Anda dan mulai buat soal pertama.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] px-6 sm:px-7 py-3.5 text-[14px] font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Login Dosen
          </Link>
        </div>
      </section>

      <footer className="px-4 sm:px-6 md:px-10 py-6 border-t border-[var(--border-soft)] text-[12px] text-[var(--text-faint)] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <span>© {new Date().getFullYear()} SwaKoreksiIn — autograding untuk dosen Indonesia.</span>
        <span>Dibangun dengan Gemini, OpenRouter & Groq.</span>
      </footer>
    </main>
  );
}