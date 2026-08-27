import { db } from "@/lib/db";
import Link from "next/link";
import SoalGrid from "./soal-grid";

export default async function DashboardPage() {
  const soalList = await db.soal.findMany({
    include: { submission: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSoal = soalList.length;
  const totalSubmissions = soalList.reduce((acc, soal) => acc + (soal.submission?.length || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">Dashboard Dosen</h1>
          <p className="text-sm text-slate-500">Kelola ujian dan pertanyaan untuk mata kuliah Anda.</p>
        </div>
        <Link
          href="/soal/create"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 w-full sm:w-fit hover:shadow-md hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Soal Baru
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Soal</p>
            <p className="text-2xl font-bold text-slate-800">{totalSoal}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Submissions</p>
            <p className="text-2xl font-bold text-slate-800">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Ujian Aktif</p>
            <p className="text-2xl font-bold text-slate-800">{totalSoal}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari soal atau ujian..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50 text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-slate-800 text-white whitespace-nowrap">Semua</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 whitespace-nowrap">Aktif</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 whitespace-nowrap">Draft</button>
        </div>
      </div>

      {/* Content Section */}
      {soalList.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Belum ada soal ujian</h3>
          <p className="text-slate-500 max-w-sm mb-6 text-sm">Mulai buat ujian atau kuis pertama Anda untuk membagikannya kepada mahasiswa.</p>
          <Link href="/soal/create" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Soal Pertama
          </Link>
        </div>
      ) : (
        <SoalGrid initialSoalList={soalList} />
      )}
    </div>
  );
}
