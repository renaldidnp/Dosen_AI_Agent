import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAuth(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized. Cookie token tidak ditemukan." }, { status: 401 }) };
  }
  const user = await verifyToken(token);
  if (!user || !user.id) {
    return { error: NextResponse.json({ error: "Unauthorized. Token tidak valid atau kedaluwarsa." }, { status: 401 }) };
  }
  return { user };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const kelas = await db.kelas.findUnique({ where: { id: params.id } });
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
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    await db.kelas.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Kelas tidak bisa dihapus karena masih dipakai mahasiswa/soal" }, { status: 409 });
    }
    console.error("Gagal hapus kelas:", err);
    return NextResponse.json({ error: "Gagal hapus kelas" }, { status: 500 });
  }
}