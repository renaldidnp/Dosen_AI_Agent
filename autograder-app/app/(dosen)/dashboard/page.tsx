import { db } from "@/lib/db";
import Link from "next/link";

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
        /* Empty State */
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
        /* Card Grid List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {soalList.map((soal) => (
            <div key={soal.id} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col group relative overflow-hidden hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all"></div>

              <div className="flex justify-between items-start mb-3 md:mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">Aktif</span>
                <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 rounded-full hover:bg-slate-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              <h2 className="text-lg font-semibold text-slate-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{soal.judul}</h2>

              <div className="flex flex-col gap-3 text-sm text-slate-500 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    Dibuat:{" "}
                    {"createdAt" in soal && soal.createdAt
                      ? new Date(soal.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md w-fit text-xs">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>{soal.submission?.length || 0} Submissions</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                <Link
                  href={`/output/${soal.id}/daftar-submission`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium gap-1.5 transition-all w-full sm:w-auto"
                >
                  Lihat hasil
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
