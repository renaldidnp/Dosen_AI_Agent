import { Request, Response } from "express";
import pdfParser from "pdf-parse";
import { GenerateSoalRequest } from "../types";
import { generateSoalDraft } from "../services/assistantService";

const MAX_CHARS = 120_000;

export async function handleGenerateSoalRequest(req: Request, res: Response) {
  const payload = req.body as GenerateSoalRequest;

  if (!payload?.prompt || typeof payload.prompt !== "string") {
    return res.status(400).json({ error: "Field 'prompt' wajib diisi" });
  }

  const history = Array.isArray(payload.history) ? payload.history : [];

  try {
    let materiText: string | undefined;
    let materiFilename: string | undefined;

    // Jika dosen mengunggah PDF materi, parse SEKARANG (stateless).
    // Teks hanya hidup di dalam request ini — tidak disimpan ke mana pun.
    if (payload.materi?.contentBase64 && payload.materi?.filename) {
      const buffer = Buffer.from(payload.materi.contentBase64, "base64");
      if (buffer.length > 0) {
        try {
          const parsed = await pdfParser(buffer);
          const raw = (parsed?.text ?? "").replace(/\s+/g, " ").trim();
          if (raw) {
            materiText = raw.length > MAX_CHARS ? raw.slice(0, MAX_CHARS) : raw;
            materiFilename = payload.materi.filename;
            console.log(`[generate-soal] Materi "${materiFilename}" diproses stateless (${materiText.length} chars, buffer kosong setelah request)`);
          }
        } catch (parseErr) {
          console.error("Gagal mengurai PDF materi:", parseErr);
          return res.status(422).json({
            reply: "Gagal membaca isi PDF. Pastikan file adalah PDF yang valid dan bukan gambar/scan.",
            draft: null,
          });
        }
      }
    }

    // Ini SINKRON (beda dengan /grade), karena frontend chat menunggu balasan langsung
    const { reply, draft } = await generateSoalDraft({
      prompt: payload.prompt,
      history,
      materiText,
      materiFilename,
    });
    return res.status(200).json({ reply, draft });
  } catch (err) {
    console.error("Generate soal gagal:", err);
    return res.status(500).json({ error: "Gagal menghasilkan draf soal, coba lagi." });
  }
}
