import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAppsScriptTemplate } from "@/lib/apps-script-template";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized. Cookie token tidak ditemukan." }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized. Token tidak valid atau kedaluwarsa." }, { status: 401 });
  }

  const kelas = await db.kelas.findUnique({ where: { id: params.id } });
  if (!kelas) {
    return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
  }
  if (!kelas.googleFormId) {
    return NextResponse.json(
      { error: "Kelas ini belum punya Google Form. Buat form dulu sebelum generate script." },
      { status: 400 },
    );
  }
  if (!process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "WEBHOOK_SECRET belum diset di server." }, { status: 500 });
  }

  const webhookUrl = `${req.nextUrl.origin}/api/webhook/form-submit`;

  const script = generateAppsScriptTemplate({
    formId: kelas.googleFormId,
    kelasId: kelas.id,
    webhookUrl,
    webhookSecret: process.env.WEBHOOK_SECRET,
  });

  return NextResponse.json({ script });
}