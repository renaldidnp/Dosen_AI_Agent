import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerGrading } from "@/lib/agentClient";

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi secret dari Apps Script
    const secret = req.headers.get("x-webhook-secret");
    if (secret !== process.env.WEBHOOK_SECRET) {
      console.error("Webhook: secret tidak cocok");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { namaMahasiswa, nim, emailMahasiswa, soalId, driveFileId, driveFileUrl, formResponseId } = body;

    console.log("Webhook diterima:", { namaMahasiswa, nim, soalId, formResponseId });

    // 2. Validasi field wajib
    if (!soalId || !namaMahasiswa || !formResponseId) {
      console.error("Webhook: field wajib kosong", body);
      return NextResponse.json({ error: "Field wajib kosong (soalId/namaMahasiswa/formResponseId)" }, { status: 400 });
    }

    // 3. Pastikan soal-nya memang ada (biar bukan foreign key error yang membingungkan)
    const soal = await db.soal.findUnique({ where: { id: soalId } });
    if (!soal) {
      console.error("Webhook: soalId tidak ditemukan di database:", soalId);
      return NextResponse.json({ error: `Soal dengan id ${soalId} tidak ditemukan` }, { status: 404 });
    }

    // 4. Cegah duplikat kalau Apps Script kekirim dua kali
    const existing = await db.submission.findUnique({ where: { formResponseId } });
    if (existing) {
      console.log("Webhook: submission sudah pernah diproses:", formResponseId);
      return NextResponse.json({ message: "Sudah diproses sebelumnya" }, { status: 200 });
    }

    // 5. Simpan submission
    const submission = await db.submission.create({
      data: {
        soalId,
        namaMahasiswa,
        nim,
        emailMahasiswa,
        driveFileId,
        driveFileUrl,
        formResponseId,
        status: "diterima",
      },
    });

    console.log("Submission tersimpan:", submission.id);

    // 6. Ambil rubrik & trigger Hermes agent — dibungkus try/catch terpisah
    //    biar kalau grading gagal, submission-nya TETAP tersimpan (tidak ikut rollback)
    try {
      const indikator = await db.indikator.findMany({ where: { soalId } });

      await triggerGrading({
        submission_id: submission.id,
        file_id: driveFileId,
        rubric: indikator.map((i) => ({
          indikatorId: i.id,
          nama: i.nama,
          bobot: i.bobot,
          rubrik: i.rubrik,
          skorMax: i.skorMax,
        })),
      });

      await db.submission.update({
        where: { id: submission.id },
        data: { status: "diproses" },
      });
    } catch (gradingErr) {
      console.error("Gagal trigger grading untuk submission", submission.id, gradingErr);
      await db.submission.update({
        where: { id: submission.id },
        data: { status: "gagal_grading" },
      });
      // Tetap return 200 karena submission-nya sudah berhasil disimpan
      return NextResponse.json({
        message: "Submission tersimpan, tapi grading gagal dipicu",
        submissionId: submission.id,
      });
    }

    return NextResponse.json({ message: "Submission diterima, grading dimulai", submissionId: submission.id });
  } catch (err) {
    console.error("Error di webhook form-submit:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}
