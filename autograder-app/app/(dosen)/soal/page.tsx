import { db } from "@/lib/db";
import Link from "next/link";
import SoalGrid from "@/app/(dosen)/dashboard/soal-grid";
import { Plus, Database, FileStack, CircleCheck, FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BankSoalPage() {
  const soalList = await db.soal.findMany({
    include: { submission: true },
    orderBy: { createdAt: "desc" },
  });

  const draftCount = soalList.filter((s) => !s.submitToken?.trim()).length;
  const activeCount = soalList.length - draftCount;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-[1600px] mx-auto">
      {/* Header & primary action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-[var(--text)] tracking-tight">
            Bank Soal
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Kumpulan semua modul soal ujian/kuis beserta status &amp; submisinya.
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

      {/* Mini KPI */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--border)] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center shrink-0">
            <FileStack className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xl sm:text-2xl font-extrabold text-[var(--text)] leading-none">
              {soalList.length}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mt-1 block truncate">
              Total Modul
            </span>
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--success-border)] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[var(--success-soft)] text-[var(--success-ink)] flex items-center justify-center shrink-0">
            <CircleCheck className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xl sm:text-2xl font-extrabold text-[var(--text)] leading-none">
              {activeCount}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mt-1 block truncate">
              Aktif
            </span>
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] rounded-2xl p-3.5 sm:p-5 border border-[var(--warning-border)] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-ink)] flex items-center justify-center shrink-0">
            <FileEdit className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xl sm:text-2xl font-extrabold text-[var(--text)] leading-none">
              {draftCount}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mt-1 block truncate">
              Draft
            </span>
          </div>
        </div>
      </section>

      {/* Daftar semua soal */}
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-[var(--accent)]" />
        <h2 className="font-heading text-sm font-bold text-[var(--text)]">
          Semua Modul Soal
        </h2>
      </div>

      <SoalGrid initialSoalList={soalList} />
    </div>
  );
}