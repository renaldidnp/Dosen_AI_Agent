import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const kelasId = req.nextUrl.searchParams.get("kelasId");
  if (!kelasId) {
    return NextResponse.json({ error: "Parameter kelasId wajib diisi" }, { status: 400 });
  }

  const mahasiswa = await db.mahasiswa.findMany({
    where: { kelasId },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(mahasiswa);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nama, nim, email, kelasId } = body;

  if (!nama?.trim() || !nim?.trim() || !email?.trim() || !kelasId) {
    return NextResponse.json({ error: "Nama, NIM, email, dan kelasId wajib diisi" }, { status: 400 });
  }

  try {
    const mahasiswa = await db.mahasiswa.create({
      data: { nama: nama.trim(), nim: nim.trim(), email: email.trim(), kelasId },
    });
    return NextResponse.json(mahasiswa, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "NIM ini sudah terdaftar di kelas tersebut" }, { status: 409 });
    }
    if (err.code === "P2003") {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    console.error("Gagal menambah mahasiswa:", err);
    return NextResponse.json({ error: "Gagal menambah mahasiswa" }, { status: 500 });
  }
}
