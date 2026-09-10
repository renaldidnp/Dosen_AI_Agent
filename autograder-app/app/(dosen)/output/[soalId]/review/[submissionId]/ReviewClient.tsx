"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  CheckCircle2,
  CheckCheck,
  ExternalLink,
  FileDown,
  Loader2,
  RefreshCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type IndikatorReview = {
  keputusan: "setuju" | "koreksi";
  skorAwal: number;
  skorAkhir: number;
  alasan: string;
};

type IndikatorSkor = {
  indikatorId: string;
  nama: string;
  skor: number;
  catatan: string;
  review?: IndikatorReview | null;
  saran?: string | null;
};

type IndikatorDef = {
  id: string;
  nama: string;
  bobot: number;
  rubrik: string;
  skorMax: number;
};

function drivePreviewUrl(driveFileId: string | null, fallbackUrl: string) {
  if (!driveFileId) return fallbackUrl;
  return `https://drive.google.com/file/d/${driveFileId}/preview`;
}

const STATUS_INFO: Record<string, { label: string; color: string; desc?: string }> = {
  approved: {
    label: "Disetujui",
    color: "text-[var(--success-ink)] bg-[var(--success-soft)] border-[var(--success-border)]",
    desc: "Hasil ini sudah disetujui oleh dosen dan email telah dikirim ke mahasiswa.",
  },
  dikoreksi: {
    label: "Dikoreksi Dosen",
    color: "text-[var(--accent-ink)] bg-[var(--accent-soft)] border-[var(--accent-border)]",
    desc: "Hasil ini sudah dikoreksi manual oleh dosen dan email telah dikirim ke mahasiswa.",
  },
  dikirim_ulang: {
    label: "Menunggu Hasil AI Baru",
    color: "text-[var(--warning-ink)] bg-[var(--warning-soft)] border-[var(--warning-border)]",
    desc: "AI sedang mengoreksi ulang berdasarkan catatan dosen. Hasil baru akan muncul di sini.",
  },
  menunggu_review: {
    label: "Menunggu Review",
    color: "text-[var(--warning-ink)] bg-[var(--warning-soft)] border-[var(--warning-border)]",
    desc: "Hasil koreksi AI sudah masuk. Silakan setujui, koreksi manual, atau minta AI mengoreksi ulang.",
  },
};

export default function ReviewClient({
  soalId,
  submissionId,
  namaMahasiswa,
  nim,
  emailMahasiswa,
  status,
  driveFileUrl,
  driveFileId,
  indikatorDefs,
  skorTotal,
  feedback,
  direviewOleh,
  reviewAktif,
  reviewStatus,
  skorPerIndikator,
}: {
  soalId: string;
  submissionId: string;
  namaMahasiswa: string;
  nim: string;
  emailMahasiswa: string;
  status: string;
  driveFileUrl: string;
  driveFileId: string;
  indikatorDefs: IndikatorDef[];
  skorTotal: number;
  feedback: string;
  direviewOleh: string | null;
  reviewAktif: boolean;
  reviewStatus: string;
  skorPerIndikator: IndikatorSkor[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "correct" | "regrade">("idle");
  const [catatan, setCatatan] = useState("");

  const [editedSkor, setEditedSkor] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const s of skorPerIndikator) init[s.indikatorId] = s.skor;
    return init;
  });
  const [editedFeedback, setEditedFeedback] = useState(feedback);

  const statusInfo = STATUS_INFO[reviewStatus] ?? {
    label: reviewStatus || "Tidak Diketahui",
    color: "text-[var(--text-muted)] bg-[var(--border-soft)] border-[var(--border)]",
  };

  const defById = useMemo(() => {
    const map = new Map<string, IndikatorDef>();
    for (const d of indikatorDefs) map.set(d.id, d);
    return map;
  }, [indikatorDefs]);

  const computedTotal = useMemo(() => {
    let total = 0;
    for (const [indikatorId, skor] of Object.entries(editedSkor)) {
      const def = defById.get(indikatorId);
      if (!def) continue;
      const bobot = def.bobot ?? 0;
      const max = def.skorMax ?? 100;
      const val = Number.isFinite(skor) ? skor : 0;
      total += (val / max) * bobot;
    }
    return Math.round(total * 100) / 100;
  }, [editedSkor, defById]);

  async function runAction(action: "approve" | "correct" | "regrade", payload?: Record<string, unknown>) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/grading/${submissionId}/${action}`, {
        method: action === "regrade" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menjalankan aksi");
      setMode("idle");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(null);
    }
  }

  const canAct = reviewStatus === "menunggu_review";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* ════════════════════ KIRI: JAWABAN & RUBRIK ════════════════════ */}
      <div className="xl:col-span-7 space-y-6">
        {/* Info mahasiswa */}
        <section className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xs p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center text-sm font-extrabold shrink-0">
              {namaMahasiswa
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-sm font-bold text-[var(--text)] truncate">
                {namaMahasiswa}
              </h3>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {nim} &middot; {emailMahasiswa}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
            {statusInfo.desc}
          </p>
        </section>

        {/* Preview jawaban */}
        <section className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-soft)]">
            <h4 className="font-heading text-xs font-bold text-[var(--text)] flex items-center gap-2">
              <FileDown className="w-4 h-4 text-[var(--accent)]" />
              Jawaban Mahasiswa
            </h4>
            <a
              href={driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)] text-xs font-bold hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition-all"
            >
              Buka di Drive
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <iframe
            src={drivePreviewUrl(driveFileId, driveFileUrl)}
            title={`Jawaban ${namaMahasiswa}`}
            allow="autoplay"
            className="w-full h-[56vh] sm:h-[62vh] border-0 bg-white"
          />
        </section>

        {/* Rubrik */}
        <section className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xs p-5">
          <h4 className="font-heading text-xs font-bold text-[var(--text)] flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            Rubrik Penilaian
          </h4>
          <ul className="space-y-4">
            {indikatorDefs.map((d, idx) => (
              <li key={d.id} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {d.nama}
                    <span className="ml-2 text-[11px] font-bold text-[var(--text-muted)]">
                      bobot {d.bobot}% &middot; maks {d.skorMax}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{d.rubrik}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ════════════════════ KANAN: HASIL AI & AKSI ════════════════════ */}
      <div className="xl:col-span-5 space-y-6">
        {/* Ringkasan skor AI */}
        <section className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xs p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading text-xs font-bold text-[var(--text)]">
                Hasil Koreksi AI
              </h4>
              {direviewOleh && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  {direviewOleh}
                  {reviewAktif ? "" : " (tanpa Peninjau)"}
                </p>
              )}
            </div>
            <div className="ml-auto text-right shrink-0">
              <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider block">
                Skor Total
              </span>
              <span className="text-2xl font-extrabold text-[var(--text)]">{skorTotal}</span>
            </div>
          </div>

          <ul className="space-y-3">
            {skorPerIndikator.map((s) => {
              const def = defById.get(s.indikatorId);
              const max = def?.skorMax ?? 100;
              const pct = Math.min(100, (s.skor / max) * 100);
              return (
                <li key={s.indikatorId}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text)]">{s.nama}</span>
                    <span className="text-xs font-bold text-[var(--text-muted)] shrink-0">
                      {s.skor} / {max}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border-soft)] rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {s.review && s.review.keputusan === "koreksi" && (
                    <p className="text-[11px] text-[var(--warning-ink)] mt-1">
                      Peninjau: {s.review.skorAwal} &#8594; {s.review.skorAkhir}. {s.review.alasan}
                    </p>
                  )}
                  {s.catatan && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.catatan}</p>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
            <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider mb-1">
              Feedback AI
            </p>
            <p className="text-xs text-[var(--text-muted)] whitespace-pre-line leading-relaxed">
              {feedback}
            </p>
          </div>
        </section>

        {/* Panel aksi dosen */}
        <section className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xs p-5">
          <h4 className="font-heading text-xs font-bold text-[var(--text)] mb-4">
            Tindakan Dosen
          </h4>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-xs font-semibold text-[var(--danger-text)]">
              {error}
            </div>
          )}

          {!canAct ? (
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg)] px-4 py-4 text-xs text-[var(--text-muted)]">
              {reviewStatus === "approved" ? (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success-ink)]" />
                  Hasil telah disetujui & email terkirim. Tidak ada aksi tambahan.
                </p>
              ) : reviewStatus === "dikoreksi" ? (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-ink)]" />
                  Hasil telah dikoreksi manual & email terkirim. Tidak ada aksi tambahan.
                </p>
              ) : reviewStatus === "dikirim_ulang" ? (
                <p className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-[var(--warning-ink)]" />
                  AI sedang mengoreksi ulang. Bersabarlah, hasil baru akan masuk otomatis.
                </p>
              ) : (
                <p>Tidak ada aksi yang tersedia untuk status ini.</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => runAction("approve")}
                  disabled={busy !== null}
                  className="
                    flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                    bg-[var(--success)] text-white text-sm font-bold
                    hover:opacity-90 disabled:opacity-50 transition-all
                  "
                >
                  {busy === "approve" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  Setujui & Kirim Email ke Mahasiswa
                </button>

                <button
                  onClick={() => setMode(mode === "correct" ? "idle" : "correct")}
                  disabled={busy !== null}
                  className="
                    flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                    border border-[var(--accent-border)] bg-[var(--accent-soft)]
                    text-[var(--accent-ink)] text-sm font-bold
                    hover:bg-[var(--accent)] hover:text-[var(--accent-fg)]
                    disabled:opacity-50 transition-all
                  "
                >
                  {mode === "correct" ? "Batal Koreksi" : "Koreksi Manual"}
                </button>

                <button
                  onClick={() => setMode(mode === "regrade" ? "idle" : "regrade")}
                  disabled={busy !== null}
                  className="
                    flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                    border border-[var(--warning-border)] bg-[var(--warning-soft)]
                    text-[var(--warning-ink)] text-sm font-bold
                    hover:bg-[var(--warning)] hover:text-white
                    disabled:opacity-50 transition-all
                  "
                >
                  <RefreshCcw className="w-4 h-4" />
                  Minta AI Koreksi Ulang
                </button>
              </div>

              {/* Form koreksi manual */}
              {mode === "correct" && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg)] p-4 space-y-3">
                    <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">
                      Ubah Skor per Indikator
                    </p>
                    {skorPerIndikator.map((s) => {
                      const def = defById.get(s.indikatorId);
                      const max = def?.skorMax ?? 100;
                      return (
                        <label key={s.indikatorId} className="flex items-center gap-3 text-xs">
                          <span className="flex-1 min-w-0 font-semibold text-[var(--text)] truncate" title={s.nama}>
                            {s.nama}
                          </span>
                          <span className="text-[var(--text-faint)]">/ {max}</span>
                          <input
                            type="number"
                            min={0}
                            max={max}
                            step={0.5}
                            value={editedSkor[s.indikatorId] ?? 0}
                            onChange={(e) =>
                              setEditedSkor((prev) => ({
                                ...prev,
                                [s.indikatorId]: Number(e.target.value),
                              }))
                            }
                            className="
                              w-24 rounded-lg border border-[var(--border)]
                              bg-[var(--bg-panel)] px-2 py-1.5 text-sm font-bold
                              text-[var(--text)] focus:outline-none
                              focus:border-[var(--accent)] focus:ring-2
                              focus:ring-[var(--accent-border)]
                            "
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider mb-1.5">
                      Feedback untuk Mahasiswa
                    </p>
                    <textarea
                      value={editedFeedback}
                      onChange={(e) => setEditedFeedback(e.target.value)}
                      rows={5}
                      className="
                        w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]
                        px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none
                        focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-border)]
                      "
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider block">
                        Skor Total (otomatis)
                      </span>
                      <span className="text-xl font-extrabold text-[var(--text)]">{computedTotal}</span>
                    </div>
                    <button
                      onClick={() => {
                        const corrected = skorPerIndikator.map((s) => ({
                          indikatorId: s.indikatorId,
                          nama: s.nama,
                          skor: Number.isFinite(editedSkor[s.indikatorId])
                            ? editedSkor[s.indikatorId]
                            : 0,
                          catatan: s.catatan,
                          saran: s.saran ?? null,
                          review: s.review ?? null,
                        }));
                        void runAction("correct", {
                          skorPerIndikator: corrected,
                          feedback: editedFeedback,
                          skorTotal: computedTotal,
                        });
                      }}
                      disabled={busy !== null}
                      className="
                        inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                        bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-bold
                        hover:opacity-90 disabled:opacity-50 transition-all
                      "
                    >
                      {busy === "correct" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Simpan & Kirim Email
                    </button>
                  </div>
                </div>
              )}

              {/* Form regrade */}
              {mode === "regrade" && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[var(--warning-border)] bg-[var(--warning-soft)]/60 px-4 py-3">
                    <p className="text-xs text-[var(--warning-ink)] leading-relaxed">
                      <ShieldAlert className="inline w-3.5 h-3.5 mr-1" />
                      AI akan menilai ulang jawaban ini. Tuliskan catatan agar penilaian
                      mengikuti arahan Anda. Hasil baru akan menunggu review lagi.
                    </p>
                  </div>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={4}
                    placeholder="Contoh: periksa kembali bagian kesimpulan, nilai lebih ketat pada indikator ketepatan jawaban, dsb."
                    className="
                      w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]
                      px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none
                      focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-border)]
                    "
                  />
                  <button
                    onClick={() => runAction("regrade", { catatanTambahan: catatan })}
                    disabled={busy !== null || !catatan.trim()}
                    className="
                      flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                      bg-[var(--warning)] text-white text-sm font-bold
                      hover:opacity-90 disabled:opacity-40 transition-all
                    "
                  >
                    {busy === "regrade" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-4 h-4" />
                    )}
                    Kirim ke AI untuk Koreksi Ulang
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}