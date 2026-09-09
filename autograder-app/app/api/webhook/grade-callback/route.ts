import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendHasilPenilaianEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-agent-callback-secret");

  if (secret !== process.env.AGENT_CALLBACK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  // ── Jalur khusus: agent melaporkan grading gagal total ──
  if (body.status === "error") {
    const { submission_id, error_message } = body;
    if (!submission_id) {
      return NextResponse.json({ error: "submission_id wajib diisi" }, { status: 400 });
    }

    console.error(`Grading gagal dilaporkan agent untuk submission ${submission_id}:`, error_message);

    try {
      await db.submission.update({
        where: { id: submission_id },
        data: { status: "gagal" },
      });
    } catch (err) {
      console.error("Gagal update status submission jadi 'gagal':", err);
      return NextResponse.json({ error: "Gagal menyimpan status error ke database" }, { status: 500 });
    }

    return NextResponse.json({ message: "Status submission ditandai gagal" });
  }

  // ── Jalur normal: grading sukses ──
  const { submission_id, skor_total, skor_per_indikator, feedback, direview_oleh, review_aktif } = body;
  const direviewOleh = typeof direview_oleh === "string" ? direview_oleh : null;

  if (!submission_id || skor_total === undefined || !skor_per_indikator || !feedback) {
    return NextResponse.json({ error: "Field wajib hilang: submission_id, skor_total, skor_per_indikator, feedback" }, { status: 400 });
  }

  // Guard: skor_total harus angka valid (bukan null/NaN/Infinity), karena kolom
  // skorTotal di database bertipe Float wajib (not nullable). NaN yang lolos
  // JSON.stringify berubah jadi null dan bikin Prisma gagal dengan error samar.
  if (typeof skor_total !== "number" || !Number.isFinite(skor_total)) {
    return NextResponse.json({ error: `skor_total tidak valid: ${JSON.stringify(skor_total)}` }, { status: 400 });
  }

  const submission = await db.submission.findUnique({
    where: { id: submission_id },
    include: { soal: true },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  try {
    await db.hasilKoreksi.upsert({
      where: { submissionId: submission_id },
      update: {
        skorTotal: skor_total,
        skorPerIndikator: skor_per_indikator,
        feedback,
        direviewOleh: typeof direview_oleh === "string" ? direview_oleh : null,
        reviewAktif: typeof review_aktif === "boolean" ? review_aktif : true,
      },
      create: {
        submissionId: submission_id,
        skorTotal: skor_total,
        skorPerIndikator: skor_per_indikator,
        feedback,
        direviewOleh: typeof direview_oleh === "string" ? direview_oleh : null,
        reviewAktif: typeof review_aktif === "boolean" ? review_aktif : true,
      },
    });

    await db.submission.update({
      where: { id: submission_id },
      data: { status: "selesai" },
    });
  } catch (err) {
    // Logging detail — err generik sebelumnya menyembunyikan pesan asli Prisma
    console.error("Gagal menyimpan hasil koreksi:", {
      message: err instanceof Error ? err.message : err,
      name: err instanceof Error ? err.name : undefined,
      submission_id,
      skor_total,
    });
    return NextResponse.json({ error: "Gagal menyimpan hasil koreksi ke database" }, { status: 500 });
  }

  let emailTerkirim = false;
  try {
    const link = `${process.env.APP_URL}/nilai/${submission_id}?token=${submission.accessToken}`;

    await sendHasilPenilaianEmail({
      to: submission.emailMahasiswa,
      namaMahasiswa: submission.namaMahasiswa,
      judulSoal: submission.soal.judul,
      skorTotal: skor_total,
      feedback,
      link,
      direviewOleh,
    });
    emailTerkirim = true;
  } catch (err) {
    console.error(`Gagal mengirim email hasil penilaian untuk submission ${submission_id}:`, err);
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