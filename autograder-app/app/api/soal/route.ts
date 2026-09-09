import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSoalPdf } from "@/lib/generate-soal-pdf";
import { uploadSoalPdf } from "@/lib/google-drive";
import { sendNotifikasiSoalBaruEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function GET() {
  const soal = await db.soal.findMany({
    include: { indikator: true, submission: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(soal);
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = req.cookies.get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized. Cookie token tidak ditemukan." }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized. Token tidak valid atau kedaluwarsa." }, { status: 401 });
  }

  // 2. Ambil & validasi body
  const body = await req.json();
  const {
    judul,
    deskripsi,
    kelasId,
    mataKuliah,
    googleFormId, // sudah tidak dipakai lagi (deprecated, lihat catatan di schema), dibiarkan diterima tapi diabaikan
    driveFolderId,
    masaBerlakuJam, // opsional: durasi link submit aktif dalam jam (default 24)
    indikator,
  } = body;

  if (!judul || typeof judul !== "string" || !judul.trim()) {
    return NextResponse.json({ error: "Judul soal wajib diisi." }, { status: 400 });
  }

  if (!kelasId || typeof kelasId !== "string") {
    return NextResponse.json({ error: "Kelas wajib dipilih." }, { status: 400 });
  }

  if (!mataKuliah || typeof mataKuliah !== "string" || !mataKuliah.trim()) {
    return NextResponse.json({ error: "Mata kuliah wajib diisi." }, { status: 400 });
  }

  if (!Array.isArray(indikator) || indikator.length === 0) {
    return NextResponse.json({ error: "Minimal harus ada satu indikator penilaian." }, { status: 400 });
  }

  for (const [i, ind] of indikator.entries()) {
    if (!ind?.nama || typeof ind.nama !== "string" || !ind.nama.trim()) {
      return NextResponse.json({ error: `Indikator ke-${i + 1}: nama wajib diisi.` }, { status: 400 });
    }
    if (!ind?.rubrik || typeof ind.rubrik !== "string" || !ind.rubrik.trim()) {
      return NextResponse.json({ error: `Indikator ke-${i + 1}: rubrik wajib diisi.` }, { status: 400 });
    }
    if (typeof ind.bobot !== "number" || ind.bobot <= 0) {
      return NextResponse.json({ error: `Indikator ke-${i + 1}: bobot harus berupa angka lebih dari 0.` }, { status: 400 });
    }
    if (ind.skorMax !== undefined && (typeof ind.skorMax !== "number" || ind.skorMax <= 0)) {
      return NextResponse.json({ error: `Indikator ke-${i + 1}: skorMax harus berupa angka lebih dari 0.` }, { status: 400 });
    }
  }

  const totalBobot = indikator.reduce((sum: number, ind: { bobot: number }) => sum + ind.bobot, 0);
  if (Math.abs(totalBobot - 100) > 0.01) {
    return NextResponse.json({ error: `Total bobot semua indikator harus 100%. Saat ini: ${totalBobot}%.` }, { status: 400 });
  }

  if (masaBerlakuJam !== undefined && (typeof masaBerlakuJam !== "number" || !(masaBerlakuJam > 0))) {
    return NextResponse.json({ error: "masaBerlakuJam harus berupa angka lebih dari 0." }, { status: 400 });
  }

  // 3. Pastikan kelas ada (perlu untuk validasi & upload PDF ke folder kelas)
  const kelas = await db.kelas.findUnique({ where: { id: kelasId } });
  if (!kelas) {
    return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 400 });
  }

  // 4. Auto-prefix judul dengan [mataKuliah], supaya link submit per soal (yang
  // tercampur lintas matkul) tetap mudah dibedakan mahasiswa.
  const mataKuliahTrimmed = mataKuliah.trim();
  const judulFinal = `[${mataKuliahTrimmed}] ${judul.trim()}`;

  // 5. Generate token submit unik + batas waktu aktif (default 24 jam).
  const submitToken = crypto.randomBytes(24).toString("base64url");
  const submitTokenExpiry = new Date(Date.now() + (masaBerlakuJam ?? 24) * 60 * 60 * 1000);
  let soal;
  try {
    soal = await db.soal.create({
      data: {
        judul: judulFinal,
        deskripsi,
        dosenId: user.id,
        kelasId,
        mataKuliah: mataKuliahTrimmed,
        driveFolderId,
        submitToken,
        submitTokenExpiry,
        indikator: { create: indikator },
      },
      include: { indikator: true },
    });
  } catch (err: any) {
    console.error("Gagal membuat soal:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: `Soal dengan judul "${judulFinal}" sudah ada di kelas ini.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan soal ke database." }, { status: 500 });
  }

  // 6. Generate & Upload PDF Soal
  let pdfResult: { pdfUrl: string | null; pdfWarning?: string } = { pdfUrl: null };
  try {
    const pdfBuffer = await generateSoalPdf({
      judul: soal.judul,
      deskripsi: soal.deskripsi,
      indikator: soal.indikator,
    });
    const { fileId, webViewLink } = await uploadSoalPdf(pdfBuffer, `${soal.judul}.pdf`, soal.kelasId, soal.mataKuliah);

    await db.soal.update({
      where: { id: soal.id },
      data: { pdfUrl: webViewLink, pdfDriveFileId: fileId },
    });
    pdfResult = { pdfUrl: webViewLink };
  } catch (err) {
    console.error("Gagal generate/upload PDF soal:", err);
    pdfResult = { pdfUrl: null, pdfWarning: "PDF gagal dibuat, coba generate ulang." };
  }

  // 7. Buat link submit publik untuk mahasiswa (dipakai di email & dashboard).
  const submitLink = `${process.env.APP_URL || req.nextUrl.origin}/submit/${submitToken}`;

  // 8. Kirim Notifikasi Email ke Mahasiswa — link submit dikirim via mailer.
  let notifikasiInfo: { terkirim: number; gagal: number; dilewati?: string } = { terkirim: 0, gagal: 0 };

  const mahasiswaKelas = soal.kelasId ? await db.mahasiswa.findMany({ where: { kelasId: soal.kelasId } }) : [];

  if (mahasiswaKelas.length === 0) {
    notifikasiInfo.dilewati = "Tidak ada mahasiswa terdaftar di kelas ini.";
  } else {
    const results = await Promise.allSettled(
      mahasiswaKelas.map((mhs) =>
        sendNotifikasiSoalBaruEmail({
          to: mhs.email,
          namaMahasiswa: mhs.nama,
          judulSoal: soal.judul,
          mataKuliah: soal.mataKuliah,
          deskripsi: soal.deskripsi,
          submitLink,
          pdfUrl: pdfResult.pdfUrl,
        }),
      ),
    );

    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        notifikasiInfo.terkirim++;
      } else {
        console.error(`Gagal kirim notifikasi soal baru ke ${mahasiswaKelas[i].email}:`, r.reason);
        notifikasiInfo.gagal++;
      }
    });
  }

  const updated = await db.soal.findUnique({
    where: { id: soal.id },
    include: { indikator: true },
  });

  return NextResponse.json(
    { ...updated, ...pdfResult, submitLink, notifikasi: notifikasiInfo },
    { status: 201 },
  );
}