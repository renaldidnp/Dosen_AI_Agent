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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const force = body?.force === true;

  const kelas = await db.kelas.findUnique({ where: { id: params.id } });
  if (!kelas) {
    return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
  }

  if (kelas.googleFormId && !force) {
    return NextResponse.json(
      {
        error:
          "Kelas ini sudah punya Google Form. Generate ulang akan membuat form baru yang kosong (field upload file & dropdown soal harus diisi ulang manual). Kirim { force: true } jika tetap ingin melanjutkan.",
        currentFormUrl: kelas.googleFormUrl,
      },
      { status: 409 },
    );
  }

  try {
    const { formId, formUrl } = await createKelasForm(kelas.nama, kelas.angkatan);

    const updated = await db.kelas.update({
      where: { id: kelas.id },
      data: { googleFormId: formId, googleFormUrl: formUrl },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Gagal generate ulang Google Form untuk kelas:", err);
    return NextResponse.json(
      { error: "Gagal membuat Google Form. Coba lagi beberapa saat." },
      { status: 500 },
    );
  }
}