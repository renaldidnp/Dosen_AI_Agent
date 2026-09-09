import { GradingResult, GradingErrorResult } from "../types";

function traceUrl(): string {
  const cb = process.env.CALLBACK_URL ?? "";
  const custom = process.env.TRACE_URL?.trim();
  if (custom) return custom;
  // CALLBACK_URL biasanya ".../api/webhook/grade-callback" → ubah segmen terakhir
  // menjadi "/trace". Ganti cukup /grade-callback — kalau diganti dengan
  // "/api/webhook/trace", folder /api/webhook-nya ikut duplikat.
  return cb.replace(/\/grade-callback$/i, "/trace");
}

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
    direview_oleh: result.direviewOleh ?? null,
    review_aktif: result.reviewAktif ?? false,
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

// ──────────────────────────────────────────────────────────
// LIVE TRACE: laporkan progres langkah grading ke Next.js
// (fire-and-forget — kegagalan melapor tidak menggagalkan grading).
// ──────────────────────────────────────────────────────────

export type TraceStep = "download" | "pass1" | "pass2" | "callback" | "mail" | "error";

export async function reportTrace(params: {
  submissionId: string;
  step: TraceStep;
  status: "running" | "done" | "error";
  detail?: string;
  provider?: string;
  model?: string;
  durationMs?: number;
}): Promise<void> {
  const secret = process.env.AGENT_CALLBACK_SECRET;
  if (!secret) {
    console.warn("[trace] AGENT_CALLBACK_SECRET belum diset, trace dilewati.");
    return;
  }

  try {
    const res = await fetch(traceUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-callback-secret": secret,
      },
      body: JSON.stringify({
        submission_id: params.submissionId,
        step: params.step,
        status: params.status,
        detail: params.detail ?? null,
        provider: params.provider ?? null,
        model: params.model ?? null,
        duration_ms: params.durationMs ?? null,
      }),
    });

    if (!res.ok) {
      console.warn(`[trace] Lapor trace ditolak: ${res.status}`);
    }
  } catch (err) {
    console.warn("[trace] Gagal melapor trace:", err instanceof Error ? err.message : err);
  }
}
