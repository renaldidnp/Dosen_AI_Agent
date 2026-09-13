import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

const STEP_META: Record<
  string,
  { code: string; title: (t: { nama: string; judul: string; provider?: string | null; model?: string | null }) => string; detail: string }
> = {
  download: {
    code: "DRIVE.DOWNLOAD",
    title: (t) => `${t.nama} — mengunduh jawaban`,
    detail: "Unduh jawaban dari Google Drive & ekstrak teks",
  },
  pass1: {
    code: "AI.PASS1",
    title: (t) => `Pass 1 · Agent Penilai (${t.provider ?? "?"}/${t.model ?? "?"})`,
    detail: "Menskor jawaban per rubrik",
  },
  pass2: {
    code: "AI.PASS2",
    title: (t) => `Pass 2 · Agent Peninjau (${t.provider ?? "?"}/${t.model ?? "?"})`,
    detail: "Memverifikasi ulang hasil Penilai",
  },
  callback: {
    code: "SYS.CALLBACK",
    title: () => "Callback hasil grading",
    detail: "Kirim hasil ke server diarahkan ke database",
  },
  mail: {
    code: "MAIL.SENT",
    title: () => "Email hasil penilaian",
    detail: "Kirim email rincian nilai ke mahasiswa",
  },
  error: {
    code: "AI.ERROR",
    title: () => "Koreksi bermasalah",
    detail: "Terjadi kegagalan pada pipeline grading",
  },
};

function stepStatus(status: string): "running" | "queued" | "done" {
  if (status === "running") return "running";
  if (status === "error") return "queued"; // pakai gaya 'antre' (peringatan) utk error
  return "done";
}

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
    const [traces, recentSubmissions] = await Promise.all([
      db.gradingTrace.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          submission: {
            select: { id: true, namaMahasiswa: true, status: true, soal: { select: { judul: true } }, hasilKoreksi: { select: { emailTerkirim: true, skorTotal: true } } },
          },
        },
      }),
      db.submission.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { soal: { select: { judul: true } }, hasilKoreksi: true },
      }),
    ]);

    const tracedSubmissionIds = new Set(traces.map((t) => t.submission.id));

    // Entri berbasis trace asli — satu baris per (submission, step).
    // Trace dipakai yang terbaru (list sudah urut createdAt desc), jadi jika
    // ada pasangan "running" + "done" untuk langkah yang sama, yang tampil
    // hanya state terakhir (done/error) dengan durasi & detail terkini.
    const traceByIdentity = new Map<
      string,
      {
        id: string;
        code: string;
        status: "running" | "queued" | "done";
        step: string;
        title: string;
        detail: string;
        createdAt: string;
        durationMs: number | null;
      }
    >();

    for (const t of traces) {
      const meta = STEP_META[t.step] ?? STEP_META.error;
      const s = t.submission;
      const key = `${s.id}::${t.step}`;

      if (traceByIdentity.has(key)) continue; // sudah ada baris lebih baru utk langkah ini

      traceByIdentity.set(key, {
        id: t.id,
        code: meta.code,
        status: stepStatus(t.status),
        step: t.step,
        title: meta.title({ nama: s.namaMahasiswa, judul: s.soal?.judul ?? "Soal", provider: t.provider, model: t.model }),
        detail: t.detail ?? meta.detail,
        createdAt: t.createdAt.toISOString(),
        durationMs: t.durationMs,
      });
    }

    const traceEntries = [...traceByIdentity.values()];

    // Fallback: submission yang belum punya trace sama sekali (mis. dari era
    // sebelum fitur ini), biar feed lama tidak 'hilang'.
    const coarseEntries = recentSubmissions
      .filter((s) => !tracedSubmissionIds.has(s.id))
      .map((s) => {
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
          id: `sub-${s.id}`,
          code,
          status,
          step: "fallback",
          title: s.namaMahasiswa || "Submission",
          detail,
          createdAt: (s.hasilKoreksi?.createdAt ?? s.createdAt).toISOString(),
          durationMs: null,
        };
      });

    const entries = [...traceEntries, ...coarseEntries]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10);

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[activity-log] gagal mengambil data:", err);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}