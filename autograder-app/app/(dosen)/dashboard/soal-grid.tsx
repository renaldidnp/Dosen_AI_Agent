"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, X, Loader2, Plus, Trash } from "lucide-react";

type Indikator = { id?: string; nama: string; bobot: number; rubrik: string; skorMax: number };

type Soal = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  googleFormUrl?: string | null;
  createdAt: Date | string;
  submission?: unknown[];
  indikator?: Indikator[];
};

export default function SoalGrid({ initialSoalList }: { initialSoalList: Soal[] }) {
  const [soalList, setSoalList] = useState<Soal[]>(initialSoalList);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingSoal, setDeletingSoal] = useState<Soal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // state modal edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editJudul, setEditJudul] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editGoogleFormUrl, setEditGoogleFormUrl] = useState("");
  const [editIndikator, setEditIndikator] = useState<Indikator[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openEditModal(soal: Soal) {
    setOpenMenuId(null);
    setEditingId(soal.id);
    setIsLoadingEdit(true);
    try {
      const res = await fetch(`/api/soal/${soal.id}`);
      if (!res.ok) throw new Error("Gagal memuat data soal");
      const detail = await res.json();

      setEditJudul(detail.judul ?? "");
      setEditDeskripsi(detail.deskripsi ?? "");
      setEditGoogleFormUrl(detail.googleFormUrl ?? "");
      setEditIndikator(
        detail.indikator?.length
          ? detail.indikator.map((ind: Indikator) => ({
              id: ind.id,
              nama: ind.nama,
              bobot: ind.bobot,
              rubrik: ind.rubrik,
              skorMax: ind.skorMax,
            }))
          : [{ nama: "", bobot: 0, rubrik: "", skorMax: 100 }],
      );
    } catch (err) {
      console.error(err);
      alert("Gagal memuat detail soal.");
      setEditingId(null);
    } finally {
      setIsLoadingEdit(false);
    }
  }

  function closeEditModal() {
    setEditingId(null);
    setEditJudul("");
    setEditDeskripsi("");
    setEditGoogleFormUrl("");
    setEditIndikator([]);
  }

  function addEditIndikator() {
    setEditIndikator([...editIndikator, { nama: "", bobot: 0, rubrik: "", skorMax: 100 }]);
  }

  function removeEditIndikator(i: number) {
    setEditIndikator(editIndikator.filter((_, idx) => idx !== i));
  }

  function updateEditIndikator(i: number, field: keyof Indikator, value: string | number) {
    const next = [...editIndikator];
    // @ts-expect-error simple dynamic assignment
    next[i][field] = value;
    setEditIndikator(next);
  }

  function openDeleteModal(soal: Soal) {
    setDeletingSoal(soal);
    setOpenMenuId(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    if (!editJudul.trim()) {
      alert("Judul soal tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/soal/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: editJudul,
          deskripsi: editDeskripsi,
          googleFormUrl: editGoogleFormUrl,
          indikator: editIndikator,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      const updated = await res.json();

      setSoalList((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...updated } : s)));
      closeEditModal();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingSoal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/soal/${deletingSoal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus soal");

      setSoalList((prev) => prev.filter((s) => s.id !== deletingSoal.id));
      setDeletingSoal(null);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus soal. Coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {soalList.map((soal) => (
          <div key={soal.id} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col group relative overflow-hidden hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all"></div>

            <div className="flex justify-between items-start mb-3 md:mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">Aktif</span>

              <div className="relative" ref={openMenuId === soal.id ? menuRef : null}>
                <button onClick={() => setOpenMenuId(openMenuId === soal.id ? null : soal.id)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 rounded-full hover:bg-slate-50">
                  <MoreVertical className="w-5 h-5" />
                </button>

                {openMenuId === soal.id && (
                  <div className="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10">
                    <button onClick={() => openEditModal(soal)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Pencil className="w-4 h-4 text-slate-400" />
                      Edit
                    </button>
                    <button onClick={() => openDeleteModal(soal)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{soal.judul}</h2>

            <div className="flex flex-col gap-3 text-sm text-slate-500 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  Dibuat:{" "}
                  {soal.createdAt
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

      {/* Modal Edit — sekarang lengkap seperti form create */}
      {editingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Edit Soal</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEdit ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Memuat data soal...
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Judul Soal</label>
                    <input
                      type="text"
                      value={editJudul}
                      onChange={(e) => setEditJudul(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Deskripsi Soal</label>
                    <textarea
                      value={editDeskripsi}
                      onChange={(e) => setEditDeskripsi(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Link Google Form</label>
                    <input
                      type="text"
                      value={editGoogleFormUrl}
                      onChange={(e) => setEditGoogleFormUrl(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Indikator Penilaian</h4>
                  <button onClick={addEditIndikator} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
                    <Plus className="w-4 h-4" />
                    Tambah indikator
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {editIndikator.map((ind, i) => (
                    <div key={ind.id ?? i} className="border border-slate-200 p-3 rounded-lg space-y-2 relative">
                      {editIndikator.length > 1 && (
                        <button onClick={() => removeEditIndikator(i)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Nama indikator"
                        value={ind.nama}
                        onChange={(e) => updateEditIndikator(i, "nama", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Bobot (%)"
                          value={ind.bobot}
                          onChange={(e) => updateEditIndikator(i, "bobot", Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Skor maksimal"
                          value={ind.skorMax}
                          onChange={(e) => updateEditIndikator(i, "skorMax", Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <textarea
                        placeholder="Deskripsi rubrik penilaian"
                        value={ind.rubrik}
                        onChange={(e) => updateEditIndikator(i, "rubrik", e.target.value)}
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editJudul.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan Perubahan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingSoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Hapus Soal?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Soal <span className="font-medium text-slate-700">&quot;{deletingSoal.judul}&quot;</span> akan dihapus permanen beserta seluruh submission dan indikator terkait. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setDeletingSoal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
