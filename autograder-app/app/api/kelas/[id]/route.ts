import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const kelas = await db.kelas.findUnique({
      where: { id: params.id },
    });

    if (!kelas) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(kelas);
  } catch (err) {
    console.error("Gagal mengambil data kelas:", err);
    return NextResponse.json({ error: "Gagal mengambil data kelas" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { nama, angkatan } = body;

  try {
    const kelas = await db.kelas.update({
      where: { id: params.id },
      data: {
        ...(nama !== undefined ? { nama } : {}),
        ...(angkatan !== undefined ? { angkatan } : {}),
      },
    });
    return NextResponse.json(kelas);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Kelas dengan nama dan angkatan ini sudah ada" }, { status: 409 });
    }
    console.error("Gagal update kelas:", err);
    return NextResponse.json({ error: "Gagal update kelas" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.kelas.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    // Gagal karena masih dipakai relasi (Mahasiswa/Soal terkait kelas ini)
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Kelas tidak bisa dihapus karena masih dipakai mahasiswa/soal" }, { status: 409 });
    }
    console.error("Gagal hapus kelas:", err);
    return NextResponse.json({ error: "Gagal hapus kelas" }, { status: 500 });
  }
}