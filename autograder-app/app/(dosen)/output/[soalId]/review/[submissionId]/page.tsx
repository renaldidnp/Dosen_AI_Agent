import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Sparkles } from "lucide-react";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

type IndikatorSkor = {
  indikatorId: string;
  nama: string;
  skor: number;
  catatan: string;
  review?: { keputusan: "setuju" | "koreksi"; skorAwal: number; skorAkhir: number; alasan: string } | null;
  saran?: string | null;
};

export default async function ReviewPage({
  params,
}: {
  params: { soalId: string; submissionId: string };
}) {
  const submission = await db.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      soal: { include: { indikator: true } },
      hasilKoreksi: true,
    },
  });

  if (!submission || submission.soalId !== params.soalId || !submission.hasilKoreksi) {
    notFound();
  }

  const { hasilKoreksi, soal } = submission;

  const indikatorDefs = soal.indikator.map((i) => ({
    id: i.id,
    nama: i.nama,
    bobot: i.bobot,
    rubrik: i.rubrik,
    skorMax: i.skorMax,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="relative mb-6 pr-14 sm:mb-8 sm:pr-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-xs font-semibold mb-2">
              <ClipboardCheck className="w-[15px] h-[15px]" />
              Review Hasil Koreksi
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              {soal.judul}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Setujui hasil koreksi AI, lakukan koreksi manual, atau minta AI mengoreksi ulang
              dengan catatan tambahan dari Anda.
            </p>
          </div>

          <Link
            href={`/output/${params.soalId}/daftar-submission`}
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

        <ReviewClient
          soalId={params.soalId}
          submissionId={submission.id}
          namaMahasiswa={submission.namaMahasiswa}
          nim={submission.nim}
          emailMahasiswa={submission.emailMahasiswa}
          status={submission.status}
          driveFileUrl={submission.driveFileUrl}
          driveFileId={submission.driveFileId}
          indikatorDefs={indikatorDefs}
          skorTotal={hasilKoreksi.skorTotal}
          feedback={hasilKoreksi.feedback}
          direviewOleh={hasilKoreksi.direviewOleh}
          reviewAktif={hasilKoreksi.reviewAktif}
          reviewStatus={hasilKoreksi.status}
          skorPerIndikator={
            hasilKoreksi.skorPerIndikator as unknown as IndikatorSkor[]
          }
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Review Hasil Koreksi",
};