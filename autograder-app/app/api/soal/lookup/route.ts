import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const judul = req.nextUrl.searchParams.get("judul");

  if (!judul) {
    return NextResponse.json({ error: "Parameter 'judul' wajib diisi" }, { status: 400 });
  }

  const soal = await db.soal.findFirst({
    where: { judul: judul },
    select: { id: true },
  });

  if (!soal) {
    return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ soalId: soal.id });
}
