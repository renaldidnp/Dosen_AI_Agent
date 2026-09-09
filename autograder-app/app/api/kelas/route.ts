import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { createKelasForm } from "@/lib/google-forms";

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

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const kelas = await db.kelas.findMany({
    orderBy: [{ angkatan: "desc" }, { nama: "asc" }],
  });
  return NextResponse.json(kelas);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { nama, angkatan } = body;

  if (!nama?.trim() || !angkatan?.trim()) {
    return NextResponse.json({ error: "Nama kelas dan angkatan wajib diisi." }, { status: 400 });
  }

  let kelas;
  try {
    kelas = await db.kelas.create({
      data: { nama: nama.trim(), angkatan: angkatan.trim() },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: `Kelas "${nama}" untuk angkatan ${angkatan} sudah ada.` }, { status: 409 });
    }
    console.error("Gagal membuat kelas:", err);
    return NextResponse.json({ error: "Gagal membuat kelas." }, { status: 500 });
  }

  let formWarning: string | undefined;
  try {
    const { formId, formUrl } = await createKelasForm(kelas.nama, kelas.angkatan);

    kelas = await db.kelas.update({
      where: { id: kelas.id },
      data: { googleFormId: formId, googleFormUrl: formUrl },
    });
  } catch (err) {
    console.error("Gagal membuat Google Form untuk kelas:", err);
    formWarning = "Kelas berhasil dibuat, tapi Google Form gagal dibuat otomatis. Coba generate ulang dari halaman Kelas.";
  }

  return NextResponse.json({ ...kelas, formWarning }, { status: 201 });
}