import { GenerateJsonInput } from "./client";

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status >= 500;
}

function isNetworkError(err: Error): boolean {
  return err instanceof TypeError || err.name === "AbortError";
}

export type ProviderAdapter = {
  name: string;
  model: string;
  available(): boolean;
  generateRaw(input: GenerateJsonInput): Promise<string>;
};

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// ADAPTER: Google Gemini
// ==========================================
// Key diambil dari GEMINI_API_KEY (legacy) + GEMINI_API_KEY_1..9 untuk rotasi
// saat kena 429 rate limit.
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function geminiKeys(): string[] {
  const keys: string[] = [];
  const legacy = process.env.GEMINI_API_KEY?.trim();
  if (legacy) keys.push(legacy);
  for (let i = 1; i <= 9; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (k) keys.push(k);
  }
  return keys;
}

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
}

const geminiProvider: ProviderAdapter = {
  name: "gemini",
  get model() {
    return geminiModel();
  },
  available() {
    return geminiKeys().length > 0;
  },
  async generateRaw(input: GenerateJsonInput): Promise<string> {
    const keys = geminiKeys();
    if (keys.length === 0) {
      throw new Error("GEMINI_API_KEY belum diset");
    }

    const body: any = {
      contents: [{ parts: [{ text: input.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: input.temperature ?? 0.2,
      },
    };
    if (input.system) {
      body.systemInstruction = { parts: [{ text: input.system }] };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const key = keys[attempt % keys.length];
      const url = `${GEMINI_BASE}/models/${geminiModel()}:generateContent?key=${encodeURIComponent(key)}`;

      try {
        const res = await fetchWithTimeout(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!raw || !raw.trim()) {
            throw new Error("Gemini tidak mengembalikan hasil yang valid");
          }
          return raw;
        }

        const errText = await res.text();
        const isRetryable = retryableStatus(res.status);

        // Rate limit + masih ada key lain → putar key tanpa nunggu backoff
        if (res.status === 429 && keys.length > 1 && attempt < keys.length - 1) {
          lastError = new Error(`Gemini rate limit (key #${attempt + 1}), putar ke key berikutnya`);
          continue;
        }

        if (!isRetryable || attempt === MAX_RETRIES) {
          throw new Error(`Gemini API error: ${res.status} ${errText}`);
        }
        lastError = new Error(`Gemini API error: ${res.status}`);
      } catch (err) {
        const e = err as Error;
        if (isNetworkError(e)) {
          lastError = new Error(
            e.name === "AbortError"
              ? `Gemini timeout setelah ${REQUEST_TIMEOUT_MS / 1000}s`
              : `Gemini network error: ${e.message}`
          );
          if (attempt === MAX_RETRIES) throw lastError;
        } else {
          throw e;
        }
      }

      const delayMs = BASE_DELAY_MS * 2 ** attempt + Math.random() * 500;
      console.warn(
        `Gemini gagal (percobaan ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError?.message}. Retry dalam ${Math.round(delayMs)}ms...`
      );
      await sleep(delayMs);
    }

    throw lastError ?? new Error("Gemini gagal tanpa detail error");
  },
};

// ==========================================
// ADAPTER: OpenAI-compatible (OpenRouter, Groq, Together, dst.)
// ==========================================
// Satu factory dipakai untuk semua provider yang mengikuti format
// POST {base}/chat/completions dengan Bearer key.
function openaiCompatProvider(config: {
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  modelEnv: string;
  defaultModel: string;
}): ProviderAdapter {
  const { name, baseUrl, apiKeyEnv, modelEnv, defaultModel } = config;

  function apiKey(): string | null {
    return process.env[apiKeyEnv]?.trim() || null;
  }

  function model(): string {
    return process.env[modelEnv]?.trim() || defaultModel;
  }

  async function post(messages: any[], temperature: number, useJson: boolean): Promise<string> {
    const key = apiKey();
    if (!key) throw new Error(`${name}: ${apiKeyEnv} belum diset`);

    const body: any = {
      model: model(),
      messages,
      temperature,
    };
    if (useJson) body.response_format = { type: "json_object" };

    const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return content;
      throw new Error(`${name}: respons kosong/tidak valid`);
    }

    const errText = await res.text();
    const err = new Error(`${name} API error: ${res.status} ${errText}`);
    (err as any).status = res.status;
    throw err;
  }

  return {
    name,
    get model() {
      return model();
    },
    available() {
      return apiKey() !== null;
    },
    async generateRaw(input: GenerateJsonInput): Promise<string> {
      if (!apiKey()) throw new Error(`${name}: ${apiKeyEnv} belum diset`);

      const messages = [
        {
          role: "system",
          content:
            (input.system ? input.system + "\n\n" : "") +
            "Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code block.",
        },
        { role: "user", content: input.prompt },
      ];
      const temperature = input.temperature ?? 0.2;

      let lastError: Error | null = null;
      let jsonMode = true;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          try {
            return await post(messages, temperature, jsonMode);
          } catch (e) {
            const status = (e as any)?.status;
            // JSON mode ditolak model (400) → coba sekali tanpa response_format
            if (status === 400 && jsonMode) {
              jsonMode = false;
              return await post(messages, temperature, false);
            }
            throw e;
          }
        } catch (err) {
          const e = err as Error;
          const status = (e as any)?.status;

          if (isNetworkError(e)) {
            lastError = new Error(
              e.name === "AbortError"
                ? `${name} timeout setelah ${REQUEST_TIMEOUT_MS / 1000}s`
                : `${name} network error: ${e.message}`
            );
            if (attempt === MAX_RETRIES) throw lastError;
          } else if (retryableStatus(status)) {
            lastError = e;
            if (attempt === MAX_RETRIES) throw lastError;
          } else {
            throw e;
          }
        }

        const delayMs = BASE_DELAY_MS * 2 ** attempt + Math.random() * 500;
        console.warn(
          `${name} gagal (percobaan ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError?.message}. Retry dalam ${Math.round(delayMs)}ms...`
        );
        await sleep(delayMs);
      }

      throw lastError ?? new Error(`${name} gagal tanpa detail error`);
    },
  };
}

export const providers: ProviderAdapter[] = [
  geminiProvider,
  openaiCompatProvider({
    name: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "deepseek/deepseek-chat",
  }),
  openaiCompatProvider({
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
  }),
];