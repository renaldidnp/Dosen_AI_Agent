"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, X, Loader2, Plus, Trash, Database, ArrowRight, Users, CalendarDays, Search, SearchX } from "lucide-react";

type FilterTab = "all" | "active" | "draft";

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

  // pencarian & filter tab
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Sebuah soal dianggap "draft" jika belum punya link Google Form (belum dipublikasikan)
  function isDraft(soal: Soal) {
    return !soal.googleFormUrl?.trim();
  }

  const filteredSoalList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return soalList.filter((soal) => {
      const matchQuery =
        !q ||
        soal.judul.toLowerCase().includes(q) ||
        (soal.deskripsi ?? "").toLowerCase().includes(q);

      const matchTab =
        activeTab === "all" ||
        (activeTab === "active" && !isDraft(soal)) ||
        (activeTab === "draft" && isDraft(soal));

      return matchQuery && matchTab;
    });
  }, [soalList, searchQuery, activeTab]);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
  ];

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
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111118]/70 backdrop-blur-xl border border-[#00f0ff]/10 p-3 rounded-[4px] mb-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#8b949e]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari soal atau ujian..."
            className="block w-full pl-9 pr-3 py-2 bg-black/40 border border-[#00f0ff]/20 rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] focus:border-[#00f0ff] text-sm text-white placeholder-[#8b949e] font-mono"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-[2px] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap border transition-colors ${
                activeTab === tab.key
                  ? "bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/50"
                  : "bg-transparent text-[#8b949e] border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredSoalList.length === 0 ? (
        <div className="bg-[#111118]/50 border border-[#00f0ff]/10 border-dashed rounded-[4px] p-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-[4px] flex items-center justify-center text-[#00f0ff]/60 mb-3">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Tidak ada soal yang cocok</h3>
          <p className="text-[#8b949e] max-w-sm text-sm">Coba ubah kata kunci pencarian atau pilih tab filter lain.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSoalList.map((soal) => (
          <div
            key={soal.id}
            className="relative bg-gradient-to-b from-[#1c1c28]/80 to-[#111118]/90 border border-[#00f0ff]/15 hover:border-[#00f0ff]/40 rounded-[4px] p-5 transition-colors flex flex-col before:content-[''] before:absolute before:top-[-1px] before:left-[-1px] before:w-2 before:h-2 before:border-t-2 before:border-l-2 before:border-[#00f0ff]/70 after:content-[''] after:absolute after:bottom-[-1px] after:right-[-1px] after:w-2 after:h-2 after:border-b-2 after:border-r-2 after:border-[#00f0ff]/70"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {isDraft(soal) ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="text-[#8b949e] text-[10px] font-mono uppercase tracking-wider">Draft</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#5bffa1]" style={{ boxShadow: "0 0 5px rgba(91,255,161,0.8)" }} />
                    <span className="text-[#5bffa1] text-[10px] font-mono uppercase tracking-wider">Aktif</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#8b949e]">ID: {soal.id.slice(0, 6).toUpperCase()}</span>
                <div className="relative" ref={openMenuId === soal.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === soal.id ? null : soal.id)}
                    className="text-[#8b949e] hover:text-[#00f0ff] transition-colors p-1 -mr-1 rounded-[2px] hover:bg-white/5"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === soal.id && (
                    <div className="absolute right-0 top-7 w-40 bg-[#111118] border border-[#00f0ff]/20 rounded-[4px] shadow-xl py-1 z-10">
                      <button
                        onClick={() => openEditModal(soal)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e4e1e9] hover:bg-white/5 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-[#8b949e]" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(soal)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h2 className="font-semibold text-lg text-white mb-1 leading-tight line-clamp-2">{soal.judul}</h2>
            <p className="font-mono text-xs text-[#8b949e] mb-4 line-clamp-1">
              {soal.deskripsi?.trim() ? soal.deskripsi : "Tidak ada deskripsi"}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 border-t border-white/5 pt-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-[#8b949e] uppercase flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Dibuat
                </span>
                <span className="text-xs font-mono text-white">
                  {soal.createdAt
                    ? new Date(soal.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-[#8b949e] uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" /> Submissions
                </span>
                <span className="text-xs font-mono text-white">{soal.submission?.length || 0}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5">
              <Link
                href={`/output/${soal.id}/daftar-submission`}
                className="w-full inline-flex items-center justify-center gap-2 py-2 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 hover:border-[#00f0ff] rounded-[2px] font-mono text-[10px] uppercase tracking-wider transition-all"
              >
                <Database className="w-3.5 h-3.5" />
                Lihat Hasil
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal Edit */}
      {editingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#00f0ff]/20 rounded-[4px] shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="font-mono text-sm text-[#00f0ff] uppercase tracking-widest">Edit Soal</h3>
              <button onClick={closeEditModal} className="text-[#8b949e] hover:text-white p-1 rounded-[2px] hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEdit ? (
              <div className="flex items-center justify-center py-16 text-[#8b949e] gap-2 font-mono text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-[#00f0ff]" />
                Memuat data soal...
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-1.5">Judul Soal</label>
                    <input
                      type="text"
                      value={editJudul}
                      onChange={(e) => setEditJudul(e.target.value)}
                      className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00f0ff] focus:border-[#00f0ff]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-1.5">Deskripsi Soal</label>
                    <textarea
                      value={editDeskripsi}
                      onChange={(e) => setEditDeskripsi(e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00f0ff] focus:border-[#00f0ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-1.5">Link Google Form</label>
                    <input
                      type="text"
                      value={editGoogleFormUrl}
                      onChange={(e) => setEditGoogleFormUrl(e.target.value)}
                      className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00f0ff] focus:border-[#00f0ff]"
                    />
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#8b949e]">Indikator Penilaian</h4>
                  <button
                    onClick={addEditIndikator}
                    className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah indikator
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {editIndikator.map((ind, i) => (
                    <div key={ind.id ?? i} className="border border-white/10 bg-black/20 p-3 rounded-[4px] space-y-2 relative">
                      {editIndikator.length > 1 && (
                        <button
                          onClick={() => removeEditIndikator(i)}
                          className="absolute top-2 right-2 text-[#8b949e] hover:text-[#ffb4ab] transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Nama indikator"
                        value={ind.nama}
                        onChange={(e) => updateEditIndikator(i, "nama", e.target.value)}
                        className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Bobot (%)"
                          value={ind.bobot}
                          onChange={(e) => updateEditIndikator(i, "bobot", Number(e.target.value))}
                          className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
                        />
                        <input
                          type="number"
                          placeholder="Skor maksimal"
                          value={ind.skorMax}
                          onChange={(e) => updateEditIndikator(i, "skorMax", Number(e.target.value))}
                          className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
                        />
                      </div>
                      <textarea
                        placeholder="Deskripsi rubrik penilaian"
                        value={ind.rubrik}
                        onChange={(e) => updateEditIndikator(i, "rubrik", e.target.value)}
                        rows={2}
                        className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#8b949e] hover:bg-white/5 rounded-[2px] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editJudul.trim()}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/50 hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] rounded-[2px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#ffb4ab]/30 rounded-[4px] shadow-2xl w-full max-w-md p-6">
            <h3 className="font-mono text-sm text-[#ffb4ab] uppercase tracking-widest mb-2">Hapus Soal?</h3>
            <p className="text-sm text-[#8b949e] mb-6">
              Soal <span className="font-medium text-white">&quot;{deletingSoal.judul}&quot;</span> akan dihapus permanen beserta seluruh
              submission dan indikator terkait. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingSoal(null)}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#8b949e] hover:bg-white/5 rounded-[2px] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#ffb4ab] bg-[#ffb4ab]/10 border border-[#ffb4ab]/50 hover:bg-[#ffb4ab]/20 rounded-[2px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}