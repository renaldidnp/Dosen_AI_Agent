"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Loader2,
  Plus,
  Trash,
  ArrowRight,
  Users,
  CalendarDays,
  Search,
  SearchX,
} from "lucide-react";

type FilterTab = "all" | "active" | "draft";

type Indikator = {
  id?: string;
  nama: string;
  bobot: number;
  rubrik: string;
  skorMax: number;
};

type Soal = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  googleFormUrl?: string | null;
  createdAt: Date | string;
  submission?: unknown[];
  indikator?: Indikator[];
};

export default function SoalGrid({
  initialSoalList,
}: {
  initialSoalList: Soal[];
}) {
  const [soalList, setSoalList] = useState<Soal[]>(initialSoalList);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingSoal, setDeletingSoal] = useState<Soal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Modal edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editJudul, setEditJudul] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editGoogleFormUrl, setEditGoogleFormUrl] = useState("");
  const [editIndikator, setEditIndikator] = useState<Indikator[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // STATUS
  // ============================================================

  function isDraft(soal: Soal) {
    return !soal.googleFormUrl?.trim();
  }

  // ============================================================
  // FILTER
  // ============================================================

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

  const activeCount = useMemo(
    () => soalList.filter((s) => !isDraft(s)).length,
    [soalList],
  );
  const draftCount = useMemo(
    () => soalList.filter((s) => isDraft(s)).length,
    [soalList],
  );

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: soalList.length },
    { key: "active", label: "Aktif", count: activeCount },
    { key: "draft", label: "Draft", count: draftCount },
  ];

  // ============================================================
  // CLOSE MENU WHEN CLICK OUTSIDE
  // ============================================================

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // EDIT
  // ============================================================

  async function openEditModal(soal: Soal) {
    setOpenMenuId(null);
    setEditingId(soal.id);
    setIsLoadingEdit(true);

    try {
      const res = await fetch(`/api/soal/${soal.id}`);

      if (!res.ok) {
        throw new Error("Gagal memuat data soal");
      }

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
          : [
              {
                nama: "",
                bobot: 0,
                rubrik: "",
                skorMax: 100,
              },
            ],
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
    setEditIndikator([
      ...editIndikator,
      {
        nama: "",
        bobot: 0,
        rubrik: "",
        skorMax: 100,
      },
    ]);
  }

  function removeEditIndikator(i: number) {
    setEditIndikator(editIndikator.filter((_, idx) => idx !== i));
  }

  function updateEditIndikator(
    i: number,
    field: keyof Indikator,
    value: string | number,
  ) {
    const next = [...editIndikator];

    // @ts-expect-error simple dynamic assignment
    next[i][field] = value;

    setEditIndikator(next);
  }

  // ============================================================
  // DELETE
  // ============================================================

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          judul: editJudul,
          deskripsi: editDeskripsi,
          googleFormUrl: editGoogleFormUrl,
          indikator: editIndikator,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan perubahan");
      }

      const updated = await res.json();

      setSoalList((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...updated,
              }
            : s,
        ),
      );

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
      const res = await fetch(`/api/soal/${deletingSoal.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus soal");
      }

      setSoalList((prev) => prev.filter((s) => s.id !== deletingSoal.id));

      setDeletingSoal(null);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus soal. Coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* ========================================================
          SEARCH & FILTER
      ======================================================== */}
      <div
        className="
          flex flex-col md:flex-row gap-3
          justify-between items-center
          bg-[var(--bg-panel)]
          border border-[var(--border)]
          p-3 rounded-2xl
          mb-4
          shadow-xs
          transition-colors duration-300
        "
      >
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[var(--text-faint)]" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari soal atau ujian..."
            className="
              block w-full pl-9 pr-3 py-2
              bg-[var(--bg)]
              border border-[var(--border)]
              rounded-xl
              focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]
              focus:border-[var(--accent)]
              text-sm text-[var(--text)]
              placeholder:text-[var(--text-faint)]
              transition-colors
            "
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-3.5 py-1.5 rounded-lg
                text-xs font-bold
                whitespace-nowrap
                transition-all
                ${
                  activeTab === tab.key
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)]"
                }
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          EMPTY SEARCH STATE
      ======================================================== */}
      {filteredSoalList.length === 0 ? (
        <div
          className="
            bg-[var(--bg-panel)]
            border border-dashed border-[var(--border-strong)]
            rounded-2xl
            p-10
            flex flex-col items-center justify-center text-center
            min-h-[280px]
          "
        >
          <div
            className="
              w-14 h-14 rounded-xl
              bg-[var(--accent-soft)]
              flex items-center justify-center
              text-[var(--accent-ink)]
              mb-3
            "
          >
            <SearchX className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-[var(--text)] mb-1">
            Tidak ada soal yang cocok
          </h3>

          <p className="text-[var(--text-muted)] max-w-sm text-sm">
            Coba ubah kata kunci pencarian atau pilih tab filter lain.
          </p>
        </div>
      ) : (
        /* ======================================================
           SOAL GRID
        ====================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSoalList.map((soal) => (
            <div
              key={soal.id}
              className="
                relative
                bg-[var(--bg-panel)]
                border border-[var(--border)]
                hover:border-[var(--accent-border-strong)]
                hover:shadow-md
                rounded-2xl
                p-5
                shadow-xs
                transition-all
                flex flex-col
              "
            >
              {/* HEADER CARD */}
              <div className="flex justify-between items-start mb-3">
                {/* Status pill */}
                {isDraft(soal) ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--border-soft)] text-[var(--text-muted)] text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)]" />
                    Draft
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-soft)] text-[var(--success-ink)] text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                    Aktif
                  </span>
                )}

                {/* ID + Menu */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--text-faint)] bg-[var(--border-soft)] px-2 py-0.5 rounded-md">
                    {soal.id.slice(0, 6).toUpperCase()}
                  </span>

                  <div
                    className="relative"
                    ref={openMenuId === soal.id ? menuRef : null}
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === soal.id ? null : soal.id)
                      }
                      className="
                        text-[var(--text-faint)]
                        hover:text-[var(--text)]
                        hover:bg-[var(--accent-soft)]
                        transition-colors
                        p-1.5 rounded-lg
                      "
                      aria-label="Menu soal"
                    >
                      <MoreVertical className="w-[18px] h-[18px]" />
                    </button>

                    {openMenuId === soal.id && (
                      <div
                        className="
                          absolute right-0 top-9 w-44 z-30
                          bg-[var(--bg-panel)]
                          border border-[var(--border)]
                          rounded-xl
                          shadow-lg
                          py-1.5
                        "
                      >
                        <button
                          onClick={() => openEditModal(soal)}
                          className="
                            w-full text-left px-3.5 py-2
                            flex items-center gap-2
                            text-xs font-medium text-[var(--text)]
                            hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]
                            transition-colors
                          "
                        >
                          <Pencil className="w-4 h-4 text-[var(--accent)]" />
                          Edit
                        </button>

                        <button
                          onClick={() => openDeleteModal(soal)}
                          className="
                            w-full text-left px-3.5 py-2
                            flex items-center gap-2
                            text-xs font-medium text-[var(--danger-text)]
                            hover:bg-[var(--danger-soft)]
                            transition-colors
                          "
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TITLE */}
              <h3 className="font-heading text-base font-bold text-[var(--text)] leading-snug line-clamp-2">
                {soal.judul}
              </h3>

              <p className="text-xs text-[var(--text-muted)] mt-1.5 mb-4 line-clamp-2 leading-relaxed">
                {soal.deskripsi?.trim() ? soal.deskripsi : "Tidak ada deskripsi"}
              </p>

              {/* META */}
              <div className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--border-soft)] grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-[var(--text-faint)] uppercase flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Dibuat
                  </span>
                  <span className="text-xs font-semibold text-[var(--text)]">
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
                  <span className="text-[10px] font-medium text-[var(--text-faint)] uppercase flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Submisi
                  </span>
                  <span className="text-xs font-semibold text-[var(--text)]">
                    {soal.submission?.length || 0} Mahasiswa
                  </span>
                </div>
              </div>

              {/* RESULT BUTTON */}
              <div className="mt-auto pt-3 border-t border-[var(--border-soft)]">
                <Link
                  href={`/output/${soal.id}/daftar-submission`}
                  className="
                    w-full inline-flex items-center justify-center gap-1.5
                    py-2.5 px-3
                    bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                    text-[var(--accent-fg)]
                    rounded-xl
                    text-xs font-bold
                    shadow-xs
                    transition-all
                  "
                >
                  <span>Lihat Hasil &amp; Evaluasi</span>
                  <ArrowRight className="w-[15px] h-[15px]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL EDIT
      ======================================================== */}
      {editingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            className="
              bg-[var(--bg-panel)]
              border border-[var(--border-soft)]
              rounded-2xl
              shadow-2xl
              w-full max-w-2xl
              p-6
              max-h-[90vh] overflow-y-auto
            "
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border-soft)] pb-3">
              <h3 className="font-heading text-base font-bold text-[var(--text)]">
                Edit Soal
              </h3>

              <button
                onClick={closeEditModal}
                className="text-[var(--text-faint)] hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEdit ? (
              <div className="flex items-center justify-center py-16 text-[var(--text-muted)] gap-2 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                Memuat data soal...
              </div>
            ) : (
              <>
                {/* Basic Information */}
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                      Judul Soal
                    </label>
                    <input
                      type="text"
                      value={editJudul}
                      onChange={(e) => setEditJudul(e.target.value)}
                      className="
                        w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl
                        px-3 py-2 text-sm text-[var(--text)]
                        placeholder:text-[var(--text-faint)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]
                        focus:border-[var(--accent)]
                      "
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                      Deskripsi Soal
                    </label>
                    <textarea
                      value={editDeskripsi}
                      onChange={(e) => setEditDeskripsi(e.target.value)}
                      rows={3}
                      className="
                        w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl
                        px-3 py-2 text-sm text-[var(--text)]
                        placeholder:text-[var(--text-faint)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]
                        focus:border-[var(--accent)]
                      "
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                      Link Google Form
                    </label>
                    <input
                      type="text"
                      value={editGoogleFormUrl}
                      onChange={(e) => setEditGoogleFormUrl(e.target.value)}
                      className="
                        w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl
                        px-3 py-2 text-sm text-[var(--text)]
                        placeholder:text-[var(--text-faint)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]
                        focus:border-[var(--accent)]
                      "
                    />
                  </div>
                </div>

                {/* Indikator */}
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--text-muted)]">
                    Indikator Penilaian
                  </h4>

                  <button
                    onClick={addEditIndikator}
                    className="
                      text-[var(--accent-ink)] text-xs font-bold
                      flex items-center gap-1
                      hover:text-[var(--accent-hover)]
                      transition-colors
                    "
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah indikator
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {editIndikator.map((ind, i) => (
                    <div
                      key={ind.id ?? i}
                      className="border border-[var(--border)] bg-[var(--bg)] p-3 rounded-xl space-y-2 relative"
                    >
                      {editIndikator.length > 1 && (
                        <button
                          onClick={() => removeEditIndikator(i)}
                          className="absolute top-2 right-2 text-[var(--text-faint)] hover:text-[var(--danger-text)] transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}

                      <input
                        type="text"
                        placeholder="Nama indikator"
                        value={ind.nama}
                        onChange={(e) => updateEditIndikator(i, "nama", e.target.value)}
                        className="
                          w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg
                          px-3 py-2 text-sm text-[var(--text)]
                          placeholder:text-[var(--text-faint)]
                          focus:outline-none focus:ring-1 focus:ring-[var(--accent)]
                        "
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Bobot (%)"
                          value={ind.bobot}
                          onChange={(e) =>
                            updateEditIndikator(i, "bobot", Number(e.target.value))
                          }
                          className="
                            w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg
                            px-3 py-2 text-sm text-[var(--text)]
                            placeholder:text-[var(--text-faint)]
                            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]
                          "
                        />

                        <input
                          type="number"
                          placeholder="Skor maksimal"
                          value={ind.skorMax}
                          onChange={(e) =>
                            updateEditIndikator(i, "skorMax", Number(e.target.value))
                          }
                          className="
                            w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg
                            px-3 py-2 text-sm text-[var(--text)]
                            placeholder:text-[var(--text-faint)]
                            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]
                          "
                        />
                      </div>

                      <textarea
                        placeholder="Deskripsi rubrik penilaian"
                        value={ind.rubrik}
                        onChange={(e) => updateEditIndikator(i, "rubrik", e.target.value)}
                        rows={2}
                        className="
                          w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg
                          px-3 py-2 text-sm text-[var(--text)]
                          placeholder:text-[var(--text-faint)]
                          focus:outline-none focus:ring-1 focus:ring-[var(--accent)]
                        "
                      />
                    </div>
                  ))}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-soft)]">
                  <button
                    onClick={closeEditModal}
                    className="
                      px-4 py-2 text-xs font-bold
                      text-[var(--text-muted)]
                      hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
                      rounded-xl transition-colors
                    "
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editJudul.trim()}
                    className="
                      px-5 py-2.5 text-xs font-bold
                      text-[var(--accent-fg)]
                      bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                      rounded-xl transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed
                      flex items-center gap-2
                      shadow-xs
                    "
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Simpan Rubrik AI
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}
      {deletingSoal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="
              bg-[var(--bg-panel)]
              border border-[var(--danger-border)]
              rounded-2xl
              shadow-2xl
              w-full max-w-md
              p-6
            "
          >
            <h3 className="font-heading text-base font-bold text-[var(--danger-text)] mb-2">
              Hapus Soal?
            </h3>

            <p className="text-sm text-[var(--text-muted)] mb-6">
              Soal{" "}
              <span className="font-semibold text-[var(--text)]">
                &quot;{deletingSoal.judul}&quot;
              </span>{" "}
              akan dihapus permanen beserta seluruh submission dan indikator terkait.
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingSoal(null)}
                className="
                  px-4 py-2 text-xs font-bold
                  text-[var(--text-muted)]
                  hover:text-[var(--text)] hover:bg-[var(--accent-soft)]
                  rounded-xl transition-colors
                "
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="
                  px-4 py-2 text-xs font-bold
                  text-white
                  bg-[var(--danger-text)] hover:opacity-90
                  rounded-xl transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center gap-2
                "
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