import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSoalPdf } from "@/lib/generate-soal-pdf";
import { uploadSoalPdf } from "@/lib/google-drive";

export async function GET() {
  const soal = await db.soal.findMany({
    include: { indikator: true, submission: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(soal);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { judul, deskripsi, dosenId, kelasId, googleFormId, googleFormUrl, driveFolderId, indikator } = body;

  const soal = await db.soal.create({
    data: {
      judul,
      deskripsi,
      dosenId,
      kelasId,
      googleFormId,
      googleFormUrl,
      driveFolderId,
      indikator: { create: indikator },
    },
    include: { indikator: true },
  });

  try {
    const pdfBuffer = await generateSoalPdf({ judul: soal.judul, deskripsi: soal.deskripsi, indikator: soal.indikator });
    const { fileId, webViewLink } = await uploadSoalPdf(pdfBuffer, `${soal.judul}.pdf`, soal.kelasId);

    const updated = await db.soal.update({
      where: { id: soal.id },
      data: { pdfUrl: webViewLink, pdfDriveFileId: fileId },
      include: { indikator: true },
    });
    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    console.error("Gagal generate/upload PDF soal:", err);
    return NextResponse.json({ ...soal, pdfUrl: null, pdfWarning: "PDF gagal dibuat, coba generate ulang." }, { status: 201 });
  }
}
