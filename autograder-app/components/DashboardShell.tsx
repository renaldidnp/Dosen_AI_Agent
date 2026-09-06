"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Users,
  Settings,
  Search,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/app/theme-provider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/soal", label: "Bank Soal", icon: Database },
  { href: "/mahasiswa", label: "Mahasiswa", icon: Users },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="
        min-h-screen
        bg-[var(--bg)]
        text-[var(--text)]
        font-sans
        selection:bg-[var(--accent-soft)]
        selection:text-[var(--accent-ink)]
        transition-colors
        duration-300
      "
    >
      {/* =========================================================
          FIXED SIDEBAR
      ========================================================= */}
      <aside
        className="
          fixed left-0 top-0 z-50
          h-screen w-[16.5rem]
          bg-[var(--bg-panel)]
          border-r border-[var(--border)]
          flex flex-col justify-between
          shadow-sm
          transition-colors duration-300
        "
      >
        <div className="flex flex-col overflow-y-auto">
          {/* Brand */}
          <div className="h-20 px-6 flex items-center gap-3 border-b border-[var(--border-soft)] shrink-0">
            <div
              className="
                h-9 w-9 rounded-xl
                bg-[var(--accent)]
                text-[var(--accent-fg)]
                flex items-center justify-center
                shrink-0
              "
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-lg text-[var(--accent-ink)] tracking-tight leading-none truncate">
                Nexus Edu
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mt-1">
                Portal Pengampu
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-4 py-6">
            <p className="text-[11px] uppercase text-[var(--text-faint)] font-bold tracking-wider px-3 mb-2.5">
              Menu Utama
            </p>

            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname?.startsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-3
                      px-3.5 py-2.5
                      rounded-xl
                      text-sm font-semibold
                      transition-all
                      ${
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]"
                      }
                    `}
                  >
                    <Icon className="w-[20px] h-[20px] shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: AI Copilot status + system links */}
        <div className="px-4 py-5 border-t border-[var(--border-soft)] bg-[var(--bg)]/40 shrink-0">
          <div
            className="
              p-3 mb-3
              bg-[var(--accent-soft)]
              rounded-xl border border-[var(--accent-border)]
              flex items-center gap-3
            "
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center shrink-0">
              <Sparkles className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--accent-ink)] leading-tight">
                AI Copilot
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-medium truncate">
                Model aktif &amp; siap
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
              }
              className="
                flex items-center gap-3 px-3 py-2 rounded-lg
                text-[var(--text-muted)]
                hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
                font-medium text-sm transition-all
              "
            >
              {theme === "dark" ? (
                <Sun className="w-[20px] h-[20px] text-[var(--text-faint)]" />
              ) : (
                <Moon className="w-[20px] h-[20px] text-[var(--text-faint)]" />
              )}
              <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
            </button>

            <button
              type="button"
              className="
                flex items-center gap-3 px-3 py-2 rounded-lg
                text-[var(--text-muted)]
                hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
                font-medium text-sm transition-all
              "
            >
              <HelpCircle className="w-[20px] h-[20px] text-[var(--text-faint)]" />
              <span>Pusat Bantuan</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTAINER
      ========================================================= */}
      <div className="pl-[16.5rem] min-h-screen flex flex-col">
        {/* Top header */}
        <header
          className="
            fixed top-0 left-[16.5rem] right-0 h-20 z-40
            bg-[var(--bg-panel-translucent)] backdrop-blur-md
            border-b border-[var(--border)]
            flex items-center justify-between px-8
            transition-colors duration-300
          "
        >
          {/* Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full flex items-center">
              <Search className="w-[20px] h-[20px] absolute left-3.5 text-[var(--text-faint)] pointer-events-none" />
              <input
                type="text"
                placeholder="Cari modul soal, ujian, topik, atau mahasiswa..."
                className="
                  w-full pl-10 pr-4 py-2.5
                  bg-[var(--bg)]
                  border border-[var(--border)]
                  rounded-xl
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-faint)]
                  focus:outline-none focus:border-[var(--accent)]
                  focus:ring-2 focus:ring-[var(--accent-soft)]
                  transition-all
                "
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <div
              className="
                hidden md:inline-flex items-center gap-2
                px-3.5 py-1.5 rounded-full
                bg-[var(--accent-soft)] border border-[var(--accent-border)]
                text-[var(--accent-ink)]
              "
            >
              <span className="w-2 h-2 rounded-full bg-[var(--success)] ring-2 ring-[var(--success-soft)]" />
              <span className="text-xs font-semibold">Sistem Aktif</span>
            </div>

            <div className="h-8 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-3 pl-1">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center font-bold ring-2 ring-[var(--border-soft)]">
                D
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-sm font-bold text-[var(--text)] leading-tight">
                  Dosen
                </span>
                <span className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
                  Portal Pengampu
                </span>
              </div>
              <ChevronDown className="w-[18px] h-[18px] text-[var(--text-faint)] cursor-pointer" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="w-full pt-24 flex-1 relative">{children}</main>
      </div>
    </div>
  );
}