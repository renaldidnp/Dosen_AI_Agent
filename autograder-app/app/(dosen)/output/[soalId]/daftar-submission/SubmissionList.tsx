"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  FolderOpenDot,
  X,
  FileDown,
  BrainCircuit,
  ShieldCheck,
  Send,
  Mail,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

type TraceRow = {
    id: string;
    step: string;
    status: string;
    detail: string | null;
    provider: string | null;
    model: string | null;
    durationMs: number | null;
    createdAt: Date | string;
};

const TRACE_STEP: Record<string, { label: string; icon: typeof FileDown }> = {
    download: { label: "Unduh Jawaban", icon: FileDown },
    pass1: { label: "Pass 1 · Agent Penilai", icon: BrainCircuit },
    pass2: { label: "Pass 2 · Agent Peninjau", icon: ShieldCheck },
    callback: { label: "Callback Hasil", icon: Send },
    mail: { label: "Email Hasil", icon: Mail },
    error: { label: "Error", icon: AlertTriangle },
};

function traceStatusColor(status: string): string {
    if (status === "running") return "bg-[var(--accent)] animate-pulse";
    if (status === "error") return "bg-[var(--danger-text)]";
    return "bg-[var(--success)]";
}

function traceStatusLabel(status: string): string {
    if (status === "running") return "Berjalan";
    if (status === "error") return "Gagal";
    return "Selesai";
}

function traceTime(value: Date | string): string {
    return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function traceDurasi(ms: number | null): string {
    if (!ms || ms < 0) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

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
    saran?: string | null;
};

type HasilKoreksi = {
    skorTotal: number;
    feedback: string;
    direviewOleh?: string | null;
    reviewAktif?: boolean;
    status?: string;
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
    gagal: {
        label: "Gagal",
        className: "bg-[var(--danger-soft)] text-[var(--danger-text)] border-[var(--danger-border)]",
    },
    selesai: {
        label: "Dinilai",
        className: "bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--success-border)]",
    },
};

const REVIEW_STYLE: Record<string, { label: string; className: string }> = {
    menunggu_review: {
        label: "Menunggu Review",
        className: "bg-[var(--warning-soft)] text-[var(--warning-ink)] border-[var(--warning-border)] animate-pulse",
    },
    approved: {
        label: "Disetujui Dosen",
        className: "bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--success-border)]",
    },
    dikoreksi: {
        label: "Dikoreksi Dosen",
        className: "bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]",
    },
    dikirim_ulang: {
        label: "Dikirim Ulang",
        className: "bg-[var(--warning-soft)] text-[var(--warning-ink)] border-[var(--warning-border)] animate-pulse",
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

export default function SubmissionList({
  submissions,
  tracesBySubmission,
  soalId,
}: {
  submissions: SubmissionRow[];
  tracesBySubmission?: Record<string, TraceRow[]>;
  soalId: string;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const active = submissions.find((s) => s.id === activeId) ?? null;
    const activeTraces = (activeId && tracesBySubmission?.[activeId]) || [];

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
                    const reviewStatus = s.hasilKoreksi?.status ?? null;
                    const reviewStyle = reviewStatus ? REVIEW_STYLE[reviewStatus] ?? null : null;
                    const needsReview = reviewStatus === "menunggu_review";

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
                                    {reviewStyle && (
                                        <span
                                            key={reviewStatus}
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${reviewStyle.className}`}
                                        >
                                            {reviewStyle.label}
                                        </span>
                                    )}
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

                            {needsReview && (
                                <a
                                    href={`/output/${soalId}/review/${s.id}`}
                                    title="Setujui, koreksi, atau minta AI mengoreksi ulang"
                                    className="
                      shrink-0 inline-flex items-center gap-1.5 h-11 px-3 rounded-xl
                      bg-[var(--warning-soft)] border border-[var(--warning-border)]
                      text-[var(--warning-ink)] text-xs font-bold
                      hover:bg-[var(--warning)] hover:text-white
                      transition-all
                    "
                                >
                                    <ClipboardCheck className="w-4 h-4" />
                                    <span className="hidden md:inline">Review</span>
                                </a>
                            )}

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
              max-h-[92vh]
              flex flex-col
              overflow-hidden
            "
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-soft)] shrink-0">
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
                            <div className="px-5 py-3 border-b border-[var(--border-soft)] flex items-center gap-4 bg-[var(--bg)] shrink-0">
                                <div className="shrink-0">
                                    <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">
                                        Skor Total
                                    </span>
                                    <div className="text-xl font-extrabold text-[var(--text)]">
                                        {active.hasilKoreksi.skorTotal}
                                    </div>
                                </div>
                                {active.hasilKoreksi.feedback && (
                                    <p className="min-w-0 flex-1 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                                        {active.hasilKoreksi.feedback}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Area scrollable: review + trace */}
                        <div className="flex-1 min-h-0 overflow-y-auto">
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
                                                <span className="flex-1 min-w-0 text-[var(--text-muted)]">
                                                    <span className="font-semibold text-[var(--text)]">{ind.nama}</span>
                                                    {" — "}
                                                    {ind.review.alasan}
                                                </span>
                                            </li>
                                        ) : null
                                    )}
                                </ul>

                                {active.hasilKoreksi.skorPerIndikator?.some((ind) => ind.saran) && (
                                    <div className="mt-3 pt-3 border-t border-[var(--accent-border)]">
                                        <p className="text-[10px] font-bold text-[var(--accent-ink)] uppercase tracking-wider mb-1.5">
                                            Saran Perbaikan (untuk mahasiswa)
                                        </p>
                                        <ul className="space-y-1.5">
                                            {active.hasilKoreksi.skorPerIndikator.map((ind) =>
                                                ind.saran ? (
                                                    <li key={`saran-${ind.indikatorId}`} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                                                        <span className="shrink-0 font-bold text-[var(--text)]">{ind.nama}</span>
                                                        <span className="flex-1 min-w-0">{ind.saran}</span>
                                                    </li>
                                                ) : null
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Langkah AI Agent (live trace) */}
                        {activeTraces.length > 0 && (
                            <div className="px-5 py-4 border-b border-[var(--border-soft)] bg-[var(--bg)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <BrainCircuit className="w-4 h-4 text-[var(--accent)]" />
                                    <h4 className="font-heading text-xs font-bold text-[var(--text)]">
                                        Langkah AI Agent
                                    </h4>
                                    <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                                        {activeTraces.length} langkah
                                    </span>
                                </div>

                                <ol className="relative border-l border-[var(--border-strong)] ml-1 space-y-3">
                                    {activeTraces.map((t) => {
                                        const meta = TRACE_STEP[t.step] ?? TRACE_STEP.error;
                                        const Icon = meta.icon;
                                        const durasi = traceDurasi(t.durationMs);
                                        return (
                                            <li key={t.id} className="ml-4 pl-3">
                                                <span
                                                    className={`absolute -left-[7px] mt-1 w-3 h-3 rounded-full ring-4 ring-[var(--bg-panel)] ${traceStatusColor(t.status)}`}
                                                />
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                    <Icon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                                    <span className="text-xs font-bold text-[var(--text)]">
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-faint)] ml-auto">
                                                        {traceTime(t.createdAt)}
                                                    </span>
                                                    {durasi && (
                                                        <span className="text-[10px] font-bold text-[var(--accent-ink)]">
                                                            {durasi}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                                        {traceStatusLabel(t.status)}
                                                    </span>
                                                </div>
                                                {t.detail && (
                                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 break-words">
                                                        {t.detail}
                                                    </p>
                                                )}
                                                {(t.provider || t.model) && (
                                                    <p className="text-[10px] text-[var(--text-faint)] mt-0.5 font-mono">
                                                        {t.provider}/{t.model}
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}
                        </div>

                        {/* Drive preview */}
                        <iframe
                            src={drivePreviewUrl(active.driveFileId)}
                            title={`Jawaban ${active.namaMahasiswa}`}
                            allow="autoplay"
                            className="w-full h-[42vh] sm:h-[46vh] shrink-0 border-0 border-t border-[var(--border-soft)] bg-white"
                        />
                    </div>
                </div>
            )}
        </>
    );
}