import { Request, Response } from "express";
import { GenerateSoalRequest } from "../types";
import { generateSoalWithGemini } from "../services/geminiService";

export async function handleGenerateSoalRequest(req: Request, res: Response) {
  const payload = req.body as GenerateSoalRequest;

  if (!payload?.prompt || typeof payload.prompt !== "string") {
    return res.status(400).json({ error: "Field 'prompt' wajib diisi" });
  }

  const history = Array.isArray(payload.history) ? payload.history : [];

  try {
    // Ini SINKRON (beda dengan /grade), karena frontend chat menunggu balasan langsung
    const { reply, draft } = await generateSoalWithGemini({ prompt: payload.prompt, history });
    return res.status(200).json({ reply, draft });
  } catch (err) {
    console.error("Generate soal gagal:", err);
    return res.status(500).json({ error: "Gagal menghasilkan draf soal, coba lagi." });
  }
}
