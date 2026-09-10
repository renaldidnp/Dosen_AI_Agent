import Link from "next/link";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";

export type SubmissionRow = {
    id: string;
    namaMahasiswa: string;
    nim: string;
    emailMahasiswa: string;
    status: string;
    driveFileId: string;
    driveFileUrl: string;
    hasilKoreksi: HasilKoreksi | null;
};

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

export default function SubmissionList({
    submissions,
    soalId,
}: {
    submissions: SubmissionRow[];
    soalId: string;
}) {
    return (
        <div className="flex flex-col gap-3">
            {submissions.map((s) => {
                const style = statusStyle(s.status);
                const reviewStatus = s.hasilKoreksi?.status ?? null;
                const reviewStyle = reviewStatus ? REVIEW_STYLE[reviewStatus] ?? null : null;
                const needsReview = reviewStatus === "menunggu_review";
                const href = `/output/${soalId}/review/${s.id}`;

                return (
                    <Link
                        key={s.id}
                        href={href}
                        className={`
                            group bg-[var(--bg-panel)] border rounded-2xl shadow-xs
                            px-5 py-4 flex items-center gap-4 transition-all
                            hover:border-[var(--accent-border-strong)]
                            hover:shadow-md
                            ${needsReview ? "border-[var(--warning-border)]" : "border-[var(--border)]"}
                        `}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-heading text-sm font-bold text-[var(--text)] truncate group-hover:text-[var(--accent-ink)]">
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
                            <span className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[var(--warning-soft)] border border-[var(--warning-border)] text-[var(--warning-ink)] text-xs font-bold group-hover:bg-[var(--warning)] group-hover:text-white transition-all">
                                <ClipboardCheck className="w-4 h-4" />
                                <span className="hidden md:inline">Review</span>
                            </span>
                        )}

                        <span className="shrink-0 w-9 h-9 rounded-xl border border-[var(--border-soft)] bg-[var(--bg)] text-[var(--text-faint)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-ink)] group-hover:border-[var(--accent-border)] flex items-center justify-center transition-all">
                            <ArrowUpRight className="w-4 h-4" />
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}