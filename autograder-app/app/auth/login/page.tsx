"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Email atau password salah.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Panel */}
      <div className="relative bg-[#111118]/80 backdrop-blur-xl border border-[#00f0ff]/15 rounded-[4px] p-6 sm:p-8">
        {/* Corner brackets */}
        <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
        <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

        {/* Header */}
        <div className="mb-7">
          <div className="font-mono text-[11px] text-[#00f0ff] tracking-widest uppercase flex items-center gap-2 mb-3">
            <span
              className="w-1.5 h-1.5 bg-[#00f0ff] rounded-[2px]"
              style={{ boxShadow: "0 0 8px rgba(0,240,255,1)" }}
            />
            Nexus Access
          </div>
          <h1 className="font-semibold text-[26px] sm:text-[28px] text-white leading-tight tracking-tight">
            Masuk ke <span className="text-[#00f0ff]" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Dashboard_</span>
          </h1>
          <p className="text-sm text-[#8b949e] mt-1.5">Masukkan kredensial Anda untuk melanjutkan.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 text-[#ff8fa8] text-sm rounded-[2px] px-3 py-2.5 font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] group-focus-within:text-[#00f0ff] transition-colors" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@kampus.ac.id"
                className="w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-[11px] text-[#00f0ff]/80 hover:text-[#00f0ff] transition-colors">
                Lupa password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] group-focus-within:text-[#00f0ff] transition-colors" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#00f0ff] transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] font-mono text-xs px-4 py-2.5 rounded-[2px] uppercase tracking-wider hover:bg-[#00f0ff]/20 transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-[#8b949e] mt-7">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="text-[#00f0ff] hover:underline underline-offset-4">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}