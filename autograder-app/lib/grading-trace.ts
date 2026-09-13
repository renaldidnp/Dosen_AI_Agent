import { db } from "@/lib/db";

export type TraceStatus = "running" | "done" | "error";

// Simpan trace "di tempat": kalau untuk (submission, step) yang sama masih ada
// trace ber-status `running`, maka statusnya kita perbarui jadi done/error —
// bukan membuat baris baru. Dengan begitu feed live trace menampilkan tiap
// langkah sekali saja: saat berjalan lalu berganti jadi selesai.
// Untuk run berikutnya (regrade), trace terakhir sudah done → dibuat baris baru.
export async function upsertTrace(
  submissionId: string,
  step: string,
  data: {
    status: TraceStatus;
    detail?: string | null;
    provider?: string | null;
    model?: string | null;
    durationMs?: number | null;
  },
): Promise<void> {
  if (data.status !== "running") {
    const latestRunning = await db.gradingTrace.findFirst({
      where: { submissionId, step, status: "running" },
      orderBy: { createdAt: "desc" },
    });

    if (latestRunning) {
      const updated = await db.gradingTrace.updateMany({
        where: { id: latestRunning.id, status: "running" },
        data: {
          status: data.status,
          detail: data.detail ?? null,
          provider: data.provider ?? null,
          model: data.model ?? null,
          durationMs:
            typeof data.durationMs === "number" && Number.isFinite(data.durationMs)
              ? Math.round(data.durationMs)
              : null,
        },
      });

      // Berhasil update di tempat → selesai.
      if (updated.count > 0) return;
      // Baris "running" keburu berubah (race) → lanjut buat baris baru.
    }
  }

  await db.gradingTrace.create({
    data: {
      submissionId,
      step,
      status: data.status,
      detail: data.detail ?? null,
      provider: data.provider ?? null,
      model: data.model ?? null,
      durationMs:
        typeof data.durationMs === "number" && Number.isFinite(data.durationMs)
          ? Math.round(data.durationMs)
          : null,
    },
  });
}