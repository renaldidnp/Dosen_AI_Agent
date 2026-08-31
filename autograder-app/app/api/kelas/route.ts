import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const kelas = await db.kelas.findMany({
    orderBy: [{ angkatan: "desc" }, { nama: "asc" }],
  });
  return NextResponse.json(kelas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nama, angkatan } = body;

  if (!nama || !angkatan) {
    return NextResponse.json({ error: "nama dan angkatan wajib diisi" }, { status: 400 });
  }

  try {
    const kelas = await db.kelas.create({
      data: { nama, angkatan },
    });
    return NextResponse.json(kelas, { status: 201 });
  } catch (err: any) {
    // Kombinasi nama+angkatan sudah ada (constraint @@unique([nama, angkatan]))
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Kelas dengan nama dan angkatan ini sudah ada" }, { status: 409 });
    }
    console.error("Gagal membuat kelas:", err);
    return NextResponse.json({ error: "Gagal membuat kelas" }, { status: 500 });
  }
}
