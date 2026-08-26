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
};

type GradeResponse = {
  status: "processing" | "queued";
};

export async function triggerGrading(payload: GradeRequest): Promise<GradeResponse> {
  const res = await fetch(`${process.env.AGENT_API_URL}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Agent API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
