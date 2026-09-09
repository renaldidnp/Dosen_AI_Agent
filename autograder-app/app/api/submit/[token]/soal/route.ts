import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const soal = await db.soal.findUnique({
    where: { submitToken: token },
    include: {
      dosen: { select: { nama: true } },
      kelas: { select: { nama: true, angkatan: true } },
      indikator: {
        select: { nama: true, bobot: true, rubrik: true, skorMax: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!soal) {
    return NextResponse.json({ error: "Link submit tidak valid." }, { status: 404 });
  }

  const expired = soal.submitTokenExpiry !== null && soal.submitTokenExpiry.getTime() < Date.now();

  if (expired) {
    return NextResponse.json(
      {
        error: "Link submit sudah kedaluwarsa.",
        expired: true,
        expiredAt: soal.submitTokenExpiry,
      },
      { status: 410 },
    );
  }

  return NextResponse.json({
    id: soal.id,
    judul: soal.judul,
    deskripsi: soal.deskripsi,
    mataKuliah: soal.mataKuliah,
    pdfUrl: soal.pdfUrl,
    dosen: soal.dosen,
    kelas: soal.kelas,
    indikator: soal.indikator,
    deadline: soal.submitTokenExpiry,
  });
}