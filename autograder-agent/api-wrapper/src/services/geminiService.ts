import { RubrikIndikator, HasilIndikatorRaw, GenerateSoalRequest, SoalDraftResult, ChatHistoryItem } from "../types";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000; // 30 detik per percobaan, jangan nunggu 5 menit default

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(body: unknown): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum diset di .env");
  }

  let lastError: Error = new Error("Gemini API gagal tanpa detail error");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        return res.json();
      }

      const errText = await res.text();
      lastError = new Error(`Gemini API error: ${res.status} ${errText}`);

      const isRetryable = res.status === 503 || res.status === 429;
      if (!isRetryable || attempt === MAX_RETRIES) {
        throw lastError;
      }
    } catch (err) {
      clearTimeout(timeoutId);

      // Network-level error (timeout, koneksi putus, DNS gagal, dll) — retryable juga
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetworkError = err instanceof TypeError || isAbort;

      if (isNetworkError) {
        lastError = new Error(isAbort ? `Gemini API timeout setelah ${REQUEST_TIMEOUT_MS / 1000}s` : `Gemini API network error: ${err instanceof Error ? err.message : String(err)}`);
        if (attempt === MAX_RETRIES) {
          throw lastError;
        }
        // lanjut ke retry di bawah
      } else {
        // Error non-network (misal dari `throw lastError` di atas untuk status non-ok) — jangan retry lagi
        throw err;
      }
    }

    const delayMs = BASE_DELAY_MS * 2 ** attempt + Math.random() * 500;
    console.warn(`Gemini gagal (percobaan ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError.message}. Retry dalam ${Math.round(delayMs)}ms...`);
    await sleep(delayMs);
  }

  throw lastError;
}

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

export async function gradeWithGemini(jawabanText: string, rubric: RubrikIndikator[]): Promise<{ hasilIndikator: HasilIndikatorRaw[]; feedbackUmum: string }> {
  const prompt = buildPrompt(jawabanText, rubric);

  const data = await callGeminiWithRetry({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

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

export async function generateSoalWithGemini(payload: GenerateSoalRequest): Promise<{ reply: string; draft: SoalDraftResult }> {
  const systemInstruction = `Anda adalah asisten dosen untuk menyusun soal ujian/tugas beserta indikator penilaiannya.
Total bobot semua indikator HARUS berjumlah tepat 100.
skorMax default 100 kecuali dosen minta lain.
Balas HANYA sesuai schema JSON yang diberikan, dalam Bahasa Indonesia.`;

  const conversationContext = formatHistory(payload.history);
  const fullPrompt = `${systemInstruction}\n\nRiwayat percakapan sebelumnya:\n${conversationContext}\n\nPermintaan terbaru dosen: ${payload.prompt}`;

  const data = await callGeminiWithRetry({
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: soalSchema,
      temperature: 0.7,
    },
  });

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini tidak mengembalikan hasil draf soal yang valid");
  }

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
