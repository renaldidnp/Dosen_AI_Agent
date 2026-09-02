import { db } from "@/lib/db";
import Link from "next/link";
import SoalGrid from "./soal-grid";
import RealTimeLog from "@/components/RealTimeLog";
import { Plus, Database, Users, FolderOpen } from "lucide-react";

export default async function DashboardPage() {
  const soalList = await db.soal.findMany({
    include: { submission: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSoal = soalList.length;

  const totalSubmissions = soalList.reduce(
    (acc, soal) => acc + (soal.submission?.length || 0),
    0
  );

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Grid background — mengikuti landing page */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: "var(--grid-opacity)" as unknown as number,
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6 pb-12">
        {/* =========================================================
            TOP METRICS
        ========================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Hero / title card */}
          <div
            className="
              relative overflow-hidden
              bg-[var(--bg-panel-translucent)]
              backdrop-blur-xl
              border border-[var(--border)]
              rounded-[4px]
              p-6
              flex flex-col justify-between
              border-l-4 border-l-[var(--accent)]
              md:col-span-2
              transition-colors duration-300
            "
          >
            {/* Accent glow */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 opacity-40"
              style={{
                background: "var(--glow-radial)",
              }}
            />

            <div className="relative">
              <div className="font-mono text-[11px] text-[var(--accent-ink)] mb-1 tracking-widest uppercase flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-[2px] bg-[var(--accent)] animate-pulse"
                  style={{
                    boxShadow: "0 0 8px var(--accent)",
                  }}
                />

                Nexus Command Center
              </div>

              <h1
                className="
                  font-semibold
                  text-[28px]
                  text-[var(--text)]
                  leading-tight
                  mt-2
                  tracking-tight
                "
              >
                Dashboard{" "}
                <span
                  className="text-[var(--accent-ink)]"
                  style={{
                    textShadow: "0 0 10px var(--accent)",
                  }}
                >
                  Dosen_
                </span>
              </h1>

              <p className="text-sm text-[var(--text-muted)] mt-1">
                Kelola ujian dan pertanyaan untuk mata kuliah Anda.
              </p>
            </div>

            <div className="relative mt-4">
              <Link
                href="/soal/create"
                className="
                  inline-flex items-center gap-2
                  bg-[var(--accent-soft)]
                  border border-[var(--accent-border)]
                  text-[var(--accent-ink)]
                  font-mono text-xs
                  px-4 py-2
                  rounded-[2px]
                  uppercase tracking-wider
                  hover:bg-[var(--accent)]
                  hover:text-[var(--accent-fg)]
                  hover:border-[var(--accent)]
                  transition-all
                "
              >
                <Plus className="w-4 h-4" />
                Buat Soal Baru
              </Link>
            </div>
          </div>

          {/* =======================================================
              TOTAL SOAL
          ======================================================= */}
          <div
            className="
              bg-[var(--bg-panel)]
              border border-[var(--border)]
              rounded-[4px]
              p-5
              flex flex-col justify-between
              group
              hover:border-[var(--accent-border-strong)]
              transition-colors
              relative
              overflow-hidden
            "
          >
            {/* Corner decoration */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--accent-border)]" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--accent-border)]" />

            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                  Total Soal // DB_Count
                </span>

                <span className="text-3xl font-semibold text-[var(--text)] mt-2 group-hover:text-[var(--accent-ink)] transition-colors">
                  {totalSoal}
                </span>
              </div>

              <Database className="w-5 h-5 text-[var(--accent)] opacity-60" />
            </div>
          </div>

          {/* =======================================================
              TOTAL SUBMISSIONS
          ======================================================= */}
          <div
            className="
              bg-[var(--bg-panel)]
              border border-[var(--border)]
              rounded-[4px]
              p-5
              flex flex-col justify-between
              group
              hover:border-[var(--accent-border-strong)]
              transition-colors
              relative
              overflow-hidden
            "
          >
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--accent-border)]" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--accent-border)]" />

            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                  Submissions // Intake
                </span>

                <span className="text-3xl font-semibold text-[var(--text)] mt-2 group-hover:text-[var(--accent-ink)] transition-colors">
                  {totalSubmissions}
                </span>
              </div>

              <Users className="w-5 h-5 text-[var(--accent)] opacity-60" />
            </div>
          </div>
        </section>

        {/* =========================================================
            CONTENT
        ========================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
          {soalList.length === 0 ? (
            /* =====================================================
               EMPTY STATE
            ===================================================== */
            <div
              className="
                bg-[var(--bg-panel-translucent)]
                backdrop-blur-xl
                border border-[var(--accent-border)]
                border-dashed
                rounded-[4px]
                p-12
                flex flex-col
                items-center
                justify-center
                text-center
                min-h-[320px]
              "
            >
              <div
                className="
                  w-16 h-16
                  bg-[var(--accent-soft)]
                  border border-[var(--accent-border)]
                  rounded-[4px]
                  flex items-center justify-center
                  text-[var(--accent-ink)]
                  mb-4
                "
              >
                <FolderOpen className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                Belum ada soal ujian
              </h3>

              <p className="text-[var(--text-muted)] max-w-sm mb-6 text-sm">
                Mulai buat ujian atau kuis pertama Anda untuk membagikannya
                kepada mahasiswa.
              </p>

              <Link
                href="/soal/create"
                className="
                  inline-flex items-center gap-2
                  bg-[var(--accent-soft)]
                  border border-[var(--accent-border)]
                  text-[var(--accent-ink)]
                  font-mono text-xs
                  px-4 py-2
                  rounded-[2px]
                  uppercase tracking-wider
                  hover:bg-[var(--accent)]
                  hover:text-[var(--accent-fg)]
                  transition-all
                "
              >
                <Plus className="w-4 h-4" />
                Buat Soal Pertama
              </Link>
            </div>
          ) : (
            /* =====================================================
               ACTIVE MODULES
            ===================================================== */
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-2">
                <h2 className="font-mono text-sm text-[var(--accent-ink)] uppercase tracking-widest flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Active Modules
                </h2>

                <span className="font-mono text-[10px] text-[var(--text-faint)]">
                  {soalList.length} MODULE{soalList.length !== 1 ? "S" : ""}
                </span>
              </div>

              <SoalGrid initialSoalList={soalList} />
            </div>
          )}

          {/* =======================================================
              REAL TIME LOG
          ======================================================= */}
          <RealTimeLog />
        </div>
      </div>
    </div>
  );
}