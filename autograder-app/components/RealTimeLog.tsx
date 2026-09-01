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
  createdAt: string; // ISO string dari server
};

type LogEntry = ApiLogEntry & { timeLabel: string };

const STATUS_STYLE: Record<LogStatus, { label: string; className: string }> = {
  running: { label: "RUNNING", className: "text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/40" },
  queued: { label: "QUEUED", className: "text-[#cf5cff] bg-[#cf5cff]/10 border-[#cf5cff]/40" },
  done: { label: "DONE", className: "text-[#8b949e] bg-white/5 border-white/10" },
};

const POLL_INTERVAL_MS = 6000;

export default function RealTimeLog({ endpoint = "/api/dashboard/activity-log" }: { endpoint?: string }) {
  // Render awal (server & client) SELALU kosong/loading -> tidak ada
  // teks yang bisa berbeda antara SSR dan CSR -> tidak ada hydration error.
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat log");
      const data: { entries: ApiLogEntry[] } = await res.json();

      // Format waktu HANYA setelah data diterima di client -> aman dari hydration mismatch
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
    <div className="bg-[#111118]/70 backdrop-blur-xl border border-[#00f0ff]/10 rounded-[4px] flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="font-mono text-sm text-[#e4e1e9] uppercase tracking-widest flex items-center gap-2">
          <Rss className="w-4 h-4 text-[#cf5cff]" />
          Real-Time Log
        </h2>
        <span className="w-2 h-2 rounded-full bg-[#cf5cff]" style={{ boxShadow: "0 0 8px rgba(207,92,255,0.8)" }} />
      </div>

      <div className="flex-1 divide-y divide-white/5 overflow-y-auto max-h-[520px]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[#8b949e] text-xs font-mono py-10">
            <Loader2 className="w-4 h-4 animate-spin text-[#00f0ff]" />
            Memuat aktivitas...
          </div>
        ) : error ? (
          <div className="text-center text-xs font-mono text-[#ffb4ab] py-10">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-xs font-mono text-[#8b949e] py-10">Belum ada aktivitas submission.</div>
        ) : (
          entries.map((entry) => {
            const style = STATUS_STYLE[entry.status];
            return (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#8b949e] uppercase tracking-wider">
                    {entry.code} // {entry.timeLabel}
                  </span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-[2px] border uppercase tracking-wider ${style.className}`}>
                    {style.label}
                  </span>
                </div>
                <h3 className={`text-sm font-medium ${entry.status === "done" ? "text-[#8b949e]" : "text-white"}`}>
                  {entry.title}
                </h3>
                <p className="text-xs text-[#8b949e] font-mono mt-0.5">{entry.detail}</p>

                {entry.status === "running" && (
                  <div className="mt-2 h-1 bg-white/5 rounded-[2px] overflow-hidden">
                    <div
                      className="h-full bg-[#00f0ff] animate-pulse"
                      style={{ width: "70%", boxShadow: "0 0 6px rgba(0,240,255,0.6)" }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={load}
        className="flex items-center justify-center gap-2 text-[#8b949e] hover:text-white hover:bg-white/5 transition-colors font-mono text-[10px] uppercase tracking-wider py-3 border-t border-white/5"
      >
        <History className="w-3.5 h-3.5" />
        Refresh Log
      </button>
    </div>
  );
}