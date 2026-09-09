import { llmClient } from "./llm/client";
import { RubrikIndikator, HasilIndikatorRaw, GenerateSoalRequest, SoalDraftResult, ChatHistoryItem } from "../types";

// ==========================================
// Prompt & parse ada di sini; pemilihan provider
// (Gemini / OpenRouter / Groq, failover otomatis)
// ditangani oleh src/services/llm/*.
// ==========================================

// ==========================================
// 1. MODUL PENILAIAN JAWABAN MAHASISWA
// ==========================================

function buildGradePrompt(jawabanText: string, rubric: RubrikIndikator[]): { system: string; prompt: string } {
  const rubrikText = rubric.map((r) => `- indikatorId: "${r.indikatorId}", nama: "${r.nama}", bobot: ${r.bobot}%, skorMax: ${r.skorMax}\n  Kriteria: ${r.rubrik}`).join("\n");

  return {
    system: "Kamu adalah asisten dosen yang menilai jawaban mahasiswa berdasarkan rubrik penilaian. Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block.",
    prompt: `JAWABAN MAHASISWA:
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
}`,
  };
}

export async function gradeWithGemini(jawabanText: string, rubric: RubrikIndikator[]): Promise<{ hasilIndikator: HasilIndikatorRaw[]; feedbackUmum: string }> {
  const { system, prompt } = buildGradePrompt(jawabanText, rubric);

  const rawText = await llmClient.generateJson({ prompt, system, temperature: 0.2 });

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

export async function generateSoalWithGemini(payload: GenerateSoalRequest): Promise<{ reply: string; draft: SoalDraftResult }> {
  const system = `Anda adalah asisten dosen untuk menyusun soal ujian/tugas beserta indikator penilaiannya.
Total bobot semua indikator HARUS berjumlah tepat 100.
skorMax default 100 kecuali dosen minta lain.
Balas HANYA sesuai schema JSON yang diberikan, dalam Bahasa Indonesia.

Schema JSON yang HARUS diikuti persis:
${JSON.stringify(soalSchema)}`;

  const conversationContext = formatHistory(payload.history);
  const prompt = `Riwayat percakapan sebelumnya:\n${conversationContext}\n\nPermintaan terbaru dosen: ${payload.prompt}`;

  const rawText = await llmClient.generateJson({ prompt, system, temperature: 0.7 });

  const draft: SoalDraftResult = JSON.parse(rawText);

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