import { RubrikIndikator, HasilIndikatorRaw } from "../types";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(jawabanText: string, rubric: RubrikIndikator[]): string {
  const rubrikText = rubric.map((r) => `- indikatorId: "${r.indikatorId}", nama: "${r.nama}", bobot: ${r.bobot}%, skorMax: ${r.skorMax}\n  Kriteria: ${r.rubrik}`).join("\n");

  return `Kamu adalah asisten dosen yang menilai jawaban mahasiswa berdasarkan rubrik penilaian.

JAWABAN MAHASISWA:
"""
${jawabanText}
"""

RUBRIK PENILAIAN:
${rubrikText}

Nilai jawaban mahasiswa di atas untuk SETIAP indikator pada rubrik. Berikan skor (angka, maksimal sesuai skorMax masing-masing indikator) dan feedback singkat per indikator.

PENTING: Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block, dengan format persis seperti ini:
{
  "hasilIndikator": [
    { "indikatorId": "...", "skor": 0, "feedback": "..." }
  ],
  "feedbackUmum": "..."
}`;
}

/**
 * Kirim jawaban mahasiswa + rubrik ke Gemini, dapatkan hasil penilaian per indikator.
 */
export async function gradeWithGemini(jawabanText: string, rubric: RubrikIndikator[]): Promise<{ hasilIndikator: HasilIndikatorRaw[]; feedbackUmum: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diset di .env");
  }

  const prompt = buildPrompt(jawabanText, rubric);

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini tidak mengembalikan hasil yang valid");
  }

  const parsed = JSON.parse(rawText);
  return {
    hasilIndikator: parsed.hasilIndikator,
    feedbackUmum: parsed.feedbackUmum ?? "",
  };
}
