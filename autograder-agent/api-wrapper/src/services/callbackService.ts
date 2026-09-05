import { GradingResult, GradingErrorResult } from "../types";

async function postCallback(payload: Record<string, unknown>): Promise<void> {
  const callbackUrl = process.env.CALLBACK_URL;
  const secret = process.env.AGENT_CALLBACK_SECRET;

  if (!callbackUrl || !secret) {
    throw new Error("CALLBACK_URL atau AGENT_CALLBACK_SECRET belum diset di .env");
  }

  const res = await fetch(callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-callback-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Callback ke Next.js gagal: ${res.status} ${errText}`);
  }
}

export async function sendGradingCallback(result: GradingResult): Promise<void> {
  await postCallback({
    submission_id: result.submission_id,
    skor_total: result.skorTotal,
    skor_per_indikator: result.skorPerIndikator,
    feedback: result.feedback,
    status: "success",
  });
}

// Callback saat grading gagal total (retry habis, dsb). Endpoint Next.js
// (app/api/webhook/grade-callback/route.ts) perlu di-cek: kalau belum
// menangani field "status: error", tambahkan handling supaya submission
// ditandai gagal di database, bukan malah nyangkut "processing" selamanya.
export async function sendGradingErrorCallback(result: GradingErrorResult): Promise<void> {
  await postCallback({
    submission_id: result.submission_id,
    status: "error",
    error_message: result.errorMessage,
  });
}
