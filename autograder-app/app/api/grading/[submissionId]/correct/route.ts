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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const { skorPerIndikator, feedback, skorTotal } = body;

  if (!Array.isArray(skorPerIndikator) || typeof feedback !== "string" || !feedback.trim()) {
    return NextResponse.json({ error: "Field wajib: skorPerIndikator (array) & feedback (string)" }, { status: 400 });
  }

  if (typeof skorTotal !== "number" || !Number.isFinite(skorTotal)) {
    return NextResponse.json({ error: "skorTotal tidak valid" }, { status: 400 });
  }

  const submission = await db.submission.findUnique({
    where: { id: params.submissionId },
    include: { soal: true, hasilKoreksi: true },
  });

  if (!submission || !submission.hasilKoreksi) {
    return NextResponse.json({ error: "Submission atau hasil koreksi tidak ditemukan" }, { status: 404 });
  }

  const corsNote = `Dikoreksi manual oleh ${auth.user.nama}.`;

  let emailTerkirim = false;
  try {
    const link = `${process.env.APP_URL}/nilai/${submission.id}?token=${submission.accessToken}`;

    const saranPerIndikator = skorPerIndikator
      .filter((i) => i && typeof i.saran === "string" && i.saran.trim())
      .map((i) => ({ nama: String(i.nama ?? "Indikator"), saran: i.saran }));

    await sendHasilPenilaianEmail({
      to: submission.emailMahasiswa,
      namaMahasiswa: submission.namaMahasiswa,
      judulSoal: submission.soal.judul,
      skorTotal,
      feedback: `${feedback}\n\n${corsNote}`,
      link,
      direviewOleh: auth.user.nama,
      saranPerIndikator,
    });
    emailTerkirim = true;
  } catch (err) {
    console.error(`Gagal mengirim email hasil koreksi manual untuk submission ${submission.id}:`, err);
  }

  await db.hasilKoreksi.update({
    where: { submissionId: submission.id },
    data: {
      skorTotal,
      skorPerIndikator,
      feedback: `${feedback}\n\n${corsNote}`,
      direviewOleh: auth.user.nama,
      emailTerkirim,
      status: "dikoreksi",
    },
  });

  await db.gradingTrace.create({
    data: {
      submissionId: submission.id,
      step: "mail",
      status: emailTerkirim ? "done" : "error",
      detail: emailTerkirim
        ? `Dikoreksi manual oleh ${auth.user.nama} & email terkirim`
        : `Dikoreksi manual oleh ${auth.user.nama}, tapi email gagal terkirim`,
    },
  });

  return NextResponse.json({
    message: emailTerkirim ? "Koreksi manual tersimpan & email terkirim" : "Koreksi manual tersimpan, tapi email gagal terkirim",
    emailTerkirim,
  });
}