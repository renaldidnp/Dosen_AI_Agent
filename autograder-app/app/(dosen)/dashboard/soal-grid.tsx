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
  Database,
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

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
  ];

  // ============================================================
  // CLOSE MENU WHEN CLICK OUTSIDE
  // ============================================================

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
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
    setEditIndikator(
      editIndikator.filter((_, idx) => idx !== i),
    );
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
      const res = await fetch(
        `/api/soal/${deletingSoal.id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error("Gagal menghapus soal");
      }

      setSoalList((prev) =>
        prev.filter((s) => s.id !== deletingSoal.id),
      );

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
          flex flex-col md:flex-row
          gap-4
          justify-between
          items-center
          bg-[var(--bg-panel-translucent)]
          backdrop-blur-xl
          border border-[var(--border)]
          p-3
          rounded-[4px]
          mb-4
          transition-colors duration-300
        "
      >
        {/* Search */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Cari soal atau ujian..."
            className="
              block w-full
              pl-9 pr-3 py-2
              bg-[var(--bg)]
              border border-[var(--border)]
              rounded-[2px]
              focus:outline-none
              focus:ring-1
              focus:ring-[var(--accent)]
              focus:border-[var(--accent)]
              text-sm
              text-[var(--text)]
              placeholder:text-[var(--text-faint)]
              font-mono
              transition-colors
            "
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(tab.key)
              }
              className={`
                px-3 py-1.5
                rounded-[2px]
                font-mono
                text-[10px]
                uppercase
                tracking-wider
                whitespace-nowrap
                border
                transition-all
                ${
                  activeTab === tab.key
                    ? `
                      bg-[var(--accent-soft)]
                      text-[var(--accent-ink)]
                      border-[var(--accent-border)]
                    `
                    : `
                      bg-transparent
                      text-[var(--text-muted)]
                      border-[var(--border)]
                      hover:border-[var(--border-strong)]
                      hover:text-[var(--text)]
                    `
                }
              `}
            >
              {tab.label}
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
            bg-[var(--bg-panel-translucent)]
            backdrop-blur-xl
            border border-[var(--border)]
            border-dashed
            rounded-[4px]
            p-10
            flex flex-col
            items-center
            justify-center
            text-center
            min-h-[280px]
          "
        >
          <div
            className="
              w-14 h-14
              bg-[var(--accent-soft)]
              border border-[var(--accent-border)]
              rounded-[4px]
              flex items-center
              justify-center
              text-[var(--accent-ink)]
              mb-3
            "
          >
            <SearchX className="w-6 h-6" />
          </div>

          <h3 className="text-base font-semibold text-[var(--text)] mb-1">
            Tidak ada soal yang cocok
          </h3>

          <p className="text-[var(--text-muted)] max-w-sm text-sm">
            Coba ubah kata kunci pencarian atau pilih
            tab filter lain.
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
                rounded-[4px]
                p-5
                transition-all
                flex flex-col
                overflow-visible

                before:content-['']
                before:absolute
                before:top-[-1px]
                before:left-[-1px]
                before:w-2
                before:h-2
                before:border-t-2
                before:border-l-2
                before:border-[var(--accent-border)]

                after:content-['']
                after:absolute
                after:bottom-[-1px]
                after:right-[-1px]
                after:w-2
                after:h-2
                after:border-b-2
                after:border-r-2
                after:border-[var(--accent-border)]
              "
            >
              {/* =================================================
                  HEADER CARD
              ================================================= */}
              <div className="flex justify-between items-start mb-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {isDraft(soal) ? (
                    <>
                      <span
                        className="
                          w-2 h-2
                          rounded-full
                          bg-[var(--text-faint)]
                        "
                      />

                      <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-wider">
                        Draft
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className="
                          w-2 h-2
                          rounded-full
                          bg-[var(--accent)]
                          animate-pulse
                        "
                        style={{
                          boxShadow:
                            "0 0 6px var(--accent)",
                        }}
                      />

                      <span className="text-[var(--accent-ink)] text-[10px] font-mono uppercase tracking-wider">
                        Aktif
                      </span>
                    </>
                  )}
                </div>

                {/* ID + Menu */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-faint)]">
                    ID:{" "}
                    {soal.id
                      .slice(0, 6)
                      .toUpperCase()}
                  </span>

                  <div
                    className="relative"
                    ref={
                      openMenuId === soal.id
                        ? menuRef
                        : null
                    }
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === soal.id
                            ? null
                            : soal.id,
                        )
                      }
                      className="
                        text-[var(--text-muted)]
                        hover:text-[var(--accent-ink)]
                        transition-colors
                        p-1
                        -mr-1
                        rounded-[2px]
                        hover:bg-[var(--accent-soft)]
                      "
                      aria-label="Menu soal"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown */}
                    {openMenuId === soal.id && (
                      <div
                        className="
                          absolute
                          right-0
                          top-7
                          w-40
                          bg-[var(--bg-panel)]
                          border border-[var(--border)]
                          rounded-[4px]
                          shadow-[var(--glow-shadow)]
                          py-1
                          z-50
                          backdrop-blur-xl
                        "
                      >
                        <button
                          onClick={() =>
                            openEditModal(soal)
                          }
                          className="
                            w-full
                            flex items-center gap-2
                            px-3 py-2
                            text-sm
                            text-[var(--text)]
                            hover:bg-[var(--accent-soft)]
                            hover:text-[var(--accent-ink)]
                            transition-colors
                          "
                        >
                          <Pencil className="w-4 h-4 text-[var(--text-muted)]" />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            openDeleteModal(soal)
                          }
                          className="
                            w-full
                            flex items-center gap-2
                            px-3 py-2
                            text-sm
                            text-[var(--danger-text)]
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

              {/* =================================================
                  TITLE
              ================================================= */}
              <h2 className="font-semibold text-lg text-[var(--text)] mb-1 leading-tight line-clamp-2">
                {soal.judul}
              </h2>

              <p className="font-mono text-xs text-[var(--text-muted)] mb-4 line-clamp-1">
                {soal.deskripsi?.trim()
                  ? soal.deskripsi
                  : "Tidak ada deskripsi"}
              </p>

              {/* =================================================
                  META
              ================================================= */}
              <div
                className="
                  grid grid-cols-2
                  gap-2
                  mb-4
                  border-t border-[var(--border-soft)]
                  pt-3
                "
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Dibuat
                  </span>

                  <span className="text-xs font-mono text-[var(--text)]">
                    {soal.createdAt
                      ? new Date(
                          soal.createdAt,
                        ).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Submissions
                  </span>

                  <span className="text-xs font-mono text-[var(--text)]">
                    {soal.submission?.length || 0}
                  </span>
                </div>
              </div>

              {/* =================================================
                  RESULT BUTTON
              ================================================= */}
              <div className="mt-auto pt-4 border-t border-[var(--border-soft)]">
                <Link
                  href={`/output/${soal.id}/daftar-submission`}
                  className="
                    w-full
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    py-2

                    bg-[var(--accent-soft)]
                    hover:bg-[var(--accent)]

                    text-[var(--accent-ink)]
                    hover:text-[var(--accent-fg)]

                    border
                    border-[var(--accent-border)]
                    hover:border-[var(--accent)]

                    rounded-[2px]
                    font-mono
                    text-[10px]
                    uppercase
                    tracking-wider
                    transition-all
                  "
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

      {/* ========================================================
          MODAL EDIT
      ======================================================== */}
      {editingId && (
        <div
          className="
            fixed inset-0
            bg-black/60
            backdrop-blur-sm
            flex items-center justify-center
            z-50
            p-4
          "
        >
          <div
            className="
              bg-[var(--bg-panel)]
              border border-[var(--border)]
              rounded-[4px]
              shadow-[var(--glow-shadow)]
              w-full
              max-w-2xl
              p-6
              max-h-[90vh]
              overflow-y-auto
            "
          >
            {/* Modal Header */}
            <div
              className="
                flex justify-between
                items-center
                mb-4
                border-b
                border-[var(--border-soft)]
                pb-3
              "
            >
              <h3 className="font-mono text-sm text-[var(--accent-ink)] uppercase tracking-widest">
                Edit Soal
              </h3>

              <button
                onClick={closeEditModal}
                className="
                  text-[var(--text-muted)]
                  hover:text-[var(--text)]
                  p-1
                  rounded-[2px]
                  hover:bg-[var(--accent-soft)]
                  transition-colors
                "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading */}
            {isLoadingEdit ? (
              <div className="flex items-center justify-center py-16 text-[var(--text-muted)] gap-2 font-mono text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                Memuat data soal...
              </div>
            ) : (
              <>
                {/* Basic Information */}
                <div className="space-y-3 mb-5">
                  {/* Judul */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Judul Soal
                    </label>

                    <input
                      type="text"
                      value={editJudul}
                      onChange={(e) =>
                        setEditJudul(e.target.value)
                      }
                      className="
                        w-full
                        bg-[var(--bg)]
                        border border-[var(--border)]
                        rounded-[2px]
                        px-3 py-2
                        text-sm
                        text-[var(--text)]
                        placeholder:text-[var(--text-faint)]
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[var(--accent)]
                        focus:border-[var(--accent)]
                      "
                      autoFocus
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Deskripsi Soal
                    </label>

                    <textarea
                      value={editDeskripsi}
                      onChange={(e) =>
                        setEditDeskripsi(e.target.value)
                      }
                      rows={3}
                      className="
                        w-full
                        bg-[var(--bg)]
                        border border-[var(--border)]
                        rounded-[2px]
                        px-3 py-2
                        text-sm
                        text-[var(--text)]
                        placeholder:text-[var(--text-faint)]
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[var(--accent)]
                        focus:border-[var(--accent)]
                      "
                    />
                  </div>

                  {/* Google Form */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                      Link Google Form
                    </label>

                    <input
                      type="text"
                      value={editGoogleFormUrl}
                      onChange={(e) =>
                        setEditGoogleFormUrl(
                          e.target.value,
                        )
                      }
                      className="
                        w-full
                        bg-[var(--bg)]
                        border border-[var(--border)]
                        rounded-[2px]
                        px-3 py-2
                        text-sm
                        text-[var(--text)]
                        placeholder:text-[var(--text-faint)]
                        focus:outline-none
                        focus:ring-1
                        focus:ring-[var(--accent)]
                        focus:border-[var(--accent)]
                      "
                    />
                  </div>
                </div>

                {/* Indikator */}
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Indikator Penilaian
                  </h4>

                  <button
                    onClick={addEditIndikator}
                    className="
                      text-[var(--accent-ink)]
                      text-xs
                      font-mono
                      uppercase
                      tracking-wider
                      flex
                      items-center
                      gap-1
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
                      className="
                        border
                        border-[var(--border)]
                        bg-[var(--bg)]
                        p-3
                        rounded-[4px]
                        space-y-2
                        relative
                      "
                    >
                      {editIndikator.length > 1 && (
                        <button
                          onClick={() =>
                            removeEditIndikator(i)
                          }
                          className="
                            absolute
                            top-2 right-2
                            text-[var(--text-muted)]
                            hover:text-[var(--danger-text)]
                            transition-colors
                          "
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}

                      <input
                        type="text"
                        placeholder="Nama indikator"
                        value={ind.nama}
                        onChange={(e) =>
                          updateEditIndikator(
                            i,
                            "nama",
                            e.target.value,
                          )
                        }
                        className="
                          w-full
                          bg-[var(--bg-panel)]
                          border border-[var(--border)]
                          rounded-[2px]
                          px-3 py-2
                          text-sm
                          text-[var(--text)]
                          placeholder:text-[var(--text-faint)]
                          focus:outline-none
                          focus:ring-1
                          focus:ring-[var(--accent)]
                        "
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Bobot (%)"
                          value={ind.bobot}
                          onChange={(e) =>
                            updateEditIndikator(
                              i,
                              "bobot",
                              Number(e.target.value),
                            )
                          }
                          className="
                            w-full
                            bg-[var(--bg-panel)]
                            border border-[var(--border)]
                            rounded-[2px]
                            px-3 py-2
                            text-sm
                            text-[var(--text)]
                            placeholder:text-[var(--text-faint)]
                            focus:outline-none
                            focus:ring-1
                            focus:ring-[var(--accent)]
                          "
                        />

                        <input
                          type="number"
                          placeholder="Skor maksimal"
                          value={ind.skorMax}
                          onChange={(e) =>
                            updateEditIndikator(
                              i,
                              "skorMax",
                              Number(e.target.value),
                            )
                          }
                          className="
                            w-full
                            bg-[var(--bg-panel)]
                            border border-[var(--border)]
                            rounded-[2px]
                            px-3 py-2
                            text-sm
                            text-[var(--text)]
                            placeholder:text-[var(--text-faint)]
                            focus:outline-none
                            focus:ring-1
                            focus:ring-[var(--accent)]
                          "
                        />
                      </div>

                      <textarea
                        placeholder="Deskripsi rubrik penilaian"
                        value={ind.rubrik}
                        onChange={(e) =>
                          updateEditIndikator(
                            i,
                            "rubrik",
                            e.target.value,
                          )
                        }
                        rows={2}
                        className="
                          w-full
                          bg-[var(--bg-panel)]
                          border border-[var(--border)]
                          rounded-[2px]
                          px-3 py-2
                          text-sm
                          text-[var(--text)]
                          placeholder:text-[var(--text-faint)]
                          focus:outline-none
                          focus:ring-1
                          focus:ring-[var(--accent)]
                        "
                      />
                    </div>
                  ))}
                </div>

                {/* Modal Actions */}
                <div
                  className="
                    flex justify-end
                    gap-2
                    pt-4
                    border-t
                    border-[var(--border-soft)]
                  "
                >
                  <button
                    onClick={closeEditModal}
                    className="
                      px-4 py-2
                      text-xs
                      font-mono
                      uppercase
                      tracking-wider
                      text-[var(--text-muted)]
                      hover:text-[var(--text)]
                      hover:bg-[var(--accent-soft)]
                      rounded-[2px]
                      transition-colors
                    "
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      isSaving || !editJudul.trim()
                    }
                    className="
                      px-4 py-2
                      text-xs
                      font-mono
                      uppercase
                      tracking-wider
                      text-[var(--accent-ink)]
                      bg-[var(--accent-soft)]
                      border
                      border-[var(--accent-border)]
                      hover:bg-[var(--accent)]
                      hover:text-[var(--accent-fg)]
                      hover:border-[var(--accent)]
                      rounded-[2px]
                      transition-all
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      flex
                      items-center
                      gap-2
                    "
                  >
                    {isSaving && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}

                    Simpan Perubahan
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
        <div
          className="
            fixed inset-0
            bg-black/60
            backdrop-blur-sm
            flex items-center justify-center
            z-50
            p-4
          "
        >
          <div
            className="
              bg-[var(--bg-panel)]
              border border-[var(--danger-border)]
              rounded-[4px]
              shadow-[var(--glow-shadow)]
              w-full
              max-w-md
              p-6
            "
          >
            <h3 className="font-mono text-sm text-[var(--danger-text)] uppercase tracking-widest mb-2">
              Hapus Soal?
            </h3>

            <p className="text-sm text-[var(--text-muted)] mb-6">
              Soal{" "}
              <span className="font-medium text-[var(--text)]">
                &quot;{deletingSoal.judul}&quot;
              </span>{" "}
              akan dihapus permanen beserta seluruh
              submission dan indikator terkait. Tindakan
              ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setDeletingSoal(null)
                }
                className="
                  px-4 py-2
                  text-xs
                  font-mono
                  uppercase
                  tracking-wider
                  text-[var(--text-muted)]
                  hover:text-[var(--text)]
                  hover:bg-[var(--accent-soft)]
                  rounded-[2px]
                  transition-colors
                "
              >
                Batal
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="
                  px-4 py-2
                  text-xs
                  font-mono
                  uppercase
                  tracking-wider
                  text-[var(--danger-text)]
                  bg-[var(--danger-soft)]
                  border
                  border-[var(--danger-border)]
                  hover:bg-[var(--danger-text)]
                  hover:text-[var(--bg)]
                  rounded-[2px]
                  transition-all
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  flex
                  items-center
                  gap-2
                "
              >
                {isDeleting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}

                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}