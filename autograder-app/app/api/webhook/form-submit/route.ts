import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerGrading } from "@/lib/agentClient";

export async function POST(req: NextRequest) {
  // 1. Verifikasi secret dari Apps Script
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { namaMahasiswa, nim, emailMahasiswa, soalId, driveFileId, driveFileUrl, formResponseId } = body;

  // 2. Cegah duplikat kalau Apps Script kekirim dua kali
  const existing = await db.submission.findUnique({ where: { formResponseId } });
  if (existing) {
    return NextResponse.json({ message: "Sudah diproses sebelumnya" }, { status: 200 });
  }

  // 3. Simpan submission (step 2 & 3 di diagram)
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

  // 4. Ambil rubrik & indikator soal ini, lalu trigger Hermes agent (step 5)
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

  return NextResponse.json({ message: "Submission diterima, grading dimulai" });
}
