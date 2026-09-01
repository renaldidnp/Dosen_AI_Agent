"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Database, Users, Settings, Search, Terminal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Command", icon: Activity },
  { href: "/soal", label: "Soal_DB", icon: Database },
  { href: "/mahasiswa", label: "Nodes", icon: Users },
  { href: "/settings", label: "Config", icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050508] text-[#e4e1e9] font-sans selection:bg-[#00f0ff] selection:text-[#00363a]">
      {/* Ambient grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(0,240,255,0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(207,92,255,0.05) 0%, transparent 40%), linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
        }}
      />

      {/* Sidebar */}
      <nav className="bg-[#111118]/90 backdrop-blur-xl h-screen w-20 hover:w-64 transition-all duration-300 fixed left-0 top-0 z-50 border-r border-[#00f0ff]/10 flex flex-col py-6 items-center overflow-hidden group">
        <div className="mb-10 flex items-center w-full px-4 shrink-0">
          <div className="w-10 h-10 rounded-[4px] bg-[#00f0ff]/10 border border-[#00f0ff]/30 shrink-0 flex items-center justify-center text-[#00f0ff]">
            <Activity className="w-5 h-5" />
          </div>
          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <div className="font-semibold text-[#00f0ff] text-sm tracking-tight" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>
              SYS.ADM_01
            </div>
            <div className="text-[10px] text-[#8b949e] font-mono uppercase tracking-widest mt-1">Nexus // Eduportal</div>
          </div>
        </div>

        <div className="flex-1 w-full space-y-1 px-3 flex flex-col items-center group-hover:items-start">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`w-full flex items-center py-3 px-3 rounded-[4px] transition-colors border-l-2 ${
                  active
                    ? "text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10"
                    : "text-[#8b949e] border-transparent hover:bg-white/5 hover:text-[#00f0ff]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-mono text-xs uppercase tracking-wider">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 w-full px-4 shrink-0 flex items-center justify-center group-hover:justify-start">
          <div className="w-2 h-2 rounded-full bg-[#5bffa1] shrink-0" style={{ boxShadow: "0 0 8px rgba(91,255,161,0.8)" }} />
          <span className="ml-4 text-[10px] text-[#5bffa1] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Agent Core: Online
          </span>
        </div>
      </nav>

      {/* Main content */}
      <main className="ml-20 flex flex-col min-h-screen relative">
        {/* Top status bar */}
        <header className="bg-[#111118]/80 backdrop-blur-md border-b border-[#00f0ff]/20 flex justify-between items-center w-full px-6 h-14 z-40 sticky top-0 font-mono text-xs">
          <div className="flex items-center gap-6 text-[#8b949e]">
            <div className="flex items-center gap-2">
              <span className="text-[#00f0ff]">●</span>
              <span className="tracking-widest hidden sm:inline">SYS.ONLINE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-48 hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#00f0ff]/50" />
              <input
                className="w-full bg-black/40 border border-[#00f0ff]/20 rounded-[2px] focus:ring-1 focus:ring-[#00f0ff] focus:border-[#00f0ff] text-[#00f0ff] pl-7 py-1.5 text-[10px] uppercase placeholder-[#00f0ff]/30 transition-all font-mono outline-none"
                placeholder="Query database..."
                type="text"
              />
            </div>
            <button className="text-[#00f0ff] hover:text-white transition-colors">
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 relative z-10">{children}</div>
      </main>
    </div>
  );
}