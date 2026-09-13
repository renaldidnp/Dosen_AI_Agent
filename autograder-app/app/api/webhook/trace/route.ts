import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upsertTrace } from "@/lib/grading-trace";

// Endpoint untuk Agent melaporkan progres langkah grading (live trace).
// Dipanggil fire-and-forget oleh agent; kegagalan di sini tidak boleh
// menggagalkan grading itu sendiri.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-agent-callback-secret");

  if (secret !== process.env.AGENT_CALLBACK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  }

  const { submission_id, step, status, detail, provider, model, duration_ms } = body;

  if (!submission_id || !step || !status) {
    return NextResponse.json({ error: "Field wajib: submission_id, step, status" }, { status: 400 });
  }

  const allowedSteps = ["download", "pass1", "pass2", "callback", "mail", "error"];
  if (!allowedSteps.includes(step)) {
    return NextResponse.json({ error: `step tidak dikenal: ${step}` }, { status: 400 });
  }

  try {
    const submission = await db.submission.findUnique({ where: { id: submission_id } });
    if (!submission) {
      return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
    }

    await upsertTrace(submission_id, step, {
      status,
      detail: typeof detail === "string" ? detail : null,
      provider: typeof provider === "string" ? provider : null,
      model: typeof model === "string" ? model : null,
      durationMs: typeof duration_ms === "number" && Number.isFinite(duration_ms) ? duration_ms : null,
    });

    return NextResponse.json({ message: "Trace tercatat" });
  } catch (err) {
    console.error("[trace] gagal menyimpan trace:", err);
    return NextResponse.json({ error: "Gagal menyimpan trace" }, { status: 500 });
  }
}