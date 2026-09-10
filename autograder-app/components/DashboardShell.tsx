"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Database,
  School,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  LogOut,
  Loader2,
  Menu,
  X,
  UserRound,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import GlobalSearch from "./GlobalSearch";
import { useProfile, avatarInitials } from "./useProfile";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/soal", label: "Bank Soal", icon: Database },
  { href: "/kelas", label: "Kelas & Mahasiswa", icon: School },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { profile, loading: profileLoading } = useProfile();

  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Tutup drawer otomatis setiap kali pindah halaman
  useEffect(() => {
    setSidebarOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  // Tutup dropdown profil saat klik di luar / tekan Escape
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      router.push("/auth/login");
    }
  }

  const nama = profile?.nama ?? "Dosen";
  const email = profile?.email ?? "Belum terautentikasi";
  const initials = avatarInitials(profile?.nama);

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
          MOBILE / TABLET BACKDROP (di bawah lg)
      ========================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================
          SIDEBAR — drawer di mobile/tablet, fixed terbuka di lg+
      ========================================================= */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-[16.5rem]
          bg-[var(--bg-panel)]
          border-r border-[var(--border)]
          flex flex-col
          shadow-sm lg:shadow-none
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="h-16 sm:h-20 px-5 sm:px-6 flex items-center justify-between gap-3 border-b border-[var(--border-soft)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
              <div
                className="
                  h-9 w-9 rounded-xl
                  bg-[var(--accent)]
                  text-[var(--accent-fg)]
                  flex items-center justify-center
                  shrink-0 shadow-sm
                "
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-bold text-lg text-[var(--accent-ink)] tracking-tight leading-none truncate">
                  SwaKoreksiIn
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mt-1">
                  Portal Pengampu
                </span>
              </div>
            </div>

            {/* Tombol tutup drawer — cuma tampil di mobile/tablet */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition-colors shrink-0"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

{/* Navigation */}
  <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="text-[11px] uppercase text-[var(--text-faint)] font-bold tracking-wider px-3 mb-2.5">
              Menu Utama
            </p>

            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname?.startsWith(href + "/");

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3
                      px-3.5 py-2.5
                      rounded-xl
                      text-sm font-semibold
                      transition-all
                      ${active
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

          {/* Bottom: kartu user + pintasan sistem */}
        <div className="px-4 py-5 border-t border-[var(--border-soft)] bg-[var(--bg)]/40 shrink-0 space-y-2">
          {/* Kartu user */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-sm font-extrabold shrink-0 ring-2 ring-[var(--accent-border)]">
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--accent-ink)] leading-tight truncate">
                {nama}
              </p>
              <p className="text-[11px] text-[var(--accent-ink)]/70 truncate leading-tight mt-0.5">
                {email}
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              Dosen
            </span>
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

            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className="
                flex items-center gap-3 px-3 py-2 rounded-lg
                text-[var(--text-muted)]
                hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
                font-medium text-sm transition-all
              "
            >
              <HelpCircle className="w-[20px] h-[20px] text-[var(--text-faint)]" />
              <span>Bantuan &amp; Profil</span>
            </Link>

            <div className="my-1 border-t border-[var(--border-soft)]" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="
                flex items-center gap-3 px-3 py-2 rounded-lg
                text-[var(--danger-text)]
                hover:bg-[var(--danger-soft)]
                font-medium text-sm transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {loggingOut ? (
                <Loader2 className="w-[20px] h-[20px] animate-spin" />
              ) : (
                <LogOut className="w-[20px] h-[20px]" />
              )}
              <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTAINER — geser cuma di lg+ karena sidebar jadi drawer
          di bawah itu
      ========================================================= */}
      <div className="lg:pl-[16.5rem] min-h-screen flex flex-col">
        {/* Top header */}
        <header
          className="
            fixed top-0 left-0 lg:left-[16.5rem] right-0 h-16 sm:h-20 z-30
            bg-[var(--bg-panel-translucent)] backdrop-blur-md
            border-b border-[var(--border)]
            flex items-center justify-between gap-3
            px-4 sm:px-6 lg:px-8
            transition-colors duration-300
          "
        >
          {/* Kiri: hamburger (mobile/tablet) + search */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="
                lg:hidden shrink-0 p-2 rounded-xl
                text-[var(--text-muted)]
                hover:text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]
                border border-transparent hover:border-[var(--border)]
                transition-colors
              "
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <GlobalSearch />
          </div>

          {/* Kanan: notifikasi, status, profil */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              aria-label="Notifikasi"
              title="Notifikasi"
              className="
                hidden sm:flex items-center justify-center
                w-9 h-9 sm:w-10 sm:h-10 rounded-xl
                border border-[var(--border)]
                text-[var(--text-muted)]
                hover:text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]
                hover:border-[var(--accent-border)]
                transition-colors relative
              "
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>

            <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)]">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] ring-2 ring-[var(--success-soft)] animate-pulse" />
              <span className="text-xs font-semibold whitespace-nowrap">Sistem Aktif</span>
            </div>

            <div className="hidden sm:block h-8 w-px bg-[var(--border)]" />

            {/* Dropdown profil */}
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className="
                  flex items-center gap-2 sm:gap-3 pl-0 sm:pl-1
                  py-1.5 pr-1 rounded-xl
                  hover:bg-[var(--accent-soft)]
                  transition-colors
                "
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center font-bold text-sm ring-2 ring-[var(--border-soft)] shrink-0">
                  {profileLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden xl:flex flex-col text-left max-w-[12rem]">
                  <span className="text-sm font-bold text-[var(--text)] leading-tight truncate">
                    {nama}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] leading-tight mt-0.5 truncate">
                    {email}
                  </span>
                </div>
                <ChevronDown
                  className={`hidden sm:block w-[18px] h-[18px] text-[var(--text-faint)] transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Menu dropdown */}
              {profileMenuOpen && (
                <div
                  role="menu"
                  className="
                    absolute right-0 top-full mt-2 w-64
                    bg-[var(--bg-panel)]
                    border border-[var(--border)]
                    rounded-2xl
                    shadow-xl shadow-slate-900/10
                    overflow-hidden
                    z-50
                  "
                >
                  <div className="px-4 py-3.5 border-b border-[var(--border-soft)] bg-[var(--bg)]/40">
                    <p className="text-sm font-bold text-[var(--text)] leading-tight truncate">
                      {nama}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-1 truncate">
                      {email}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)] text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Dosen
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <ProfileMenuItem
                      href="/settings"
                      icon={UserRound}
                      label="Profil &amp; Akun"
                    />
                    <ProfileMenuItem
                      href="/settings"
                      icon={Settings}
                      label="Pengaturan"
                    />
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="
                        w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                        text-sm text-[var(--text-muted)]
                        hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
                        transition-colors text-left
                      "
                    >
                      {theme === "dark" ? (
                        <Sun className="w-[18px] h-[18px] text-[var(--text-faint)]" />
                      ) : (
                        <Moon className="w-[18px] h-[18px] text-[var(--text-faint)]" />
                      )}
                      <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
                    </button>

                    <div className="my-1 border-t border-[var(--border-soft)]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="
                        w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                        text-sm font-semibold text-[var(--danger-text)]
                        hover:bg-[var(--danger-soft)]
                        transition-colors disabled:opacity-60
                      "
                    >
                      {loggingOut ? (
                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      ) : (
                        <LogOut className="w-[18px] h-[18px]" />
                      )}
                      <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="w-full pt-16 sm:pt-20 flex-1 relative">{children}</main>
      </div>
    </div>
  );
}

function ProfileMenuItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserRound;
  label: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        flex items-center gap-2.5 px-3 py-2 rounded-xl
        text-sm text-[var(--text-muted)]
        hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
        transition-colors
      "
    >
      <Icon className="w-[18px] h-[18px] text-[var(--text-faint)]" />
      <span>{label}</span>
    </Link>
  );
}