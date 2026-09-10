import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { triggerGrading } from "@/lib/agentClient";

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

export async function POST(req: NextRequest, { params }: { params: { submissionId: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const { catatanTambahan } = body;

  if (typeof catatanTambahan !== "string" || !catatanTambahan.trim()) {
    return NextResponse.json({ error: "Field wajib: catatanTambahan (string)" }, { status: 400 });
  }

  const submission = await db.submission.findUnique({
    where: { id: params.submissionId },
    include: {
      soal: { include: { indikator: true } },
      hasilKoreksi: true,
    },
  });

  if (!submission || !submission.hasilKoreksi) {
    return NextResponse.json({ error: "Submission atau hasil koreksi tidak ditemukan" }, { status: 404 });
  }

  if (submission.soal.indikator.length === 0) {
    return NextResponse.json({ error: "Soal tidak memiliki indikator penilaian" }, { status: 400 });
  }

  const rubric = submission.soal.indikator.map((i) => ({
    indikatorId: i.id,
    nama: i.nama,
    bobot: i.bobot,
    rubrik: i.rubrik,
    skorMax: i.skorMax,
  }));

  await db.hasilKoreksi.update({
    where: { submissionId: submission.id },
    data: {
      status: "dikirim_ulang",
      emailTerkirim: false,
    },
  });

  const tRegrade = Date.now();
  await db.gradingTrace.create({
    data: {
      submissionId: submission.id,
      step: "callback",
      status: "running",
      detail: `${auth.user.nama} meminta AI mengoreksi ulang: ${catatanTambahan}`,
    },
  });

  try {
    await triggerGrading({
      submission_id: submission.id,
      file_id: submission.driveFileId,
      rubric,
      catatan_tambahan: catatanTambahan,
    });
  } catch (err) {
    const pesan = err instanceof Error ? err.message : "Unknown error";
    await db.gradingTrace.create({
      data: {
        submissionId: submission.id,
        step: "error",
        status: "error",
        detail: `Gagal kirim ulang ke agent: ${pesan}`,
      },
    });
    await db.hasilKoreksi.update({
      where: { submissionId: submission.id },
      data: { status: "menunggu_review" },
    });
    console.error(`Gagal trigger regrade untuk submission ${submission.id}:`, err);
    return NextResponse.json({ error: `Gagal memicu koreksi ulang: ${pesan}` }, { status: 502 });
  }

  await db.gradingTrace.create({
    data: {
      submissionId: submission.id,
      step: "callback",
      status: "done",
      detail: `Regrade dipicu, menunggu hasil AI`,
      durationMs: Date.now() - tRegrade,
    },
  });

  return NextResponse.json({ message: "Koreksi ulang dipicu, hasil baru akan dikirim setelah AI selesai" });
}