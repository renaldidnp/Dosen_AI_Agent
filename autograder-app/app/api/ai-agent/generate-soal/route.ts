import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// AGENT_API_URL adalah nama env canonical (dipakai juga di lib/agentClient.ts).
// AUTOGRADER_AGENT_URL dipertahankan sebagai fallback untuk legacy.
const AGENT_URL =
  process.env.AGENT_API_URL ?? process.env.AUTOGRADER_AGENT_URL ?? "http://localhost:4000";
const AGENT_SECRET = process.env.AGENT_SECRET;

export async function POST(req: NextRequest) {
  // 1. Ambil token JWT dari Cookie
  const token = req.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized. Cookie token tidak ditemukan." },
      { status: 401 }
    );
  }

  // 2. Verifikasi JWT Payload
  const user = await verifyToken(token);

  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Unauthorized. Token tidak valid atau kedaluwarsa." },
      { status: 401 }
    );
  }

  // 3. Ambil & validasi body
  const body = await req.json().catch(() => null);

  if (!body?.prompt || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json({ error: "Field 'prompt' wajib diisi" }, { status: 400 });
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
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Agent generate-soal gagal:", res.status, errText);
      return NextResponse.json({ reply: "Maaf, AI agent gagal memproses permintaan. Coba lagi." }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Gagal menghubungi autograder-agent:", err);
    return NextResponse.json({ reply: "Maaf, tidak bisa menghubungi AI agent saat ini." }, { status: 502 });
  }
}