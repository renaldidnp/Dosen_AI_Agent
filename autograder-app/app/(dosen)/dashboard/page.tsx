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
  const totalSubmissions = soalList.reduce((acc, soal) => acc + (soal.submission?.length || 0), 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6 pb-12">
      {/* Top Metrics (Bento Row) */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Hero / title card */}
        <div className="relative overflow-hidden bg-[#111118]/70 backdrop-blur-xl border border-[#00f0ff]/10 rounded-[4px] p-6 flex flex-col justify-between border-l-4 border-l-[#00f0ff] md:col-span-2">
          <div>
            <div className="font-mono text-[11px] text-[#00f0ff] mb-1 tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-[2px]" style={{ boxShadow: "0 0 8px rgba(0,240,255,1)" }} />
              Nexus Command Center
            </div>
            <h1 className="font-semibold text-[28px] text-white leading-tight mt-2 tracking-tight">
              Dashboard <span className="text-[#00f0ff]" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Dosen_</span>
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">Kelola ujian dan pertanyaan untuk mata kuliah Anda.</p>
          </div>
          <div className="mt-4">
            <Link
              href="/soal/create"
              className="inline-flex items-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] font-mono text-xs px-4 py-2 rounded-[2px] uppercase tracking-wider hover:bg-[#00f0ff]/20 transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Buat Soal Baru
            </Link>
          </div>
        </div>

        {/* Metric: Total Soal */}
        <div className="bg-gradient-to-b from-[#1c1c28]/80 to-[#111118]/90 border border-[#00f0ff]/15 rounded-[4px] p-5 flex flex-col justify-between group hover:border-[#00f0ff]/50 transition-colors relative before:content-[''] before:absolute before:top-[-1px] before:left-[-1px] before:w-2 before:h-2 before:border-t-2 before:border-l-2 before:border-[#00f0ff]/70 after:content-[''] after:absolute after:bottom-[-1px] after:right-[-1px] after:w-2 after:h-2 after:border-b-2 after:border-r-2 after:border-[#00f0ff]/70">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Total Soal // DB_Count</span>
              <span className="text-3xl font-semibold text-white mt-2 group-hover:text-[#00f0ff] transition-colors">{totalSoal}</span>
            </div>
            <Database className="w-5 h-5 text-[#00f0ff]/50" />
          </div>
        </div>

        {/* Metric: Total Submissions */}
        <div className="bg-gradient-to-b from-[#1c1c28]/80 to-[#111118]/90 border border-[#00f0ff]/15 rounded-[4px] p-5 flex flex-col justify-between group hover:border-[#cf5cff]/50 transition-colors relative before:content-[''] before:absolute before:top-[-1px] before:left-[-1px] before:w-2 before:h-2 before:border-t-2 before:border-l-2 before:border-[#00f0ff]/70 after:content-[''] after:absolute after:bottom-[-1px] after:right-[-1px] after:w-2 after:h-2 after:border-b-2 after:border-r-2 after:border-[#00f0ff]/70">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">Submissions // Intake</span>
              <span className="text-3xl font-semibold text-white mt-2 group-hover:text-[#ecb2ff] transition-colors">{totalSubmissions}</span>
            </div>
            <Users className="w-5 h-5 text-[#cf5cff]/50" />
          </div>
        </div>
      </section>

      {/* Content: modul soal + real-time log */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        {soalList.length === 0 ? (
          <div className="bg-[#111118]/50 border border-[#00f0ff]/10 border-dashed rounded-[4px] p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-[4px] flex items-center justify-center text-[#00f0ff]/60 mb-4">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Belum ada soal ujian</h3>
            <p className="text-[#8b949e] max-w-sm mb-6 text-sm">Mulai buat ujian atau kuis pertama Anda untuk membagikannya kepada mahasiswa.</p>
            <Link
              href="/soal/create"
              className="inline-flex items-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] font-mono text-xs px-4 py-2 rounded-[2px] uppercase tracking-wider hover:bg-[#00f0ff]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Soal Pertama
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="font-mono text-sm text-[#00f0ff] uppercase tracking-widest flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Active Modules
              </h2>
            </div>
            <SoalGrid initialSoalList={soalList} />
          </div>
        )}

        <RealTimeLog />
      </div>
    </div>
  );
}