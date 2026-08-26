import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendHasilPenilaianEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-agent-callback-secret");

  // DEBUG SEMENTARA — hapus setelah masalah 401 ini selesai
  console.log("Header diterima:", JSON.stringify(secret));
  console.log("Env di server :", JSON.stringify(process.env.AGENT_CALLBACK_SECRET));

  if (secret !== process.env.AGENT_CALLBACK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const { submission_id, skor_total, skor_per_indikator, feedback } = body;

  if (!submission_id || skor_total === undefined || !skor_per_indikator || !feedback) {
    return NextResponse.json({ error: "Field wajib hilang: submission_id, skor_total, skor_per_indikator, feedback" }, { status: 400 });
  }

  const submission = await db.submission.findUnique({
    where: { id: submission_id },
    include: { soal: true },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  // Simpan hasil koreksi dulu — ini bagian yang paling penting dan wajib berhasil.
  try {
    await db.hasilKoreksi.upsert({
      where: { submissionId: submission_id },
      update: {
        skorTotal: skor_total,
        skorPerIndikator: skor_per_indikator,
        feedback,
      },
      create: {
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
  } catch (err) {
    console.error("Gagal menyimpan hasil koreksi:", err);
    return NextResponse.json({ error: "Gagal menyimpan hasil koreksi ke database" }, { status: 500 });
  }

  // Kirim email hasil ke mahasiswa. Kalau ini gagal, JANGAN gagalkan seluruh
  // request — hasil koreksi sudah tersimpan, cuma notifikasi emailnya yang bermasalah.
  let emailTerkirim = false;
  try {
    await sendHasilPenilaianEmail({
      to: submission.emailMahasiswa,
      namaMahasiswa: submission.namaMahasiswa,
      judulSoal: submission.soal.judul,
      skorTotal: skor_total,
      feedback,
    });
    emailTerkirim = true;
  } catch (err) {
    console.error(`Gagal mengirim email hasil penilaian untuk submission ${submission_id}:`, err);
    // sengaja tidak di-throw, biar response tetap sukses
  }

  await db.hasilKoreksi.update({
    where: { submissionId: submission_id },
    data: { emailTerkirim },
  });

  return NextResponse.json({
    message: emailTerkirim ? "Hasil koreksi tersimpan & email terkirim" : "Hasil koreksi tersimpan, tapi email gagal terkirim",
    emailTerkirim,
  });
}
