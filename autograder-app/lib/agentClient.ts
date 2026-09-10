type GradeRequest = {
  submission_id: string;
  file_id: string;
  rubric: {
    indikatorId: string;
    nama: string;
    bobot: number;
    rubrik: string;
    skorMax: number;
  }[];
  catatan_tambahan?: string;
};

type GradeResponse = {
  status: "processing" | "queued";
};

export async function triggerGrading(payload: GradeRequest): Promise<GradeResponse> {
  // 1. Validasi env var dulu — ini penyebab paling umum & paling membingungkan kalau tidak dicek eksplisit
  const agentUrl = process.env.AGENT_API_URL;
  if (!agentUrl) {
    console.error("[agentClient] AGENT_API_URL tidak ter-set di environment variables");
    throw new Error("AGENT_API_URL tidak ter-set. Cek file .env / .env.local");
  }

  const agentSecret = process.env.AGENT_SECRET;
  if (!agentSecret) {
    console.error("[agentClient] AGENT_SECRET tidak ter-set di environment variables");
    throw new Error("AGENT_SECRET tidak ter-set. Cek file .env / .env.local");
  }

  const endpoint = `${agentUrl}/grade`;

  console.log("[agentClient] Mengirim request grading:", {
    endpoint,
    submission_id: payload.submission_id,
    file_id: payload.file_id,
    jumlahIndikator: payload.rubric.length,
  });

  // 2. Timeout eksplisit — biar kalau agent hang, errornya jelas "timeout", bukan menggantung tanpa kepastian
  const controller = new AbortController();
  const timeoutMs = 15000; // sesuaikan kalau grading butuh waktu lebih lama untuk mulai
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-secret": agentSecret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Bedakan timeout vs network error lain (connection refused, DNS gagal, dll)
    if (err.name === "AbortError") {
      console.error(`[agentClient] Request timeout setelah ${timeoutMs}ms ke ${endpoint}`);
      throw new Error(`Agent API timeout setelah ${timeoutMs}ms — cek apakah agent sedang jalan di ${agentUrl}`);
    }

    console.error("[agentClient] Network error saat menghubungi agent:", {
      endpoint,
      errorName: err.name,
      errorMessage: err.message,
      cause: err.cause,
    });
    throw new Error(`Gagal menghubungi Agent API di ${endpoint}: ${err.message}`);
  }

  clearTimeout(timeoutId);

  console.log("[agentClient] Response diterima:", {
    status: res.status,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[agentClient] Agent API mengembalikan error:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText,
    });
    throw new Error(`Agent API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  console.log("[agentClient] Grading berhasil dipicu:", data);
  return data;
}
