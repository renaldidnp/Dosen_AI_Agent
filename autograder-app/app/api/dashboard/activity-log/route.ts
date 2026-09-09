import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized. Cookie token tidak ditemukan." }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized. Token tidak valid atau kedaluwarsa." }, { status: 401 });
  }

  try {
    const submissions = await db.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        soal: { select: { judul: true } },
        hasilKoreksi: true,
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