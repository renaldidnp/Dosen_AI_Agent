"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

const LANDSCAPE_Q = "[@media(max-width:900px)_and_(max-height:640px)_and_(orientation:landscape)]";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.26A11.97 11.97 0 000 12c0 1.93.46 3.76 1.26 5.38l4.01-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.62l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  function handleGoogleLogin() {
    setGoogleLoading(true);
    // Arahkan ke endpoint OAuth Google Anda.
    // Kalau pakai NextAuth: ganti dengan signIn("google", { callbackUrl: "/dashboard" })
    window.location.href = "/api/auth/google";
  }

  return (
    <div
      className={`h-dvh w-full bg-[#0a0a0f] relative overflow-x-hidden flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 ${LANDSCAPE_Q}:py-4 ${LANDSCAPE_Q}:items-start`}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Panel */}
        <div className={`relative bg-[#111118]/80 backdrop-blur-xl border border-[#00f0ff]/15 rounded-[4px] p-6 sm:p-8 ${LANDSCAPE_Q}:p-5`}>
          {/* Corner brackets */}
          <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
          <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

          {/* Header */}
          <div className={`mb-7 ${LANDSCAPE_Q}:mb-4`}>
            <div className={`font-mono text-[11px] text-[#00f0ff] tracking-widest uppercase flex items-center gap-2 mb-3 ${LANDSCAPE_Q}:mb-1.5`}>
              <span
                className="w-1.5 h-1.5 bg-[#00f0ff] rounded-[2px]"
                style={{ boxShadow: "0 0 8px rgba(0,240,255,1)" }}
              />
              Nexus Access
            </div>
            <h1 className={`font-semibold text-[26px] sm:text-[28px] text-white leading-tight tracking-tight ${LANDSCAPE_Q}:text-[22px]`}>
              Masuk ke <span className="text-[#00f0ff]" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Dashboard_</span>
            </h1>
            <p className={`text-sm text-[#8b949e] mt-1.5 ${LANDSCAPE_Q}:hidden`}>Masukkan kredensial Anda untuk melanjutkan.</p>
          </div>

          {/* Error */}
          {error && (
            <div className={`mb-5 ${LANDSCAPE_Q}:mb-3 border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 text-[#ff8fa8] text-sm rounded-[2px] px-3 py-2.5 font-mono`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${LANDSCAPE_Q}:gap-3`}>
            {/* Email */}
            <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
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
                  className={`w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-3 py-2.5 ${LANDSCAPE_Q}:py-2 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all`}
                />
              </div>
            </div>

            {/* Password */}
            <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
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
                  className={`w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-10 py-2.5 ${LANDSCAPE_Q}:py-2 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all`}
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
              className={`mt-2 ${LANDSCAPE_Q}:mt-1 inline-flex items-center justify-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] font-mono text-xs px-4 py-2.5 ${LANDSCAPE_Q}:py-2 rounded-[2px] uppercase tracking-wider hover:bg-[#00f0ff]/20 transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  LOGIN
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={`flex items-center gap-3 my-5 ${LANDSCAPE_Q}:my-3`}>
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] text-[#6b7280] uppercase tracking-widest">atau</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className={`w-full inline-flex items-center justify-center gap-2.5 bg-white/5 border border-white/15 text-white font-mono text-xs px-4 py-2.5 ${LANDSCAPE_Q}:py-2 rounded-[2px] uppercase tracking-wider hover:bg-white/10 hover:border-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Masuk dengan Google
          </button>

          {/* Footer */}
          <p className={`text-center text-sm text-[#8b949e] mt-7 ${LANDSCAPE_Q}:mt-4`}>
            Belum punya akun?{" "}
            <Link href="/auth/register" className="text-[#00f0ff] hover:underline underline-offset-4">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}