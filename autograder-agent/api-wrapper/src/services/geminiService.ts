import { RubrikIndikator, HasilIndikatorRaw, GenerateSoalRequest, SoalDraftResult, ChatHistoryItem } from "../types";

const GEMINI_MODEL = "gemini-3.6-flash"; // Sesuaikan dengan versi model yang stabil
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ==========================================
// 1. MODUL PENILAIAN JAWABAN MAHASISWA
// ==========================================

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

// ==========================================
// 2. MODUL GENERASI SOAL & RUBRIK
// ==========================================

const soalSchema = {
  type: "object",
  properties: {
    judul: { type: "string" },
    deskripsi: { type: "string" },
    indikator: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nama: { type: "string" },
          bobot: { type: "number" },
          rubrik: { type: "string" },
          skorMax: { type: "number" },
        },
        required: ["nama", "bobot", "rubrik", "skorMax"],
      },
    },
  },
  required: ["judul", "deskripsi", "indikator"],
};

function formatHistory(history: ChatHistoryItem[]): string {
  if (!history || history.length === 0) return "Tidak ada riwayat percakapan.";
  return history.map((h) => `${h.role === "user" ? "Dosen" : "Asisten"}: ${h.content}`).join("\n");
}

/**
 * Membuat draf soal ujian/tugas beserta indikator penilaian menggunakan Gemini.
 */
export async function generateSoalWithGemini(payload: GenerateSoalRequest): Promise<{ reply: string; draft: SoalDraftResult }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diset di .env");
  }

  const systemInstruction = `Anda adalah asisten dosen untuk menyusun soal ujian/tugas beserta indikator penilaiannya.
Total bobot semua indikator HARUS berjumlah tepat 100.
skorMax default 100 kecuali dosen minta lain.
Balas HANYA sesuai schema JSON yang diberikan, dalam Bahasa Indonesia.`;

  const conversationContext = formatHistory(payload.history);
  const fullPrompt = `${systemInstruction}\n\nRiwayat percakapan sebelumnya:\n${conversationContext}\n\nPermintaan terbaru dosen: ${payload.prompt}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: soalSchema,
        temperature: 0.7,
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
    throw new Error("Gemini tidak mengembalikan hasil draf soal yang valid");
  }

  const draft: SoalDraftResult = JSON.parse(rawText);

  // Guard tambahan: pastikan total bobot = 100, kalau tidak, normalisasi proporsional
  const totalBobot = draft.indikator.reduce((sum, i) => sum + i.bobot, 0);
  if (totalBobot > 0 && Math.round(totalBobot) !== 100) {
    draft.indikator = draft.indikator.map((i) => ({
      ...i,
      bobot: Math.round((i.bobot / totalBobot) * 100 * 100) / 100,
    }));
  }

  const reply = `Berikut draf soal "${draft.judul}" dengan ${draft.indikator.length} indikator penilaian. Silakan periksa, lalu klik "Gunakan draf ini di form" kalau sudah sesuai.`;

  return { reply, draft };
}
