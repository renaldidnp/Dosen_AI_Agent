import { providers, ProviderAdapter } from "./providers";

export type GenerateJsonInput = {
  prompt: string;
  system?: string;
  temperature?: number;
};

// Urutan prioritas dari env LLM_PROVIDERS, contoh:
//   LLM_PROVIDERS="gemini,openrouter,groq"
// Provider pertama yang punya key & berhasil dipanggil yang dipakai.
function providerOrder(): string[] {
  const raw = process.env.LLM_PROVIDERS?.trim();
  if (!raw) return ["gemini"];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

class LLMClient {
  private list(): ProviderAdapter[] {
    return providers;
  }

  /**
   * Panggil LLM dari provider pertama yang tersedia sesuai LLM_PROVIDERS.
   * Kalau provider gagal (rate limit / error / timeout) → lanjut ke berikutnya.
   * Mengembalikan teks mentah (diharapkan JSON) seperti yang dihasilkan model.
   */
  async generateJson(input: GenerateJsonInput): Promise<string> {
    const { text } = await this.generateJsonDetailed(input);
    return text;
  }

  /** Sama dengan generateJson, tapi sekalian membawa info provider & model yang dipakai. */
  async generateJsonDetailed(
    input: GenerateJsonInput
  ): Promise<{ text: string; provider: string; model: string }> {
    const order = providerOrder();
    const errors: string[] = [];

    for (const name of order) {
      const provider = this.list().find((p) => p.name === name);
      if (!provider) {
        errors.push(`${name}: tidak terdaftar`);
        continue;
      }
      if (!provider.available()) {
        errors.push(`${name}: API key belum diset`);
        continue;
      }

      try {
        const raw = await provider.generateRaw(input);
        console.log(`[llm] ${name} (${provider.model}) sukses untuk prompt ${input.prompt.length} chars`);
        return { text: raw, provider: name, model: provider.model };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[llm] ${name} gagal: ${msg}`);
        errors.push(`${name}: ${msg}`);
      }
    }

    throw new Error(`Semua LLM provider gagal: ${errors.join(" ; ")}`);
  }

  /** Informasi konfigurasi aktif — dipakai untuk log saat agent start. */
  describe(): { order: string[]; providers: { name: string; model: string; available: boolean }[] } {
    const order = providerOrder();
    return {
      order,
      providers: this.list().map((p) => ({
        name: p.name,
        model: p.model,
        available: p.available(),
      })),
    };
  }
}

export const llmClient = new LLMClient();