import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadJawabanFile } from "@/lib/google-drive";
import { triggerGrading } from "@/lib/agentClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const soal = await db.soal.findUnique({
      where: { submitToken: token },
      include: { kelas: { select: { id: true } } },
    });

    if (!soal) {
      return NextResponse.json({ error: "Link submit tidak valid." }, { status: 404 });
    }

    if (soal.submitTokenExpiry !== null && soal.submitTokenExpiry.getTime() < Date.now()) {
      return NextResponse.json({ error: "Link submit sudah kedaluwarsa." }, { status: 410 });
    }

    const form = await req.formData();

    const namaMahasiswa = String(form.get("nama") ?? "").trim();
    const nim = String(form.get("nim") ?? "").trim();
    const emailMahasiswa = String(form.get("email") ?? "").trim();
    const file = form.get("file");

    if (!namaMahasiswa || !nim || !emailMahasiswa) {
      return NextResponse.json({ error: "Nama, NIM, dan email wajib diisi." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File jawaban (PDF) wajib diunggah." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File jawaban kosong." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB." }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "File harus berformat PDF." }, { status: 400 });
    }

    // Cegah duplikat: satu mahasiswa (NIM) hanya boleh mengumpulkan satu kali per soal.
    const existing = await db.submission.findFirst({
      where: { soalId: soal.id, nim },
    });
    if (existing) {
      return NextResponse.json(
        { error: "NIM ini sudah pernah mengumpulkan jawaban untuk soal ini." },
        { status: 409 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${namaMahasiswa.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_${nim}.pdf`;

    let upload: { fileId: string; webViewLink: string };
    try {
      upload = await uploadJawabanFile(buffer, fileName, soal.kelasId);
    } catch (err) {
      console.error("Gagal upload jawaban ke Drive:", err);
      return NextResponse.json(
        { error: "Gagal mengunggah jawaban ke Google Drive. Coba lagi beberapa saat." },
        { status: 500 },
      );
    }

    const submission = await db.submission.create({
      data: {
        soalId: soal.id,
        namaMahasiswa,
        nim,
        emailMahasiswa,
        driveFileId: upload.fileId,
        driveFileUrl: upload.webViewLink,
        status: "diterima",
      },
    });

    try {
      const indikator = await db.indikator.findMany({ where: { soalId: soal.id } });

      await triggerGrading({
        submission_id: submission.id,
        file_id: upload.fileId,
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
    }

    return NextResponse.json(
      { message: "Jawaban berhasil dikumpulkan dan sedang diperiksa.", submissionId: submission.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error di API submit:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}