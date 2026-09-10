"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Database,
  FileText,
  Loader2,
  School,
  Search,
  X,
} from "lucide-react";

type KelasItem = {
  id: string;
  nama: string;
  angkatan: string;
};

type SoalItem = {
  id: string;
  judul: string;
  mataKuliah: string | null;
  kelasId?: string | null;
};

const DEBOUNCE_MS = 250;

function normalize(q: string): string {
  return q.toLocaleLowerCase("id").trim();
}

export default function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [soalList, setSoalList] = useState<SoalItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shortcut: "/" atau Cmd+K fokus ke pencarian
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Tutup dropdown saat berpindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Fetch data indeks (sekali saat mount + saat pertama kali fokus)
  const loadIndex = useCallback(async () => {
    if (kelasList.length > 0 && soalList.length > 0) return;
    setLoading(true);
    try {
      const [kelasRes, soalRes] = await Promise.all([
        fetch("/api/kelas", { cache: "no-store" }),
        fetch("/api/soal", { cache: "no-store" }),
      ]);

      if (kelasRes.ok) {
        const data = await kelasRes.json();
        if (Array.isArray(data)) setKelasList(data);
      }
      if (soalRes.ok) {
        const data = await soalRes.json();
        if (Array.isArray(data)) {
          setSoalList(
            data.map((s) => ({
              id: s.id,
              judul: s.judul,
              mataKuliah: s.mataKuliah ?? null,
              kelasId: s.kelasId ?? null,
            })),
          );
        }
      }
    } catch (err) {
      console.error("[GlobalSearch] Gagal memuat indeks:", err);
    } finally {
      setLoading(false);
    }
  }, [kelasList.length, soalList.length]);

  function handleFocus() {
    setOpen(true);
    if (!query.trim()) void loadIndex();
  }

  const q = normalize(query);

  const filteredKelas = q
    ? kelasList.filter((k) =>
        normalize(`${k.nama} ${k.angkatan}`).includes(q),
      )
    : [];

  const filteredSoal = q
    ? soalList.filter((s) =>
        normalize(`${s.judul} ${s.mataKuliah ?? ""}`).includes(q),
      )
    : [];

  const totalResults = filteredKelas.length + filteredSoal.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl min-w-0">
      <Search className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          void loadIndex();
        }}
        onFocus={handleFocus}
        placeholder="Cari soal atau kelas...  Tekan /"
        aria-expanded={open}
        aria-label="Cari soal atau kelas"
        className="
          w-full pl-9 sm:pl-10 pr-16 py-2 sm:py-2.5
          bg-[var(--bg)]
          border border-[var(--border)]
          rounded-xl
          text-xs sm:text-sm text-[var(--text)]
          placeholder:text-[var(--text-faint)]
          focus:outline-none focus:border-[var(--accent)]
          focus:ring-2 focus:ring-[var(--accent-soft)]
          transition-all
        "
      />

      {/* Kbd hint */}
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--border-soft)] border border-[var(--border)] text-[10px] font-bold text-[var(--text-faint)] select-none">
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Hapus pencarian"
            className="flex items-center transition-colors hover:text-[var(--text)]"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          "/"
        )}
      </kbd>

      {/* Dropdown hasil */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className="
              absolute left-0 right-0 top-full mt-2 z-50
              max-h-[min(70vh,26rem)]
              bg-[var(--bg-panel)]
              border border-[var(--border)]
              rounded-2xl
              shadow-xl shadow-slate-900/10
              overflow-y-auto
            "
          >
            {loading && kelasList.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                Memuat indeks...
              </div>
            ) : !q ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Ketik kata kunci untuk mencari soal atau kelas. <br />
                <span className="text-[var(--text-faint)]">
                  Atau tekan{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-soft)] border border-[var(--border)] font-bold">
                    /
                  </kbd>{" "}
                  kapan saja untuk fokus ke pencarian.
                </span>
              </div>
            ) : totalResults === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs font-bold text-[var(--text)] mb-1">
                  Tidak ada hasil untuk &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Coba kata kunci lain, atau buka menu untuk menjelajah.
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredKelas.length > 0 && (
                  <SearchGroup
                    icon={School}
                    label="Kelas"
                    count={filteredKelas.length}
                  >
                    {filteredKelas.map((k) => (
                      <SearchRow
                        key={k.id}
                        href={`/kelas/${k.id}`}
                        title={`${k.nama} · Angkatan ${k.angkatan}`}
                        subtitle={`Angkatan ${k.angkatan}`}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/kelas/${k.id}`);
                        }}
                      />
                    ))}
                  </SearchGroup>
                )}

                {filteredSoal.length > 0 && (
                  <SearchGroup
                    icon={Database}
                    label="Soal"
                    count={filteredSoal.length}
                  >
                    {filteredSoal.map((s) => (
                      <SearchRow
                        key={s.id}
                        href={`/output/${s.id}/daftar-submission`}
                        title={s.judul}
                        subtitle={s.mataKuliah ?? "Tanpa mata kuliah"}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/output/${s.id}/daftar-submission`);
                        }}
                      />
                    ))}
                  </SearchGroup>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SearchGroup({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: typeof School;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
        <Icon className="w-3.5 h-3.5" />
        {label}
        <span className="ml-auto text-[var(--text-faint)]/70">{count}</span>
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SearchRow({
  href,
  title,
  subtitle,
  onClick,
}: {
  href: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="
        flex items-center gap-3 px-2.5 py-2 rounded-xl
        text-[var(--text-muted)]
        hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]
        transition-colors
      "
    >
      <FileText className="w-4 h-4 shrink-0 text-[var(--text-faint)]" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--text)] truncate">
          {title}
        </span>
        <span className="block text-[11px] text-[var(--text-muted)] truncate">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}