"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, RefreshCw, Loader2, UploadCloud, Sparkles, AlertTriangle, CheckCheck, FileDown, BrainCircuit, ShieldCheck, Send, Mail } from "lucide-react";

type LogStatus = "running" | "queued" | "done";

type ApiLogEntry = {
  id: string;
  code: string;
  status: LogStatus;
  title: string;
  detail: string;
  createdAt: string;
  step?: string;
  durationMs?: number | null;
};

type LogEntry = ApiLogEntry & { timeLabel: string };

const STATUS_STYLE: Record<
  LogStatus,
  { label: string; className: string; icon: typeof UploadCloud }
> = {
  running: {
    label: "Berjalan",
    className: "text-[var(--accent-ink)] bg-[var(--accent-soft)] border-[var(--accent-border)]",
    icon: Sparkles,
  },
  queued: {
    label: "Antre",
    className: "text-[var(--warning-ink)] bg-[var(--warning-soft)] border-[var(--warning-border)]",
    icon: AlertTriangle,
  },
  done: {
    label: "Selesai",
    className: "text-[var(--success-ink)] bg-[var(--success-soft)] border-[var(--success-border)]",
    icon: CheckCheck,
  },
};

const STEP_ICON: Record<string, typeof FileDown> = {
  download: FileDown,
  pass1: BrainCircuit,
  pass2: ShieldCheck,
  callback: Send,
  mail: Mail,
  error: AlertTriangle,
};

function formatDuration(ms?: number | null): string {
  if (!ms || ms < 0) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const POLL_INTERVAL_MS = 6000;
const MAX_ENTRIES = 10;

export default function RealTimeLog({
  endpoint = "/api/dashboard/activity-log",
}: {
  endpoint?: string;
}) {
  // Render awal (server & client) selalu kosong/loading
  // agar tidak terjadi hydration mismatch.
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });

      if (res.status === 401) {
        setError("Sesi login Anda berakhir. Silakan login ulang untuk melihat log aktivitas.");
        setLoading(false);
        return "unauthorized" as const;
      }

      if (!res.ok) {
        throw new Error("Gagal memuat log");
      }

      const data: { entries: ApiLogEntry[] } = await res.json();

      const withTime = data.entries
        .slice(0, MAX_ENTRIES)
        .map((e) => ({
          ...e,
          timeLabel: new Date(e.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        }));

      setEntries(withTime);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat aktivitas terbaru");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

    useEffect(() => {
    let stopped = false;
    let interval: ReturnType<typeof setInterval>;

    async function tick() {
      const result = await load();
      if (result === "unauthorized" && !stopped) {
        clearInterval(interval);
      }
    }

    tick();
    interval = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [load]);

  return (
    <div
      className="
        bg-[var(--bg-panel)]
        border border-[var(--border)]
        rounded-2xl
        shadow-xs
        flex flex-col
        h-full
        transition-colors duration-300
        overflow-hidden
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
        <h2 className="font-heading text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <Zap className="w-[18px] h-[18px] text-[var(--accent)]" />
          Aktivitas Real-Time &amp; AI
        </h2>

        <span
          className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse"
          title="Tersinkron"
        />
      </div>

      {/* LOG CONTENT */}
      <div className="flex-1 divide-y divide-[var(--border-soft)] overflow-y-auto max-h-[360px] sm:max-h-[520px]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs py-10">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
            Memuat aktivitas...
          </div>
        ) : error ? (
          <div className="text-center text-xs text-[var(--danger-text)] py-10">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-xs text-[var(--text-muted)] py-10">
            Belum ada aktivitas submission.
          </div>
        ) : (
          entries.map((entry) => {
            const style = STATUS_STYLE[entry.status];
            const StatusIcon = (entry.step && STEP_ICON[entry.step]) || style.icon;
            const durasi = formatDuration(entry.durationMs);

            return (
              <div
                key={entry.id}
                className="px-5 py-3.5 transition-colors hover:bg-[var(--accent-soft)]/40 flex items-start gap-3"
              >
                <div
                  className={`
                    w-8 h-8 rounded-lg
                    flex items-center justify-center shrink-0 mt-0.5
                    ${style.className}
                  `}
                >
                  <StatusIcon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-wide">
                      {entry.code}
                    </span>

                    <span
                      className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0
                        ${style.className}
                      `}
                    >
                      {style.label}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-semibold leading-snug ${entry.status === "done" ? "text-[var(--text-muted)]" : "text-[var(--text)]"
                      }`}
                  >
                    {entry.title}
                  </h3>

                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{entry.detail}</p>

                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)] mt-1">
                    <span>{entry.timeLabel}</span>
                    {durasi && (
                      <span className="inline-flex items-center gap-1 text-[var(--accent-ink)] font-semibold">
                        <span>&middot;</span>
                        {durasi}
                      </span>
                    )}
                  </div>

                  {entry.status === "running" && (
                    <div className="mt-2 h-1.5 bg-[var(--border-soft)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] animate-pulse"
                        style={{ width: "70%" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REFRESH */}
      <button
        onClick={load}
        className="
          flex items-center justify-center gap-2
          text-[var(--text-muted)] hover:text-[var(--accent-ink)]
          hover:bg-[var(--accent-soft)]
          transition-colors
          text-xs font-bold
          py-3
          border-t border-[var(--border-soft)]
        "
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Muat Ulang Log
      </button>
    </div>
  );
}