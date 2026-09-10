import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const soal = await db.soal.findUnique({
    where: { id },
    include: { indikator: true, submission: true },
  });

  if (!soal) {
    return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(soal);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { judul, deskripsi, driveFolderId } = body;

  const soal = await db.soal.update({
    where: { id },
    data: { judul, deskripsi, driveFolderId },
    include: { indikator: true },
  });

  return NextResponse.json(soal);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Hapus berantai: GradingTrace & HasilKoreksi → Submission → Indikator → Soal
    await db.$transaction(async (tx) => {
      await tx.gradingTrace.deleteMany({
        where: { submission: { soalId: id } },
      });

      await tx.hasilKoreksi.deleteMany({
        where: { submission: { soalId: id } },
      });

      await tx.submission.deleteMany({ where: { soalId: id } });

      await tx.indikator.deleteMany({ where: { soalId: id } });

      await tx.soal.delete({ where: { id } });
    });
  } catch (err: any) {
    console.error("Gagal menghapus soal:", err);
    if (err?.code === "P2003") {
      return NextResponse.json(
        {
          error: "Soal masih memiliki data terkait (submission/hasil koreksi) yang gagal dihapus.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Gagal menghapus soal. Coba lagi." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
