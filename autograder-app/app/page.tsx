// app/page.tsx
"use client";

import Link from "next/link";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import {
  Database,
  Activity,
  Terminal,
  ArrowRight,
  FileCheck2,
  Users2,
  ListChecks,
  Sparkles,
  Mail,
  FolderSync,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./theme-provider";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main
      className={`${mono.variable} ${display.variable} min-h-screen bg-[var(--bg)] text-[var(--text)] font-mono relative overflow-x-hidden transition-colors duration-300`}
    >
      {/* subtle grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: theme === "dark" ? 0.06 : 0.05,
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* status ticker */}
      <div className="relative z-10 border-b border-[var(--border-soft)] px-6 py-2 text-[11px] tracking-wide text-[var(--text-faint)] flex items-center gap-6 overflow-x-auto">
        <span className="flex items-center gap-2 text-[var(--accent-ink)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          SYS.STATUS: ONLINE
        </span>
        <span>MODEL: GEMINI-KOREKSI-01</span>
        <span>UPTIME: 99.98%</span>
        <span className="hidden sm:inline">LATENCY: 340ms/koreksi</span>
      </div>

      {/* navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-ink)]">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <span
            className="text-lg tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NEXUS<span className="text-[var(--accent-ink)]">.grade</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[13px] text-[var(--text-muted)]">
          <a href="#alur" className="hover:text-[var(--text)] transition-colors">
            Cara Kerja
          </a>
          <a href="#fitur" className="hover:text-[var(--text)] transition-colors">
            Fitur
          </a>
          <a href="#dashboard" className="hover:text-[var(--text)] transition-colors">
            Dashboard
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            className="h-[38px] w-[38px] flex items-center justify-center border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/auth/login"
            className="border border-[var(--accent-border)] text-[var(--accent-ink)] px-4 py-2 text-[13px] hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-2"
          >
            LOGIN DOSEN
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 px-6 md:px-10 pt-16 pb-20 max-w-5xl">
        <div className="inline-flex items-center gap-2 border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--text-faint)] mb-6">
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          UNTUK DOSEN &amp; TIM PENGAJAR
        </div>

        <h1
          className="text-[2.4rem] md:text-[3.4rem] leading-[1.08] text-[var(--text)] max-w-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Koreksi ratusan tugas tanpa begadang semalaman.
        </h1>

        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--text-muted)]">
          SwaKoreksiIn mengoreksi jawaban mahasiswa otomatis berdasarkan rubrik yang
          Anda tentukan sendiri &mdash; lengkap dengan skor per indikator dan
          feedback yang langsung terkirim ke email mahasiswa.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/auth/login"
            className="bg-[var(--accent)] text-[var(--accent-fg)] px-6 py-3 text-[13px] font-semibold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2"
          >
            MULAI KOREKSI OTOMATIS
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#alur"
            className="px-6 py-3 text-[13px] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
          >
            LIHAT CARA KERJA
          </a>
        </div>

        <div className="mt-14 grid grid-cols-3 max-w-md border-t border-[var(--border-soft)] pt-6">
          <div>
            <div className="text-2xl text-[var(--text)]">1,204</div>
            <div className="text-[11px] text-[var(--text-faint)] mt-1">
              submission dikoreksi
            </div>
          </div>
          <div>
            <div className="text-2xl text-[var(--text)]">42</div>
            <div className="text-[11px] text-[var(--text-faint)] mt-1">soal aktif</div>
          </div>
          <div>
            <div className="text-2xl text-[var(--accent-ink)]">-90%</div>
            <div className="text-[11px] text-[var(--text-faint)] mt-1">
              waktu koreksi
            </div>
          </div>
        </div>
      </section>

      {/* dashboard preview */}
      <section id="dashboard" className="relative z-10 px-6 md:px-10 pb-24">
        <div className="max-w-6xl mx-auto border border-[var(--border)] bg-[var(--bg-panel)] shadow-[var(--glow-shadow)]">
          {/* fake window bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-soft)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dot)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dot)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dot)]" />
            <span className="ml-3 text-[11px] text-[var(--text-faint)]">
              nexus.grade / dashboard-dosen
            </span>
          </div>

          <div className="p-5 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] text-[var(--accent-ink)] flex items-center gap-2 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  NEXUS COMMAND CENTER
                </div>
                <h2
                  className="text-2xl md:text-3xl text-[var(--text)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Dashboard Dosen
                </h2>
              </div>
              <span className="hidden sm:block text-[11px] text-[var(--text-faint)] border border-[var(--border)] px-3 py-1.5">
                PRATINJAU
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="border border-[var(--accent-border)] p-4">
                <div className="text-[11px] text-[var(--text-faint)] mb-2">
                  TOTAL SOAL // DB_COUNT
                </div>
                <div className="text-3xl text-[var(--text)] flex items-center gap-2">
                  <Database className="h-5 w-5 text-[var(--accent-ink)]" />
                  42
                </div>
              </div>
              <div className="border border-[var(--border)] p-4">
                <div className="text-[11px] text-[var(--text-faint)] mb-2">
                  TOTAL SUBMISSIONS
                </div>
                <div className="text-3xl text-[var(--text)] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[var(--accent-ink)]" />
                  1,204
                </div>
                <div className="text-[11px] text-[var(--accent-ink)] mt-2">
                  +12% dari periode lalu
                </div>
              </div>
              <div className="border border-[var(--border)] p-4">
                <div className="text-[11px] text-[var(--text-faint)] mb-2">
                  RATA-RATA WAKTU KOREKSI
                </div>
                <div className="text-3xl text-[var(--text)]">4.2 detik</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  status: "ACTIVE",
                  title: "Ujian Tengah Semester",
                  sub: "Algoritma & Pemrograman",
                  progress: 90,
                },
                {
                  status: "AKTIF",
                  title: "Tugas Harian",
                  sub: "UI/UX Design Principles",
                  progress: 91,
                },
              ].map((m) => (
                <div key={m.title} className="border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--accent-ink)] mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    {m.status}
                  </div>
                  <div className="text-[var(--text)] text-[15px]">{m.title}</div>
                  <div className="text-[12px] text-[var(--text-faint)] mt-1 mb-4">
                    {m.sub}
                  </div>
                  <div className="h-1 w-full bg-[var(--border-soft)]">
                    <div
                      className="h-1 bg-[var(--accent)]"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* alur kerja */}
      <section id="alur" className="relative z-10 px-6 md:px-10 py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl text-[var(--text)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Empat langkah, satu kali setup.
          </h2>
          <p className="text-[var(--text-muted)] text-[14px] max-w-lg mb-12">
            Setelah rubrik dan kelas dibuat, sisanya berjalan otomatis setiap
            ada submission baru.
          </p>

          <div className="grid md:grid-cols-4 gap-px bg-[var(--border-soft)]">
            {[
              {
                icon: Users2,
                title: "Buat kelas & mahasiswa",
                desc: "Kelompokkan mahasiswa per kelas dan angkatan.",
              },
              {
                icon: ListChecks,
                title: "Tentukan soal & rubrik",
                desc: "Atur indikator penilaian beserta bobot dan skor maksimalnya.",
              },
              {
                icon: FolderSync,
                title: "Mahasiswa submit",
                desc: "Jawaban masuk via link submit di email, tersimpan otomatis ke Drive.",
              },
              {
                icon: Mail,
                title: "SwaKoreksiIn koreksi & kirim hasil",
                desc: "Skor per indikator dan feedback terkirim ke email mahasiswa.",
              },
            ].map((step, i) => (
              <div key={step.title} className="bg-[var(--bg)] p-6">
                <div className="text-[11px] text-[var(--text-faint)] mb-4">
                  0{i + 1}
                </div>
                <step.icon className="h-5 w-5 text-[var(--accent-ink)] mb-4" />
                <div className="text-[var(--text)] text-[14px] mb-2">
                  {step.title}
                </div>
                <div className="text-[12.5px] text-[var(--text-faint)] leading-relaxed">
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* fitur */}
      <section id="fitur" className="relative z-10 px-6 md:px-10 py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl text-[var(--text)] mb-12"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Yang Anda dapat.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ListChecks,
                title: "Rubrik custom per soal",
                desc: "Setiap indikator punya bobot dan skor maksimal sendiri, sesuai standar penilaian Anda.",
              },
              {
                icon: FileCheck2,
                title: "Skor per indikator, bukan sekadar angka akhir",
                desc: "Mahasiswa tahu persis di bagian mana nilainya kurang, lengkap dengan catatan.",
              },
              {
                icon: Sparkles,
                title: "Feedback otomatis, bukan generik",
                desc: "Setiap feedback ditulis berdasarkan jawaban aktual mahasiswa terhadap rubrik.",
              },
              {
                icon: FolderSync,
                title: "Terhubung Google Drive",
                desc: "PDF soal dan jawaban mahasiswa tersimpan rapi di Drive Anda — tanpa platform submission tambahan.",
              },
              {
                icon: Activity,
                title: "Log proses real-time",
                desc: "Pantau setiap batch koreksi yang sedang berjalan, langsung dari dashboard.",
              },
              {
                icon: Users2,
                title: "Manajemen kelas & angkatan",
                desc: "Satu soal bisa dipakai lintas kelas, riwayat submission tetap rapi per kelas.",
              },
            ].map((f) => (
              <div key={f.title} className="border border-[var(--border)] p-6">
                <f.icon className="h-5 w-5 text-[var(--accent-ink)] mb-4" />
                <div className="text-[var(--text)] text-[14px] mb-2">{f.title}</div>
                <div className="text-[12.5px] text-[var(--text-faint)] leading-relaxed">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta footer */}
      <section className="relative z-10 px-6 md:px-10 py-20 border-t border-[var(--border-soft)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl text-[var(--text)] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Semester ini, biarkan SwaKoreksiIn yang mengoreksi.
          </h2>
          <p className="text-[var(--text-muted)] text-[14px] mb-8">
            Masuk dengan akun dosen Anda dan mulai buat soal pertama.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-fg)] px-7 py-3 text-[13px] font-semibold hover:bg-[var(--accent-hover)] transition-colors"
          >
            LOGIN DOSEN
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-6 md:px-10 py-6 border-t border-[var(--border-soft)] text-[11px] text-[var(--text-faint)] flex items-center justify-between">
        <span>NEXUS.grade — dummy landing page</span>
        <span>v0.1-preview</span>
      </footer>
    </main>
  );
}