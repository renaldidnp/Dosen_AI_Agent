"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import { Eye, EyeOff, Lock, Mail, Loader2, GraduationCap } from "lucide-react";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const LANDSCAPE_Q = "[@media(max-width:900px)_and_(max-height:640px)_and_(orientation:landscape)]";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.26A11.97 11.97 0 000 12c0 1.93.46 3.76 1.26 5.38l4.01-3.11z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.62l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
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
    window.location.href = "/api/auth/google";
  }

  return (
    <div
      className={`${display.variable} min-h-screen w-full bg-[var(--bg)] relative overflow-x-hidden flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${LANDSCAPE_Q}:py-4 ${LANDSCAPE_Q}:items-start font-sans transition-colors duration-300`}
    >
      {/* Subtle background accent, fixed so it doesn't re-render on scroll */}
      <div className="fixed inset-0 pointer-events-none transform-gpu overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-3xl opacity-60"
          style={{ background: "var(--accent-soft)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <Link
          href="/"
          className={`flex items-center justify-center gap-2.5 mb-6 ${LANDSCAPE_Q}:mb-3 text-[var(--text)]`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 transition duration-300">
            <div className="w-full h-full bg-[var(--bg-panel)] rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-[var(--text)]">
            SwaKoreksi<span className="text-blue-500">In</span>
          </span>
        </Link>

        {/* Panel */}
        <div
          className={`relative bg-[var(--bg-panel)] border border-[var(--border-soft)] rounded-3xl p-6 sm:p-8 ${LANDSCAPE_Q}:p-5 shadow-xl transition-colors duration-300 transform-gpu`}
        >
          {/* Header */}
          <div className={`mb-7 ${LANDSCAPE_Q}:mb-4 text-center`}>
            <h1
              className={`text-[24px] sm:text-[27px] text-[var(--text)] leading-tight ${LANDSCAPE_Q}:text-[21px]`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              Masuk ke dashboard
            </h1>
            <p className={`text-sm text-[var(--text-muted)] mt-2 ${LANDSCAPE_Q}:hidden`}>
              Masukkan kredensial Anda untuk melanjutkan.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className={`mb-5 ${LANDSCAPE_Q}:mb-3 border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger-text)] text-sm rounded-xl px-3.5 py-2.5`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${LANDSCAPE_Q}:gap-3`}>
            {/* Email */}
            <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
              <label htmlFor="email" className="text-[13px] text-[var(--text-muted)]">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-ink)] transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@kampus.ac.id"
                  className={`w-full bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)] rounded-xl pl-10 pr-3 py-2.5 ${LANDSCAPE_Q}:py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all`}
                />
              </div>
            </div>

            {/* Password */}
            <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] text-[var(--text-muted)]">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-[var(--accent-ink)] opacity-80 hover:opacity-100 transition-opacity"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent-ink)] transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)] rounded-xl pl-10 pr-10 py-2.5 ${LANDSCAPE_Q}:py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent-ink)] transition-colors"
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
              className={`mt-2 ${LANDSCAPE_Q}:mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-medium px-4 py-3 ${LANDSCAPE_Q}:py-2 hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={`flex items-center gap-3 my-5 ${LANDSCAPE_Q}:my-3`}>
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
            <span className="text-[12px] text-[var(--text-faint)]">atau</span>
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className={`w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-[var(--border)] text-[var(--text)] text-sm px-4 py-3 ${LANDSCAPE_Q}:py-2 hover:border-[var(--border-strong)] hover:bg-[var(--border-soft)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Masuk dengan Google
          </button>

          {/* Footer */}
          <p className={`text-center text-sm text-[var(--text-muted)] mt-7 ${LANDSCAPE_Q}:mt-4`}>
            Belum punya akun?{" "}
            <Link href="/auth/register" className="text-[var(--accent-ink)] hover:underline underline-offset-4">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}