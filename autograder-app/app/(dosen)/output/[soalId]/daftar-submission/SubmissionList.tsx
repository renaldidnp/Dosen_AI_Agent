"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FolderOpenDot, X } from "lucide-react";

type IndikatorReview = {
    keputusan: "setuju" | "koreksi";
    skorAwal: number;
    skorAkhir: number;
    alasan: string;
};

type IndikatorSkor = {
    indikatorId: string;
    nama: string;
    skor: number;
    catatan: string;
    review?: IndikatorReview | null;
};

type HasilKoreksi = {
    skorTotal: number;
    feedback: string;
    direviewOleh?: string | null;
    reviewAktif?: boolean;
    skorPerIndikator?: IndikatorSkor[];
} | null;

export type SubmissionRow = {
    id: string;
    namaMahasiswa: string;
    nim: string;
    emailMahasiswa: string;
    status: string;
    driveFileId: string;
    driveFileUrl: string;
    hasilKoreksi: HasilKoreksi;
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
    diterima: {
        label: "Diterima",
        className: "bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]",
    },
    dinilai: {
        label: "Dinilai",
        className: "bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--success-border)]",
    },
    revisi: {
        label: "Revisi",
        className: "bg-[var(--warning-soft)] text-[var(--warning-ink)] border-[var(--warning-border)]",
    },
    ditolak: {
        label: "Ditolak",
        className: "bg-[var(--danger-soft)] text-[var(--danger-text)] border-[var(--danger-border)]",
    },
};

function statusStyle(status: string) {
    return (
        STATUS_STYLE[status?.toLowerCase()] ?? {
            label: status || "Tidak diketahui",
            className: "bg-[var(--border-soft)] text-[var(--text-muted)] border-[var(--border)]",
        }
    );
}

function drivePreviewUrl(driveFileId: string) {
    return `https://drive.google.com/file/d/${driveFileId}/preview`;
}

export default function SubmissionList({ submissions }: { submissions: SubmissionRow[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const active = submissions.find((s) => s.id === activeId) ?? null;

    // Tutup modal dengan tombol Escape
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setActiveId(null);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <>
            {/* =========================================================
          COMPACT ROWS
      ========================================================= */}
            <div className="flex flex-col gap-3">
                {submissions.map((s) => {
                    const style = statusStyle(s.status);

                    return (
                        <div
                            key={s.id}
                            className="
                bg-[var(--bg-panel)]
                border border-[var(--border)]
                hover:border-[var(--accent-border-strong)]
                rounded-2xl
                shadow-xs
                px-5 py-4
                flex items-center gap-4
                transition-all
              "
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-heading text-sm font-bold text-[var(--text)] truncate">
                                        {s.namaMahasiswa}
                                    </h3>
                                    {s.hasilKoreksi?.direviewOleh && (
                                        <span
                                            title={`${s.hasilKoreksi.direviewOleh}`}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]"
                                        >
                                            &#10003; Direview
                                        </span>
                                    )}
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${style.className}`}
                                    >
                                        {style.label}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                                    {s.nim} &middot; {s.emailMahasiswa}
                                </p>
                            </div>

                            <div className="hidden sm:flex flex-col items-end shrink-0 mr-1">
                                <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">
                                    Skor
                                </span>
                                <span className="text-lg font-extrabold text-[var(--text)]">
                                    {s.hasilKoreksi?.skorTotal ?? "-"}
                                </span>
                            </div>

                            <button
                                onClick={() => setActiveId(s.id)}
                                title="Lihat jawaban di Drive"
                                aria-label={`Lihat jawaban ${s.namaMahasiswa}`}
                                className="
                  shrink-0 w-11 h-11 rounded-xl
                  bg-[var(--accent-soft)] border border-[var(--accent-border)]
                  text-[var(--accent-ink)]
                  flex items-center justify-center
                  hover:bg-[var(--accent)] hover:text-[var(--accent-fg)]
                  transition-all
                "
                            >
                                <FolderOpenDot className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* =========================================================
          MODAL: PREVIEW JAWABAN
      ========================================================= */}
            {active && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setActiveId(null)}
                >
                    <div
                        className="
              bg-[var(--bg-panel)]
              rounded-2xl
              shadow-2xl
              w-full max-w-3xl
              max-h-[90vh]
              flex flex-col
              overflow-hidden
            "
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-soft)]">
                            <div className="min-w-0">
                                <h3 className="font-heading text-sm font-bold text-[var(--text)] truncate">
                                    {active.namaMahasiswa}
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] truncate">
                                    {active.nim} &middot; {active.emailMahasiswa}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={active.driveFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    bg-[var(--accent-soft)] border border-[var(--accent-border)]
                    text-[var(--accent-ink)] text-xs font-bold
                    hover:bg-[var(--accent)] hover:text-[var(--accent-fg)]
                    transition-all
                  "
                                >
                                    Buka di Drive
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                <button
                                    onClick={() => setActiveId(null)}
                                    className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition-colors"
                                    aria-label="Tutup"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Skor & feedback */}
                        {active.hasilKoreksi && (
                            <div className="px-5 py-3 border-b border-[var(--border-soft)] flex items-center gap-4 bg-[var(--bg)]">
                                <div className="shrink-0">
                                    <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">
                                        Skor Total
                                    </span>
                                    <div className="text-xl font-extrabold text-[var(--text)]">
                                        {active.hasilKoreksi.skorTotal}
                                    </div>
                                </div>
                                {active.hasilKoreksi.feedback && (
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                                        {active.hasilKoreksi.feedback}
                                    </p>
                                )}
                            </div>
                        )}

                        {active.hasilKoreksi?.direviewOleh && (
                            <div className="px-5 py-3 border-b border-[var(--border-soft)] bg-[var(--accent-soft)]">
                                <p className="text-[10px] font-bold text-[var(--accent-ink)] uppercase tracking-wider mb-1.5">
                                    Tinjauan Agent Peninjau
                                </p>
                                <p className="text-xs text-[var(--text-muted)] mb-2">
                                    {active.hasilKoreksi.direviewOleh}
                                </p>
                                <ul className="space-y-1.5">
                                    {active.hasilKoreksi.skorPerIndikator?.map((ind) =>
                                        ind.review ? (
                                            <li
                                                key={ind.indikatorId}
                                                className="text-xs text-[var(--text)] flex items-start gap-2"
                                            >
                                                <span className="inline-flex items-center gap-1 shrink-0 font-bold">
                                                    {ind.review.keputusan === "koreksi" ? (
                                                        <span className="text-[var(--warning-ink)]">
                                                            {ind.review.skorAwal} &#8594; {ind.review.skorAkhir}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--success-ink)]">&#10003; {ind.review.skorAkhir}</span>
                                                    )}
                                                </span>
                                                <span className="text-[var(--text-muted)]">
                                                    <span className="font-semibold text-[var(--text)]">{ind.nama}</span>
                                                    {" — "}
                                                    {ind.review.alasan}
                                                </span>
                                            </li>
                                        ) : null
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Drive preview */}
                        <iframe
                            src={drivePreviewUrl(active.driveFileId)}
                            title={`Jawaban ${active.namaMahasiswa}`}
                            allow="autoplay"
                            className="w-full flex-1 min-h-[420px] border-0"
                        />
                    </div>
                </div>
            )}
        </>
    );
}