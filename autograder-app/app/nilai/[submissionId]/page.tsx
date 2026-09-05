import { db } from "@/lib/db";
import { notFound } from "next/navigation";

interface SkorIndikator {
  indikatorId: string;
  nama: string;
  skor: number;
  catatan: string;
}

export default async function NilaiPage({ params, searchParams }: { params: { submissionId: string }; searchParams: { token?: string } }) {
  const submission = await db.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      soal: { include: { indikator: true } },
      hasilKoreksi: true,
    },
  });

  if (!submission || submission.accessToken !== searchParams.token) {
    notFound();
  }

  if (!submission.hasilKoreksi) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p>
          Jawaban kamu untuk <b>{submission.soal.judul}</b> masih dalam proses penilaian. Coba cek lagi nanti.
        </p>
      </div>
    );
  }

  const { skorTotal, skorPerIndikator, feedback } = submission.hasilKoreksi;
  const breakdown = skorPerIndikator as unknown as SkorIndikator[];
  const indikatorMap = new Map(submission.soal.indikator.map((i) => [i.id, i]));

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">{submission.soal.judul}</h1>
        <p className="text-gray-500">
          {submission.namaMahasiswa} — {submission.nim}
        </p>
      </div>

      <div className="text-3xl font-bold">Nilai Akhir: {skorTotal}</div>

      <div className="space-y-3">
        <h2 className="font-semibold">Rincian per Indikator</h2>
        {breakdown.map((item) => {
          const def = indikatorMap.get(item.indikatorId);
          const max = def?.skorMax ?? 100;
          return (
            <div key={item.indikatorId} className="border rounded p-3">
              <div className="flex justify-between font-medium">
                <span>{item.nama}</span>
                <span>
                  {item.skor} / {max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2 mt-1">
                <div className="bg-indigo-500 h-2 rounded" style={{ width: `${Math.min(100, (item.skor / max) * 100)}%` }} />
              </div>
              {item.catatan && <p className="text-sm text-gray-600 mt-2">{item.catatan}</p>}
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="font-semibold mb-1">Feedback Keseluruhan</h2>
        <p className="whitespace-pre-wrap text-gray-700">{feedback}</p>
      </div>
    </div>
  );
}
