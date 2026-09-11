import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// AGENT_API_URL adalah nama env canonical (dipakai juga di lib/agentClient.ts).
// AUTOGRADER_AGENT_URL dipertahankan sebagai fallback untuk legacy.
const AGENT_URL =
  process.env.AGENT_API_URL ?? process.env.AUTOGRADER_AGENT_URL ?? "http://localhost:4000";
const AGENT_SECRET = process.env.AGENT_SECRET;

const MAX_PDF_SIZE_MB = 15;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized. Cookie token tidak ditemukan." },
      { status: 401 }
    );
  }

  const user = await verifyToken(token);

  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Unauthorized. Token tidak valid atau kedaluwarsa." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body?.prompt || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json({ error: "Field 'prompt' wajib diisi" }, { status: 400 });
  }

  // Validasi materi jika disertakan
  let materiPayload: { filename: string; contentBase64: string } | undefined = undefined;

  if (body.materi) {
    const { filename, contentBase64 } = body.materi;

    if (!filename || typeof filename !== "string" || !filename.trim()) {
      return NextResponse.json({ error: "Nama file materi tidak valid." }, { status: 400 });
    }
    if (!filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Hanya file PDF yang didukung." }, { status: 400 });
    }
    if (typeof contentBase64 !== "string" || !contentBase64) {
      return NextResponse.json({ error: "Isi file materi kosong." }, { status: 400 });
    }

    // Perkiraan ukuran asli dari base64 (~75% dari panjang string base64)
    const approxBytes = Math.ceil(contentBase64.length * 0.75);
    if (approxBytes > MAX_PDF_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Ukuran file PDF maksimal ${MAX_PDF_SIZE_MB} MB.` },
        { status: 400 }
      );
    }

    materiPayload = { filename: filename.trim(), contentBase64 };
  }

  try {
    const res = await fetch(`${AGENT_URL}/generate-soal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-secret": AGENT_SECRET ?? "",
      },
      body: JSON.stringify({
        prompt: body.prompt,
        history: Array.isArray(body.history) ? body.history : [],
        materi: materiPayload ?? null,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const errPayload = await res.json().catch(() => null);
      console.error("Agent generate-soal gagal:", res.status, errText);
      return NextResponse.json(
        { reply: errPayload?.reply ?? errPayload?.error ?? "Maaf, AI agent gagal memproses permintaan. Coba lagi." },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Gagal menghubungi autograder-agent:", err);
    return NextResponse.json({ reply: "Maaf, tidak bisa menghubungi AI agent saat ini." }, { status: 502 });
  }
}
