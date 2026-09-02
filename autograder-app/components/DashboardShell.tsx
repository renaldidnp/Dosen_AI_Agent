"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Database,
  Users,
  Settings,
  Search,
  Terminal,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/app/theme-provider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Command", icon: Activity },
  { href: "/soal", label: "Soal_DB", icon: Database },
  { href: "/mahasiswa", label: "Nodes", icon: Users },
  { href: "/settings", label: "Config", icon: Settings },
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
        selection:bg-[var(--accent)]
        selection:text-[var(--accent-fg)]
        transition-colors
        duration-300
      "
    >
      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================= */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at 10% 20%,
              color-mix(in srgb, var(--accent) 7%, transparent) 0%,
              transparent 40%
            ),
            radial-gradient(
              circle at 90% 80%,
              color-mix(in srgb, var(--accent) 5%, transparent) 0%,
              transparent 40%
            ),
            linear-gradient(
              var(--accent) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              var(--accent) 1px,
              transparent 1px
            )
          `,
          backgroundSize:
            "100% 100%, 100% 100%, 48px 48px, 48px 48px",
          opacity: "var(--grid-opacity)",
        }}
      />

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <nav
        className="
          group
          fixed
          left-0
          top-0
          z-50

          h-screen
          w-20
          hover:w-64
          overflow-hidden

          bg-[var(--bg-panel-translucent)]
          backdrop-blur-xl

          border-r
          border-[var(--border)]

          flex
          flex-col
          items-center

          py-6

          transition-all
          duration-300
        "
      >
        {/* -------------------------------------------------------
            BRAND
        ------------------------------------------------------- */}
        <div className="mb-10 flex items-center w-full px-4 shrink-0">
          <div
            className="
              relative
              w-10
              h-10
              rounded-[4px]

              bg-[var(--accent-soft)]
              border
              border-[var(--accent-border)]

              shrink-0

              flex
              items-center
              justify-center

              text-[var(--accent-ink)]

              transition-colors
              duration-300
            "
          >
            <Activity className="w-5 h-5" />

            {/* Corner decoration */}
            <span
              className="
                absolute
                -top-px
                -left-px
                w-2
                h-2
                border-t
                border-l
                border-[var(--accent)]
              "
            />

            <span
              className="
                absolute
                -bottom-px
                -right-px
                w-2
                h-2
                border-b
                border-r
                border-[var(--accent)]
              "
            />
          </div>

          <div
            className="
              ml-4
              opacity-0
              group-hover:opacity-100
              transition-opacity
              duration-300
              whitespace-nowrap
            "
          >
            <div
              className="
                font-semibold
                text-[var(--accent-ink)]
                text-sm
                tracking-tight
              "
              style={{
                textShadow:
                  "0 0 10px color-mix(in srgb, var(--accent) 40%, transparent)",
              }}
            >
              SYS.ADM_01
            </div>

            <div
              className="
                text-[10px]
                text-[var(--text-muted)]
                font-mono
                uppercase
                tracking-widest
                mt-1
              "
            >
              Nexus // Eduportal
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------
            NAVIGATION
        ------------------------------------------------------- */}
        <div
          className="
            flex-1
            w-full
            space-y-1
            px-3

            flex
            flex-col
            items-center
            group-hover:items-start
          "
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative
                  w-full

                  flex
                  items-center

                  py-3
                  px-3

                  rounded-[4px]

                  transition-all
                  duration-200

                  border-l-2

                  ${
                    active
                      ? `
                        text-[var(--accent-ink)]
                        border-[var(--accent)]
                        bg-[var(--accent-soft)]
                      `
                      : `
                        text-[var(--text-muted)]
                        border-transparent

                        hover:bg-[var(--accent-soft)]
                        hover:text-[var(--accent-ink)]
                      `
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <span
                    className="
                      absolute
                      right-0
                      top-1/2
                      -translate-y-1/2

                      w-1
                      h-5

                      bg-[var(--accent)]
                    "
                    style={{
                      boxShadow: "0 0 8px var(--accent)",
                    }}
                  />
                )}

                <Icon className="w-5 h-5 shrink-0" />

                <span
                  className="
                    ml-4

                    opacity-0
                    group-hover:opacity-100

                    transition-opacity
                    duration-300

                    whitespace-nowrap

                    font-mono
                    text-xs
                    uppercase
                    tracking-wider
                  "
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* -------------------------------------------------------
            AGENT STATUS
        ------------------------------------------------------- */}
        <div
          className="
            mt-6
            w-full
            px-4
            shrink-0

            flex
            items-center
            justify-center
            group-hover:justify-start
          "
        >
          <div
            className="
              w-2
              h-2

              rounded-full

              bg-[var(--accent)]

              shrink-0

              animate-pulse
            "
            style={{
              boxShadow: "0 0 8px var(--accent)",
            }}
          />

          <span
            className="
              ml-4

              text-[10px]
              text-[var(--accent-ink)]

              font-mono
              uppercase
              tracking-widest

              opacity-0
              group-hover:opacity-100

              transition-opacity
              duration-300

              whitespace-nowrap
            "
          >
            Agent Core: Online
          </span>
        </div>
      </nav>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main
        className="
          ml-20
          flex
          flex-col
          min-h-screen
          relative
          z-10
        "
      >
        {/* =======================================================
            TOP STATUS BAR
        ======================================================= */}
        <header
          className="
            bg-[var(--bg-panel-translucent)]
            backdrop-blur-md

            border-b
            border-[var(--border)]

            flex
            justify-between
            items-center

            w-full
            px-6
            h-14

            z-40
            sticky
            top-0

            font-mono
            text-xs

            transition-colors
            duration-300
          "
        >
          {/* -----------------------------------------------------
              SYSTEM STATUS
          ----------------------------------------------------- */}
          <div
            className="
              flex
              items-center
              gap-6

              text-[var(--text-muted)]
            "
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[var(--accent)]"
                style={{
                  textShadow: "0 0 8px var(--accent)",
                }}
              >
                ●
              </span>

              <span className="tracking-widest hidden sm:inline">
                SYS.ONLINE
              </span>
            </div>

            <div
              className="
                hidden
                lg:flex
                items-center
                gap-2
                text-[var(--text-faint)]
              "
            >
              <span>NODE:</span>

              <span className="text-[var(--accent-ink)]">
                DOSEN
              </span>
            </div>
          </div>

          {/* -----------------------------------------------------
              SEARCH + THEME + TERMINAL
          ----------------------------------------------------- */}
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="relative w-48 hidden sm:block">
              <Search
                className="
                  w-3.5
                  h-3.5

                  absolute
                  left-2
                  top-1/2
                  -translate-y-1/2

                  text-[var(--accent)]
                  opacity-60
                "
              />

              <input
                className="
                  w-full

                  bg-[var(--bg)]

                  border
                  border-[var(--border)]

                  rounded-[2px]

                  focus:ring-1
                  focus:ring-[var(--accent)]
                  focus:border-[var(--accent)]

                  text-[var(--text)]

                  pl-7
                  py-1.5

                  text-[10px]
                  uppercase

                  placeholder:text-[var(--text-faint)]

                  transition-all

                  font-mono
                  outline-none
                "
                placeholder="Query database..."
                type="text"
              />
            </div>

            {/* =================================================
                THEME TOGGLE
            ================================================= */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Aktifkan mode terang"
                  : "Aktifkan mode gelap"
              }
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
              className="
                group/theme

                relative

                flex
                items-center
                justify-center

                w-8
                h-8

                rounded-[2px]

                bg-[var(--bg)]

                border
                border-[var(--border)]

                text-[var(--accent-ink)]

                hover:bg-[var(--accent-soft)]
                hover:border-[var(--accent-border)]

                transition-all
                duration-200

                focus:outline-none
                focus:ring-1
                focus:ring-[var(--accent)]
              "
            >
              {theme === "dark" ? (
                <Sun
                  className="
                    w-4
                    h-4

                    transition-transform
                    duration-300

                    group-hover/theme:rotate-45
                  "
                />
              ) : (
                <Moon
                  className="
                    w-4
                    h-4

                    transition-transform
                    duration-300

                    group-hover/theme:-rotate-12
                  "
                />
              )}
            </button>

            {/* TERMINAL */}
            <button
              type="button"
              className="
                text-[var(--accent-ink)]

                hover:text-[var(--accent-hover)]
                hover:bg-[var(--accent-soft)]

                p-2

                rounded-[2px]

                transition-colors

                focus:outline-none
                focus:ring-1
                focus:ring-[var(--accent)]
              "
              aria-label="Terminal"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =======================================================
            PAGE CONTENT
        ======================================================= */}
        <div className="flex-1 relative">
          {children}
        </div>
      </main>
    </div>
  );
}