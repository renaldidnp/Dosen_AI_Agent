"use client";

import { useCallback, useEffect, useState } from "react";
import { Rss, History, Loader2 } from "lucide-react";

type LogStatus = "running" | "queued" | "done";

type ApiLogEntry = {
  id: string;
  code: string;
  status: LogStatus;
  title: string;
  detail: string;
  createdAt: string;
};

type LogEntry = ApiLogEntry & { timeLabel: string };

const STATUS_STYLE: Record<
  LogStatus,
  { label: string; className: string }
> = {
  running: {
    label: "RUNNING",
    className:
      "text-[var(--accent-ink)] bg-[var(--accent-soft)] border-[var(--accent-border)]",
  },
  queued: {
    label: "QUEUED",
    className:
      "text-[var(--text)] bg-[var(--bg-panel)] border-[var(--border-strong)]",
  },
  done: {
    label: "DONE",
    className:
      "text-[var(--text-muted)] bg-[var(--bg)] border-[var(--border-soft)]",
  },
};

const POLL_INTERVAL_MS = 6000;

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

      if (!res.ok) {
        throw new Error("Gagal memuat log");
      }

      const data: { entries: ApiLogEntry[] } = await res.json();

      // Format waktu hanya setelah data diterima di client.
      const withTime = data.entries.map((e) => ({
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
    load();

    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [load]);

  return (
    <div
      className="
        bg-[var(--bg-panel-translucent)]
        backdrop-blur-xl
        border border-[var(--border)]
        rounded-[4px]
        flex flex-col
        h-full
        transition-colors duration-300
      "
    >
      {/* HEADER */}
      <div
        className="
          flex items-center justify-between
          px-4 py-3
          border-b border-[var(--border-soft)]
        "
      >
        <h2
          className="
            font-mono
            text-sm
            text-[var(--text)]
            uppercase
            tracking-widest
            flex items-center gap-2
          "
        >
          <Rss className="w-4 h-4 text-[var(--accent)]" />
          Real-Time Log
        </h2>

        <span
          className="
            w-2 h-2
            rounded-full
            bg-[var(--accent)]
            animate-pulse
          "
          style={{
            boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 80%, transparent)",
          }}
        />
      </div>

      {/* LOG CONTENT */}
      <div
        className="
          flex-1
          divide-y divide-[var(--border-soft)]
          overflow-y-auto
          max-h-[520px]
        "
      >
        {loading ? (
          <div
            className="
              flex items-center justify-center gap-2
              text-[var(--text-muted)]
              text-xs
              font-mono
              py-10
            "
          >
            <Loader2
              className="
                w-4 h-4
                animate-spin
                text-[var(--accent)]
              "
            />
            Memuat aktivitas...
          </div>
        ) : error ? (
          <div
            className="
              text-center
              text-xs
              font-mono
              text-[var(--danger-text)]
              py-10
            "
          >
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="
              text-center
              text-xs
              font-mono
              text-[var(--text-muted)]
              py-10
            "
          >
            Belum ada aktivitas submission.
          </div>
        ) : (
          entries.map((entry) => {
            const style = STATUS_STYLE[entry.status];

            return (
              <div
                key={entry.id}
                className="
                  px-4 py-3
                  transition-colors
                  hover:bg-[var(--accent-soft)]
                "
              >
                {/* CODE + TIME + STATUS */}
                <div className="flex items-center justify-between mb-1 gap-3">
                  <span
                    className="
                      font-mono
                      text-[10px]
                      text-[var(--text-faint)]
                      uppercase
                      tracking-wider
                    "
                  >
                    {entry.code} // {entry.timeLabel}
                  </span>

                  <span
                    className={`
                      font-mono
                      text-[9px]
                      px-1.5 py-0.5
                      rounded-[2px]
                      border
                      uppercase
                      tracking-wider
                      shrink-0
                      ${style.className}
                    `}
                  >
                    {style.label}
                  </span>
                </div>

                {/* TITLE */}
                <h3
                  className={`
                    text-sm
                    font-medium
                    ${
                      entry.status === "done"
                        ? "text-[var(--text-muted)]"
                        : "text-[var(--text)]"
                    }
                  `}
                >
                  {entry.title}
                </h3>

                {/* DETAIL */}
                <p
                  className="
                    text-xs
                    text-[var(--text-muted)]
                    font-mono
                    mt-0.5
                  "
                >
                  {entry.detail}
                </p>

                {/* RUNNING PROGRESS */}
                {entry.status === "running" && (
                  <div
                    className="
                      mt-2
                      h-1
                      bg-[var(--border-soft)]
                      rounded-[2px]
                      overflow-hidden
                    "
                  >
                    <div
                      className="
                        h-full
                        bg-[var(--accent)]
                        animate-pulse
                      "
                      style={{
                        width: "70%",
                        boxShadow:
                          "0 0 6px color-mix(in srgb, var(--accent) 60%, transparent)",
                      }}
                    />
                  </div>
                )}
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
          text-[var(--text-muted)]
          hover:text-[var(--text)]
          hover:bg-[var(--accent-soft)]
          transition-colors
          font-mono
          text-[10px]
          uppercase
          tracking-wider
          py-3
          border-t border-[var(--border-soft)]
        "
      >
        <History className="w-3.5 h-3.5" />
        Refresh Log
      </button>
    </div>
  );
}