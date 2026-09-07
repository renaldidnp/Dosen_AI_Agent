import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/activity-log
// Mengembalikan aktivitas submission terbaru (diterima -> diproses -> selesai)
// sebagai "log" yang dipakai oleh komponen RealTimeLog.
//
// CATATAN: sesuaikan nama relasi `soal` dan `hasilKoreksi` di bawah ini
// dengan nama relasi yang ada di schema.prisma Anda (nama tabel di SQL
// dump adalah `soal` dan `hasilkoreksi`, tapi nama field relasi di Prisma
// client bisa berbeda tergantung penamaan model Anda).

export async function GET() {
  try {
    const submissions = await db.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        soal: { select: { judul: true } },
        hasilKoreksi: true, // ganti ke `hasilkoreksi` jika nama relasi Prisma Anda begitu
      },
    });

    const entries = submissions.map((s) => {
      let status: "running" | "queued" | "done" = "queued";
      let code = "SYS.QUEUE";
      let detail = `Menunggu diproses - ${s.soal?.judul ?? "Soal"}`;

      if (s.status === "diproses") {
        status = "running";
        code = "AI.GRADE_EXEC";
        detail = `Sedang dikoreksi AI - ${s.soal?.judul ?? "Soal"}`;
      } else if (s.status === "selesai") {
        status = "done";
        code = s.hasilKoreksi?.emailTerkirim ? "MAIL.SENT" : "AI.GRADE_DONE";
        const skor = s.hasilKoreksi?.skorTotal;
        detail =
          skor !== undefined && skor !== null
            ? `Selesai dikoreksi - skor ${skor} - ${s.soal?.judul ?? "Soal"}`
            : `Selesai dikoreksi - ${s.soal?.judul ?? "Soal"}`;
      }

      return {
        id: s.id,
        code,
        status,
        title: s.namaMahasiswa || "Submission",
        detail,
        createdAt: (s.hasilKoreksi?.createdAt ?? s.createdAt).toISOString(),
      };
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[activity-log] gagal mengambil data:", err);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}