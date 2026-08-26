import { Request, Response } from "express";
import { GradeRequest, GradingResult } from "../types";
import { downloadAndExtractPdfText } from "../services/driveService";
import { gradeWithGemini } from "../services/geminiService";
import { sendGradingCallback } from "../services/callbackService";

/**
 * Proses grading yang sebenarnya, dijalankan di background (tidak di-await
 * oleh handler HTTP) supaya Next.js tidak perlu menunggu lama.
 */
async function processGrading(payload: GradeRequest): Promise<void> {
  try {
    const jawabanText = await downloadAndExtractPdfText(payload.file_id);

    const { hasilIndikator, feedbackUmum } = await gradeWithGemini(jawabanText, payload.rubric);

    const skorTotal = hasilIndikator.reduce((total, h) => {
      const indikator = payload.rubric.find((r) => r.indikatorId === h.indikatorId);
      const bobot = indikator?.bobot ?? 0;
      const skorMax = indikator?.skorMax ?? 100;
      // Kontribusi skor indikator ini terhadap skor akhir, sesuai bobotnya
      return total + (h.skor / skorMax) * bobot;
    }, 0);

    // Gabungkan hasil dari Gemini dengan info "nama" dari rubric asli,
    // supaya bentuknya cocok dengan field skorPerIndikator di database
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
    // Opsional: kirim callback status "error" supaya Next.js tahu grading gagal
  }
}

export function handleGradeRequest(req: Request, res: Response) {
  const payload = req.body as GradeRequest;

  if (!payload?.submission_id || !payload?.file_id || !payload?.rubric) {
    return res.status(400).json({ error: "Payload tidak lengkap" });
  }

  // Jalankan di background, jangan di-await, supaya respons langsung dikirim
  processGrading(payload);

  return res.status(200).json({ status: "queued" });
}
