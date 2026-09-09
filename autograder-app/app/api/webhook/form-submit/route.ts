import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerGrading } from "@/lib/agentClient";
import { moveSubmissionFile } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (secret !== process.env.WEBHOOK_SECRET) {
      console.error("Webhook: secret tidak cocok");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { kelasId, judulSoal, namaMahasiswa, nim, emailMahasiswa, driveFileId, driveFileUrl, formResponseId } = body;

    console.log("Webhook diterima:", { kelasId, judulSoal, namaMahasiswa, formResponseId });

    if (!kelasId || !judulSoal || !namaMahasiswa || !formResponseId) {
      console.error("Webhook: field wajib kosong", body);
      return NextResponse.json(
        { error: "Field wajib kosong (kelasId/judulSoal/namaMahasiswa/formResponseId)" },
        { status: 400 },
      );
    }

    // Resolve soalId dari kombinasi kelasId + judulSoal (dropdown form cuma
    // menyimpan teks judul, bukan ID — makanya di-lookup di sini, bukan diterima langsung).
    const soal = await db.soal.findUnique({
      where: { judul_kelasId: { judul: judulSoal, kelasId } },
    });

    if (!soal) {
      console.error("Webhook: soal tidak ditemukan untuk", { kelasId, judulSoal });
      return NextResponse.json(
        { error: `Soal dengan judul "${judulSoal}" tidak ditemukan di kelas ini.` },
        { status: 404 },
      );
    }

    const existing = await db.submission.findUnique({ where: { formResponseId } });
    if (existing) {
      console.log("Webhook: submission sudah pernah diproses:", formResponseId);
      return NextResponse.json({ message: "Sudah diproses sebelumnya" }, { status: 200 });
    }

    // Pindahkan file jawaban ke folder kelas — non-blocking, kalau gagal tetap
    // simpan submission dengan fileId/link asli dari Google Forms sebagai fallback.
    let finalFileId = driveFileId;
    let finalFileUrl = driveFileUrl;
    try {
      const moved = await moveSubmissionFile(driveFileId, kelasId);
      if (moved) {
        finalFileId = moved.fileId;
        finalFileUrl = moved.webViewLink;
      }
    } catch (moveErr) {
      console.error("Gagal memindahkan file jawaban ke folder kelas:", moveErr);
    }

    const submission = await db.submission.create({
      data: {
        soalId: soal.id,
        namaMahasiswa,
        nim,
        emailMahasiswa,
        driveFileId: finalFileId,
        driveFileUrl: finalFileUrl,
        formResponseId,
        status: "diterima",
      },
    });

    console.log("Submission tersimpan:", submission.id);

    try {
      const indikator = await db.indikator.findMany({ where: { soalId: soal.id } });

      await triggerGrading({
        submission_id: submission.id,
        file_id: finalFileId,
        rubric: indikator.map((i) => ({
          indikatorId: i.id,
          nama: i.nama,
          bobot: i.bobot,
          rubrik: i.rubrik,
          skorMax: i.skorMax,
        })),
      });

      await db.submission.update({ where: { id: submission.id }, data: { status: "diproses" } });
    } catch (gradingErr) {
      console.error("Gagal trigger grading untuk submission", submission.id, gradingErr);
      await db.submission.update({ where: { id: submission.id }, data: { status: "gagal_grading" } });
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