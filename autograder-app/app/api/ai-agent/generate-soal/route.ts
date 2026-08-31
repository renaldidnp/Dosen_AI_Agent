import { NextRequest, NextResponse } from "next/server";

const AGENT_URL = process.env.AUTOGRADER_AGENT_URL ?? "http://localhost:4000";
const AGENT_SECRET = process.env.AGENT_SECRET;

export async function POST(req: NextRequest) {
  // TODO: ganti dengan pengecekan session dosen yang sesungguhnya
  // const session = await getServerSession(...);
  // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);

  if (!body?.prompt || typeof body.prompt !== "string") {
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
