import { llmClient } from "./llm/client";
import {
  RubrikIndikator,
  HasilIndikatorRaw,
  ReviewResult,
  ReviewIndikator,
  GenerateSoalRequest,
  SoalDraftResult,
  ChatHistoryItem,
} from "../types";

// ==========================================
// Prompt & parse ada di sini; pemilihan provider
// (Gemini / OpenRouter / Groq, failover otomatis)
// ditangani oleh src/services/llm/*. Nama fungsi
// sengaja netral-provider karena bisa memakai LLM apa pun.
// ==========================================

// ==========================================
// 1. MODUL PENILAIAN JAWABAN MAHASISWA (PASS 1)
// ==========================================

function buildGradePrompt(jawabanText: string, rubric: RubrikIndikator[], catatanTambahan?: string): { system: string; prompt: string } {
  const rubrikText = rubric.map((r) => `- indikatorId: "${r.indikatorId}", nama: "${r.nama}", bobot: ${r.bobot}%, skorMax: ${r.skorMax}\n  Kriteria: ${r.rubrik}`).join("\n");
  const catatanBlock = catatanTambahan && catatanTambahan.trim()
    ? `\nCATATAN DOSEN (wajib diperhatikan saat menilai):\n${catatanTambahan.trim()}\n`
    : "";

  return {
    system: "Kamu adalah Agent Penilai yang menilai jawaban mahasiswa secara objektif berdasarkan rubrik penilaian. Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block.",
    prompt: `JAWABAN MAHASISWA:
"""
${jawabanText}
"""

RUBRIK PENILAIAN:
${rubrikText}
${catatanBlock}
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

export async function gradeAnswer(jawabanText: string, rubric: RubrikIndikator[], catatanTambahan?: string): Promise<{ hasilIndikator: HasilIndikatorRaw[]; feedbackUmum: string; provider: string; model: string }> {
  const { system, prompt } = buildGradePrompt(jawabanText, rubric, catatanTambahan);

  const { text, provider, model } = await llmClient.generateJsonDetailed({ prompt, system, temperature: 0.2 });

  const parsed = JSON.parse(text);
  return {
    hasilIndikator: parsed.hasilIndikator,
    feedbackUmum: parsed.feedbackUmum ?? "",
    provider,
    model,
  };
}

// ==========================================
// 2. MODUL VERIFIKASI / TINJAUAN (PASS 2)
// ==========================================

function buildReviewPrompt(
  jawabanText: string,
  rubric: RubrikIndikator[],
  hasilPenilai: HasilIndikatorRaw[],
  catatanTambahan?: string
): { system: string; prompt: string } {
  const rubrikText = rubric.map((r) => `- indikatorId: "${r.indikatorId}", nama: "${r.nama}", bobot: ${r.bobot}%, skorMax: ${r.skorMax}\n  Kriteria: ${r.rubrik}`).join("\n");
  const hasilText = hasilPenilai.map((h) => `- ${h.indikatorId}: skor ${h.skor}, feedback: ${h.feedback}`).join("\n");
  const catatanBlock = catatanTambahan && catatanTambahan.trim()
    ? `\nCATATAN DOSEN (perhatikan saat memverifikasi):\n${catatanTambahan.trim()}\n`
    : "";

  return {
    system: "Kamu adalah Agent Peninjau yang berpikir kritis untuk memverifikasi penilaian yang dibuat Agent Penilai. Periksa ulang jawaban mahasiswa terhadap rubrik, lalu putuskan apakah skor Agent Penilai sudah tepat. Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block.",
    prompt: `JAWABAN MAHASISWA:
"""
${jawabanText}
"""

RUBRIK PENILAIAN:
${rubrikText}

${catatanBlock}
HASIL AGENT PENILAI (pass 1):
${hasilText}

Tugasmu: untuk SETIAP indikator, verifikasi apakah skor dan feedback Agent Penilai sudah sesuai dengan bukti di jawaban:
- "setuju": skor penilai sudah tepat, pakai skorAkhir = skor penilai.
- "koreksi": kamu menemukan kelebihan yang tidak dinilai / kekurangan yang tidak dihukum / kesalahan skor → beri skorAkhir yang lebih adil.
Hindari "koreksi" tanpa alasan yang kuat dan terpaku pada bukti.

Selain itu, beri "saran" per indikator: 1-2 kalimat langkah KONKRET yang bisa mahasiswa lakukan agar skor indikator ini naik (mis. materi yang harus dipelajari, perbaikan kode tertentu, bagian yang kurang lengkap). Berbahasa Indonesia, ramah dan spesifik terhadap jawabannya.

PENTING: Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block, dengan format persis seperti ini:
{
  "hasilIndikator": [
    { "indikatorId": "...", "keputusan": "setuju" | "koreksi", "skorAkhir": 0, "alasan": "...", "saran": "..." }
  ],
  "catatan": "..."
}`,
  };
}

export async function reviewAnswer(
  jawabanText: string,
  rubric: RubrikIndikator[],
  hasilPenilai: HasilIndikatorRaw[],
  catatanTambahan?: string
): Promise<ReviewResult & { provider: string; model: string }> {
  const { system, prompt } = buildReviewPrompt(jawabanText, rubric, hasilPenilai, catatanTambahan);

  const { text, provider, model } = await llmClient.generateJsonDetailed({ prompt, system, temperature: 0.1 });

  const parsed = JSON.parse(text);
  const hasilIndikator: ReviewIndikator[] = (Array.isArray(parsed.hasilIndikator) ? parsed.hasilIndikator : []).map(
    (item: ReviewIndikator) => ({
      indikatorId: item.indikatorId ?? "",
      keputusan: item.keputusan === "koreksi" ? "koreksi" : "setuju",
      skorAkhir: item.skorAkhir,
      alasan: item.alasan ?? "",
      saran: typeof item.saran === "string" && item.saran.trim() ? item.saran : "",
    })
  );
  return {
    hasilIndikator,
    catatan: parsed.catatan ?? "",
    provider,
    model,
  };
}

// ==========================================
// 3. MODUL GENERASI SOAL & RUBRIK
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

export async function generateSoalDraft(payload: GenerateSoalRequest): Promise<{ reply: string; draft: SoalDraftResult }> {
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