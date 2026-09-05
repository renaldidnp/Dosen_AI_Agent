import { Request, Response } from "express";
import { GradeRequest, GradingResult } from "../types";
import { downloadAndExtractPdfText } from "../services/driveService";
import { gradeWithGemini } from "../services/geminiService";
import { sendGradingCallback, sendGradingErrorCallback } from "../services/callbackService";

async function processGrading(payload: GradeRequest): Promise<void> {
  try {
    const jawabanText = await downloadAndExtractPdfText(payload.file_id);
    const { hasilIndikator, feedbackUmum } = await gradeWithGemini(jawabanText, payload.rubric);

    // Validasi: pastikan setiap indikator rubric punya hasil dengan skor numerik valid.
    // Kalau tidak, gagalkan lebih awal dengan pesan jelas, daripada kirim NaN ke database.
    for (const r of payload.rubric) {
      const hasil = hasilIndikator.find((h) => h.indikatorId === r.indikatorId);
      if (!hasil || typeof hasil.skor !== "number" || !Number.isFinite(hasil.skor)) {
        throw new Error(`Hasil penilaian Gemini tidak valid/lengkap untuk indikator "${r.indikatorId}" (${r.nama})`);
      }
    }

    const skorTotal = hasilIndikator.reduce((total, h) => {
      const indikator = payload.rubric.find((r) => r.indikatorId === h.indikatorId);
      const bobot = indikator?.bobot ?? 0;
      const skorMax = indikator?.skorMax ?? 100;
      return total + (h.skor / skorMax) * bobot;
    }, 0);

    if (!Number.isFinite(skorTotal)) {
      throw new Error(`skorTotal hasil hitung tidak valid (${skorTotal}) untuk submission ${payload.submission_id}`);
    }

    const skorPerIndikator = hasilIndikator.map((h) => {
      const indikator = payload.rubric.find((r) => r.indikatorId === h.indikatorId);
      return {
        indikatorId: h.indikatorId,
        nama: indikator?.nama ?? "",
        skor: h.skor,
        catatan: h.feedback,
      };
    });

    const result: GradingResult = {
      submission_id: payload.submission_id,
      skorTotal: Math.round(skorTotal * 100) / 100,
      skorPerIndikator,
      feedback: feedbackUmum,
    };

    await sendGradingCallback(result);
    console.log(`Grading selesai untuk submission ${payload.submission_id}`);
  } catch (err) {
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
