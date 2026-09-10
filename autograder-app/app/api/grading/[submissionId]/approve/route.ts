import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendHasilPenilaianEmail } from "@/lib/mailer";

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

export async function PATCH(req: NextRequest, { params }: { params: { submissionId: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const submission = await db.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      soal: true,
      hasilKoreksi: true,
    },
  });

  if (!submission || !submission.hasilKoreksi) {
    return NextResponse.json({ error: "Submission atau hasil koreksi tidak ditemukan" }, { status: 404 });
  }

  if (submission.hasilKoreksi.status === "approved") {
    return NextResponse.json({ error: "Hasil ini sudah disetujui sebelumnya" }, { status: 409 });
  }

  const { skorTotal, skorPerIndikator, feedback, direviewOleh } = submission.hasilKoreksi;

  let emailTerkirim = false;
  try {
    const link = `${process.env.APP_URL}/nilai/${submission.id}?token=${submission.accessToken}`;

    const saranPerIndikator = Array.isArray(skorPerIndikator)
      ? (skorPerIndikator as any[])
          .filter((i) => i && typeof i.saran === "string" && i.saran.trim())
          .map((i) => ({ nama: String(i.nama ?? "Indikator"), saran: i.saran }))
      : [];

    await sendHasilPenilaianEmail({
      to: submission.emailMahasiswa,
      namaMahasiswa: submission.namaMahasiswa,
      judulSoal: submission.soal.judul,
      skorTotal,
      feedback,
      link,
      direviewOleh,
      saranPerIndikator,
    });
    emailTerkirim = true;
  } catch (err) {
    console.error(`Gagal mengirim email hasil penilaian untuk submission ${submission.id}:`, err);
  }

  await db.hasilKoreksi.update({
    where: { submissionId: submission.id },
    data: {
      status: "approved",
      emailTerkirim,
      direviewOleh: auth.user.nama,
    },
  });

  await db.gradingTrace.create({
    data: {
      submissionId: submission.id,
      step: "mail",
      status: emailTerkirim ? "done" : "error",
      detail: emailTerkirim
        ? `Hasil disetujui ${auth.user.nama} & email terkirim`
        : `Hasil disetujui ${auth.user.nama}, tapi email gagal terkirim`,
    },
  });

  return NextResponse.json({
    message: emailTerkirim ? "Hasil disetujui & email terkirim" : "Hasil disetujui, tapi email gagal terkirim",
    emailTerkirim,
  });
}