import { db } from "@/lib/db";
import Link from "next/link";
import RealTimeLog from "@/components/RealTimeLog";
import { Plus, FileStack, Users, FolderOpen, CircleCheck, FileEdit, ArrowRight } from "lucide-react";

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

  const draftCount = soalList.filter((s) => !s.submitToken?.trim()).length;
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
            <span>Aktif untuk submit link</span>
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
            <span>Belum ada link submit</span>
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
             MODUL TERBARU — ringkasan singkat, detail di Bank Soal
          ===================================================== */
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[var(--accent)]" />
                Modul Ujian Terbaru
              </h2>

              <Link
                href="/soal"
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-ink)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Lihat Semua di Bank Soal
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] divide-y divide-[var(--border-soft)] overflow-hidden shadow-xs">
              {soalList.slice(0, 4).map((soal) => {
                const isDraft = !soal.submitToken?.trim();
                return (
                  <Link
                    key={soal.id}
                    href={`/output/${soal.id}/daftar-submission`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--accent-soft)]/40 transition-colors group"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${isDraft ? "bg-[var(--text-faint)]" : "bg-[var(--success)] animate-pulse"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent-ink)] transition-colors">
                        {soal.judul}
                      </p>
                      <p className="text-[11px] text-[var(--text-faint)] mt-0.5 truncate">
                        {isDraft ? "Draft" : "Aktif"} &middot;{" "}
                        {soal.submission?.length ?? 0} submisi
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-faint)] shrink-0 group-hover:text-[var(--accent-ink)] transition-colors" />
                  </Link>
                );
              })}
            </div>
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