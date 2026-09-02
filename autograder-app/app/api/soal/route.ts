import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSoalPdf } from "@/lib/generate-soal-pdf";
import { uploadSoalPdf } from "@/lib/google-drive";
import { sendNotifikasiSoalBaruEmail } from "@/lib/mailer";

export async function GET() {
  const soal = await db.soal.findMany({
    include: { indikator: true, submission: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(soal);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { judul, deskripsi, dosenId, kelasId, mataKuliah, googleFormId, googleFormUrl, driveFolderId, indikator } = body;

  const soal = await db.soal.create({
    data: {
      judul,
      deskripsi,
      dosenId,
      kelasId,
      mataKuliah,
      googleFormId,
      googleFormUrl,
      driveFolderId,
      indikator: { create: indikator },
    },
    include: { indikator: true },
  });

  let pdfResult: { pdfUrl: string | null; pdfWarning?: string } = { pdfUrl: null };
  try {
    const pdfBuffer = await generateSoalPdf({ judul: soal.judul, deskripsi: soal.deskripsi, indikator: soal.indikator });
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

  // Kirim notifikasi email ke semua mahasiswa di kelas ini — dibungkus try/catch
  // terpisah supaya kalau email gagal, response tetap 201 (soal-nya sudah tersimpan)
  let notifikasiInfo: { terkirim: number; gagal: number; dilewati?: string } = { terkirim: 0, gagal: 0 };

  if (!soal.kelasId) {
    notifikasiInfo.dilewati = "Soal tidak terhubung ke kelas manapun, notifikasi tidak dikirim.";
  } else if (!soal.googleFormUrl) {
    notifikasiInfo.dilewati = "googleFormUrl kosong, notifikasi tidak dikirim.";
  } else {
    const mahasiswaKelas = await db.mahasiswa.findMany({ where: { kelasId: soal.kelasId } });

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
            googleFormUrl: soal.googleFormUrl!,
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
  }

  const updated = await db.soal.findUnique({
    where: { id: soal.id },
    include: { indikator: true },
  });

  return NextResponse.json({ ...updated, ...pdfResult, notifikasi: notifikasiInfo }, { status: 201 });
}
