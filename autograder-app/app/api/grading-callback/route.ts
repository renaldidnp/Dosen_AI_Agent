import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendHasilPenilaianEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-agent-secret");
  if (secret !== process.env.AGENT_CALLBACK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { submission_id, skor_total, skor_per_indikator, feedback } = body;

  const submission = await db.submission.findUnique({
    where: { id: submission_id },
    include: { soal: true },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  await db.hasilKoreksi.create({
    data: {
      submissionId: submission_id,
      skorTotal: skor_total,
      skorPerIndikator: skor_per_indikator,
      feedback,
    },
  });

  await db.submission.update({
    where: { id: submission_id },
    data: { status: "selesai" },
  });

  const link = `${process.env.APP_URL}/nilai/${submission.id}?token=${submission.accessToken}`;

  // Kirim email hasil ke mahasiswa, karena mereka nggak akses web
  await sendHasilPenilaianEmail({
    to: submission.emailMahasiswa,
    namaMahasiswa: submission.namaMahasiswa,
    judulSoal: submission.soal.judul,
    skorTotal: skor_total,
    feedback,
    link, // ← baru
  });

  await db.hasilKoreksi.update({
    where: { submissionId: submission_id },
    data: { emailTerkirim: true },
  });

  return NextResponse.json({ message: "Hasil koreksi tersimpan & email terkirim" });
}
