import { db } from "@/lib/db";
import Link from "next/link";
import SoalGrid from "./soal-grid";
import RealTimeLog from "@/components/RealTimeLog";
import { Plus, FileStack, Users, FolderOpen, CircleCheck, FileEdit } from "lucide-react";

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

  const draftCount = soalList.filter((s) => !s.googleFormUrl?.trim()).length;
  const activeCount = totalSoal - draftCount;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-[1600px] mx-auto">
      {/* =========================================================
          GREETING & PRIMARY ACTIONS
      ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-[var(--text)] tracking-tight">
            Dashboard Dosen
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Kelola ujian dan pertanyaan untuk mata kuliah Anda.
          </p>
        </div>

        <Link
          href="/soal/create"
          className="
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-[var(--accent-fg)]
            text-sm font-bold
            shadow-md shadow-[var(--accent-soft)]
            transition-all active:scale-[0.98]
          "
        >
          <Plus className="w-5 h-5" />
          Buat Soal Baru
        </Link>
      </div>

      {/* =========================================================
          KPI RIBBON
      ========================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide sm:tracking-wider truncate min-w-0">
              Total Modul Soal
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
              <FileStack className="w-[16px] h-[16px] sm:w-[22px] sm:h-[22px]" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            {totalSoal}
          </span>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-soft)] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-[var(--text-muted)]">
            <span>{activeCount} Aktif</span>
            <span className="font-medium text-[var(--text)]">{draftCount} Draft</span>
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide sm:tracking-wider truncate min-w-0">
              Total Submisi Masuk
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
              <Users className="w-[16px] h-[16px] sm:w-[22px] sm:h-[22px]" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            {totalSubmissions}
          </span>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-soft)] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-[var(--text-muted)]">
            <span>Seluruh modul</span>
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--success-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--success-ink)] uppercase tracking-wide sm:tracking-wider truncate min-w-0">
              Modul Aktif
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--success-soft)] text-[var(--success-ink)] flex items-center justify-center">
              <CircleCheck className="w-[16px] h-[16px] sm:w-[22px] sm:h-[22px]" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            {activeCount}
          </span>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-soft)] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-[var(--text-muted)]">
            <span>Sudah terhubung Google Form</span>
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--warning-border)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--warning-ink)] uppercase tracking-wide sm:tracking-wider truncate min-w-0">
              Modul Draft
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-ink)] flex items-center justify-center">
              <FileEdit className="w-[16px] h-[16px] sm:w-[22px] sm:h-[22px]" />
            </div>
          </div>
          <span className="text-xl sm:text-3xl font-extrabold text-[var(--text)] mt-1">
            {draftCount}
          </span>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border-soft)] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-[var(--text-muted)]">
            <span>Belum terhubung Google Form</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTENT: WORKSPACE + ACTIVITY PANEL
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {soalList.length === 0 ? (
          /* =====================================================
             EMPTY STATE
          ===================================================== */
          <div
            className="
              bg-[var(--bg-panel)]
              border border-dashed border-[var(--border-strong)]
              rounded-2xl
              p-12
              flex flex-col items-center justify-center text-center
              min-h-[320px]
            "
          >
            <div className="w-16 h-16 bg-[var(--accent-soft)] rounded-2xl flex items-center justify-center text-[var(--accent-ink)] mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>

            <h3 className="font-heading text-lg font-bold text-[var(--text)] mb-2">
              Belum ada soal ujian
            </h3>

            <p className="text-[var(--text-muted)] max-w-sm mb-6 text-sm">
              Mulai buat ujian atau kuis pertama Anda untuk membagikannya kepada
              mahasiswa.
            </p>

            <Link
              href="/soal/create"
              className="
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                text-[var(--accent-fg)]
                text-sm font-bold
                shadow-xs transition-all
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
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[var(--accent)]" />
                Modul Ujian
              </h2>

              <span className="text-xs text-[var(--text-faint)] font-medium">
                {soalList.length} modul
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
  );
}