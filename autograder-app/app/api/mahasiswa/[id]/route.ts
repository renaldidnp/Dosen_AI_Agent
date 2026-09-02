import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { nama, nim, email } = body;

  if (!nama?.trim() || !nim?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nama, NIM, dan email wajib diisi" }, { status: 400 });
  }

  try {
    const mahasiswa = await db.mahasiswa.update({
      where: { id: params.id },
      data: { nama: nama.trim(), nim: nim.trim(), email: email.trim() },
    });
    return NextResponse.json(mahasiswa);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "NIM ini sudah terdaftar di kelas tersebut" }, { status: 409 });
    }
    console.error("Gagal mengubah mahasiswa:", err);
    return NextResponse.json({ error: "Gagal mengubah mahasiswa" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.mahasiswa.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Mahasiswa dihapus" });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
    }
    console.error("Gagal menghapus mahasiswa:", err);
    return NextResponse.json({ error: "Gagal menghapus mahasiswa" }, { status: 500 });
  }
}
