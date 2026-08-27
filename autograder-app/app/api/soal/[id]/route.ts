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
  const { judul, deskripsi, googleFormId, googleFormUrl, driveFolderId } = body;

  const soal = await db.soal.update({
    where: { id },
    data: { judul, deskripsi, googleFormId, googleFormUrl, driveFolderId },
    include: { indikator: true },
  });

  return NextResponse.json(soal);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await db.soal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
