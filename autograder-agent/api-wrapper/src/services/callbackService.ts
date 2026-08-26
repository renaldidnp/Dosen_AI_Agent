import { GradingResult } from "../types";

export async function sendGradingCallback(result: GradingResult): Promise<void> {
  const callbackUrl = process.env.CALLBACK_URL;
  const secret = process.env.AGENT_CALLBACK_SECRET;

  if (!callbackUrl || !secret) {
    throw new Error("CALLBACK_URL atau AGENT_CALLBACK_SECRET belum diset di .env");
  }

  // Next.js route mengharapkan snake_case (submission_id, skor_total,
  // skor_per_indikator), sedangkan GradingResult internal di agent pakai
  // camelCase. Konversi di sini supaya kedua sisi tetap konsisten dengan
  // gaya penamaan masing-masing tanpa perlu ubah struktur GradingResult.
  const payload = {
    submission_id: result.submission_id,
    skor_total: result.skorTotal,
    skor_per_indikator: result.skorPerIndikator,
    feedback: result.feedback,
  };

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
