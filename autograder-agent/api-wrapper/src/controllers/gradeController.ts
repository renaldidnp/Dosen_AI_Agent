import { Request, Response } from "express";
import { GradeRequest, GradingResult } from "../types";
import { downloadAndExtractPdfText } from "../services/driveService";
import { gradeAnswer, reviewAnswer } from "../services/assistantService";
import { sendGradingCallback, sendGradingErrorCallback, reportTrace } from "../services/callbackService";

async function processGrading(payload: GradeRequest): Promise<void> {
  const mulai = Date.now();
  const trace = (step: Parameters<typeof reportTrace>[0]["step"], status: Parameters<typeof reportTrace>[0]["status"], extra: Omit<Parameters<typeof reportTrace>[0], "submissionId" | "step" | "status"> = {}) =>
    void reportTrace({ submissionId: payload.submission_id, step, status, ...extra });

  try {
    // ── STEP: download PDF ──
    const tDownload = Date.now();
    await trace("download", "running", { detail: "Mengunduh jawaban dari Google Drive" });
    const jawabanText = await downloadAndExtractPdfText(payload.file_id);
    await trace("download", "done", { detail: "PDF berhasil diunduh & teks diekstrak", durationMs: Date.now() - tDownload });

    // ── PASS 1: Agent Penilai ──
    const tPass1 = Date.now();
    await trace("pass1", "running", { detail: "Agent Penilai menskor jawaban per rubrik" });
    const { hasilIndikator, feedbackUmum, provider: p1, model: m1 } = await gradeAnswer(jawabanText, payload.rubric);
    await trace("pass1", "done", { detail: "Selesai menskor seluruh indikator", provider: p1, model: m1, durationMs: Date.now() - tPass1 });

    // Validasi: pastikan setiap indikator rubric punya hasil dengan skor numerik valid.
    // Kalau tidak, gagalkan lebih awal dengan pesan jelas, daripada kirim NaN ke database.
    for (const r of payload.rubric) {
      const hasil = hasilIndikator.find((h) => h.indikatorId === r.indikatorId);
      if (!hasil || typeof hasil.skor !== "number" || !Number.isFinite(hasil.skor)) {
        throw new Error(`Hasil penilaian (pass 1) tidak valid/lengkap untuk indikator "${r.indikatorId}" (${r.nama})`);
      }
    }

    console.log(`[pass1] Agent Penilai (${p1}/${m1}) selesai untuk submission ${payload.submission_id}`);

    // ── PASS 2: Agent Peninjau (verifikasi independen) ──
    // Kalau gagal → grading tetap dipakai dari pass 1, reviewAktif jadi false.
    let reviewAktif = false;
    let direviewOleh: string | null = null;
    let reviewCatatan = "";
    let reviewPerIndikator: Record<string, { keputusan: "setuju" | "koreksi"; skorAkhir: number; alasan: string; saran: string | null }> = {};

    try {
      const tPass2 = Date.now();
      await trace("pass2", "running", { detail: "Agent Peninjau memverifikasi hasil Penilai" });
      const review = await reviewAnswer(jawabanText, payload.rubric, hasilIndikator);
      await trace("pass2", "done", { detail: "Verifikasi selesai", provider: review.provider, model: review.model, durationMs: Date.now() - tPass2 });
      reviewAktif = true;
      direviewOleh = `Agent Peninjau (${review.provider}/${review.model})`;
      reviewCatatan = review.catatan;
      for (const item of review.hasilIndikator) {
        if (!item || !item.indikatorId) continue;
        reviewPerIndikator[item.indikatorId] = {
          keputusan: item.keputusan === "koreksi" ? "koreksi" : "setuju",
          skorAkhir: Number.isFinite(item.skorAkhir) ? item.skorAkhir : 0,
          alasan: item.alasan ?? "",
          saran: typeof item.saran === "string" && item.saran.trim() ? item.saran : null,
        };
      }
      console.log(`[pass2] Agent Peninjau (${review.provider}/${review.model}) selesai untuk submission ${payload.submission_id}`);
    } catch (err) {
      reviewAktif = false;
      await trace("pass2", "error", { detail: `Peninjau gagal, fallback ke hasil Penilai: ${err instanceof Error ? err.message : err}` });
      console.error(`[pass2] Agent Peninjau gagal untuk submission ${payload.submission_id}:`, err instanceof Error ? err.message : err);
    }

    // Gabungkan: skor akhir per indikator = skorAkhir peninjau (kalau dikoreksi), atau skor penilai.
    const skorPerIndikator = payload.rubric.map((r) => {
      const h = hasilIndikator.find((x) => x.indikatorId === r.indikatorId)!;
      const rev = reviewPerIndikator[r.indikatorId];
      const skorAkhir = rev && rev.keputusan === "koreksi" ? rev.skorAkhir : h.skor;
      return {
        indikatorId: r.indikatorId,
        nama: r.nama,
        skor: skorAkhir,
        catatan: h.feedback,
        review: rev
          ? { keputusan: rev.keputusan, skorAwal: h.skor, skorAkhir, alasan: rev.alasan }
          : null,
        saran: rev?.saran ?? null,
      };
    });

    const skorTotal = skorPerIndikator.reduce((total, s) => {
      const indikator = payload.rubric.find((r) => r.indikatorId === s.indikatorId);
      const bobot = indikator?.bobot ?? 0;
      const skorMax = indikator?.skorMax ?? 100;
      return total + (s.skor / skorMax) * bobot;
    }, 0);

    if (!Number.isFinite(skorTotal)) {
      throw new Error(`skorTotal hasil hitung tidak valid (${skorTotal}) untuk submission ${payload.submission_id}`);
    }

    const feedback = feedbackUmum + (reviewCatatan ? `\n\nCatatan Peninjau: ${reviewCatatan}` : "");

    const result: GradingResult = {
      submission_id: payload.submission_id,
      skorTotal: Math.round(skorTotal * 100) / 100,
      skorPerIndikator,
      feedback,
      direviewOleh,
      reviewAktif,
    };

    const tCallback = Date.now();
    await trace("callback", "running", { detail: "Mengirim hasil grading ke server" });
    await sendGradingCallback(result);
    await trace("callback", "done", { detail: "Hasil grading diterima server", durationMs: Date.now() - tCallback });
    console.log(`Grading selesai untuk submission ${payload.submission_id} (total ${((Date.now() - mulai) / 1000).toFixed(1)}s)`);
  } catch (err) {
    await trace("error", "error", { detail: err instanceof Error ? err.message : "Unknown error" });
    console.error(`Grading gagal untuk submission ${payload.submission_id}:`, err);

    try {
      await sendGradingErrorCallback({
        submission_id: payload.submission_id,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    } catch (callbackErr) {
      console.error(`Callback error juga gagal untuk submission ${payload.submission_id}:`, callbackErr);
    }
  }
}

export function handleGradeRequest(req: Request, res: Response) {
  const payload = req.body as GradeRequest;

  if (!payload?.submission_id || !payload?.file_id || !payload?.rubric) {
    return res.status(400).json({ error: "Payload tidak lengkap" });
  }

  processGrading(payload);

  return res.status(200).json({ status: "queued" });
}
