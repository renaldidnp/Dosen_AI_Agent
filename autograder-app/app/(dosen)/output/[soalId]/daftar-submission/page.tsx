import { db } from "@/lib/db";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  FileQuestion,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import SubmissionList from "./SubmissionList";

type IndikatorSkor = {
    indikatorId: string;
    nama: string;
    skor: number;
    catatan: string;
    review?: { keputusan: "setuju" | "koreksi"; skorAwal: number; skorAkhir: number; alasan: string } | null;
    saran?: string | null;
};

export default async function DaftarSubmissionPage({
  params,
}: {
  params: { soalId: string };
}) {
  const [soal, submissions] = await Promise.all([
    db.soal.findUnique({ where: { id: params.soalId } }),
    db.submission.findMany({
      where: { soalId: params.soalId },
      include: { hasilKoreksi: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const total = submissions.length;
  const sudahDinilai = submissions.filter((s) => s.hasilKoreksi).length;
  const menungguReview = submissions.filter(
    (s) => s.hasilKoreksi?.status === "menunggu_review" || s.hasilKoreksi?.status === "dikirim_ulang",
  ).length;
  const belumDinilai = total - sudahDinilai;

  const skorList = submissions
    .map((s) => s.hasilKoreksi?.skorTotal)
    .filter((v): v is number => typeof v === "number");

  const rataRata =
    skorList.length > 0
      ? (skorList.reduce((a, b) => a + b, 0) / skorList.length).toFixed(1)
      : "-";

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {/* =========================================================
            HEADER
        ========================================================= */}
        <header className="relative mb-6 pr-14 sm:mb-8 sm:pr-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold mb-2">
              <Sparkles className="w-[15px] h-[15px]" />
              Hasil &amp; Evaluasi
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              {soal?.judul ?? "Daftar Submission"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Pantau jawaban mahasiswa dan hasil koreksi otomatis AI Copilot. Klik baris
              mahasiswa untuk melihat jawaban, rubrik, dan melakukan review.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="
              absolute right-0 top-0 inline-flex items-center gap-2 rounded-xl
              border border-[var(--border)] bg-[var(--bg-panel)] p-2
              text-xs font-semibold text-[var(--text-muted)] shadow-xs
              transition-all hover:border-[var(--accent-border)]
              hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]
              sm:px-4 sm:py-2.5
            "
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
        </header>

        {/* =========================================================
            KPI RIBBON
        ========================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <KpiCard label="Total Submisi" value={total} icon={Users} />
          <KpiCard
            label="Menunggu Review"
            value={menungguReview}
            icon={ClipboardCheck}
            tone="warning"
          />
          <KpiCard
            label="Sudah Dinilai AI"
            value={sudahDinilai}
            icon={GraduationCap}
            tone="success"
          />
          <KpiCard label="Belum Dinilai" value={belumDinilai} icon={FileText} />
          <KpiCard label="Rata-rata Skor" value={rataRata} icon={TrendingUp} />
        </section>

        {/* =========================================================
            SUBMISSION LIST (client — untuk interaksi klik & modal)
        ========================================================= */}
        {submissions.length === 0 ? (
          <div
            className="
              bg-[var(--bg-panel)]
              border border-dashed border-[var(--border-strong)]
              rounded-2xl
              p-12
              flex flex-col items-center justify-center text-center
              min-h-[280px]
            "
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-ink)] mb-4">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[var(--text)] mb-2">
              Belum ada submission
            </h3>
            <p className="text-[var(--text-muted)] max-w-sm text-sm">
              Jawaban mahasiswa untuk soal ini akan muncul di sini begitu mereka
              mengumpulkan lewat link submit di email.
            </p>
          </div>
        ) : (
          <SubmissionList
            submissions={submissions.map((s) => ({
              id: s.id,
              namaMahasiswa: s.namaMahasiswa,
              nim: s.nim,
              emailMahasiswa: s.emailMahasiswa,
              status: s.status,
              driveFileId: s.driveFileId,
              driveFileUrl: s.driveFileUrl,
              hasilKoreksi: s.hasilKoreksi
                ? {
                    skorTotal: s.hasilKoreksi.skorTotal,
                    feedback: s.hasilKoreksi.feedback,
                    direviewOleh: s.hasilKoreksi.direviewOleh,
                    reviewAktif: s.hasilKoreksi.reviewAktif,
                    status: s.hasilKoreksi.status,
                    skorPerIndikator: s.hasilKoreksi.skorPerIndikator as unknown as IndikatorSkor[] | undefined,
                  }
                : null,
            }))}
            soalId={params.soalId}
          />
        )}
      </div>
    </div>
  );
}

// ==============================================================
// KPI CARD
// ==============================================================

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone?: "default" | "success" | "warning";
}) {
  const toneMap = {
    default: {
      iconBg: "bg-[var(--accent-soft)]",
      iconText: "text-[var(--accent-ink)]",
      border: "border-[var(--border)]",
      label: "text-[var(--text-muted)]",
    },
    success: {
      iconBg: "bg-[var(--success-soft)]",
      iconText: "text-[var(--success-ink)]",
      border: "border-[var(--success-border)]",
      label: "text-[var(--success-ink)]",
    },
    warning: {
      iconBg: "bg-[var(--warning-soft)]",
      iconText: "text-[var(--warning-ink)]",
      border: "border-[var(--warning-border)]",
      label: "text-[var(--warning-ink)]",
    },
  }[tone];

  return (
    <div
      className={`bg-[var(--bg-panel)] rounded-2xl p-5 border ${toneMap.border} shadow-xs flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${toneMap.label}`}>
          {label}
        </span>
        <div className={`w-10 h-10 rounded-xl ${toneMap.iconBg} ${toneMap.iconText} flex items-center justify-center`}>
          <Icon className="w-[22px] h-[22px]" />
        </div>
      </div>
      <span className="text-3xl font-extrabold text-[var(--text)] mt-1">{value}</span>
    </div>
  );
}