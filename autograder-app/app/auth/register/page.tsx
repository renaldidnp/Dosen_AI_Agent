"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, Check } from "lucide-react";

const PASSWORD_MIN_LENGTH = 8;
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

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const passwordLongEnough = form.password.length >= PASSWORD_MIN_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordLongEnough) {
      setError(`Password minimal ${PASSWORD_MIN_LENGTH} karakter.`);
      return;
    }
    if (!passwordsMatch) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Registrasi gagal. Coba lagi.");
      }

      router.push("/auth/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleRegister() {
    setGoogleLoading(true);
    // Arahkan ke endpoint OAuth Google Anda.
    // Kalau pakai NextAuth: ganti dengan signIn("google", { callbackUrl: "/dashboard" })
    window.location.href = "/api/auth/google";
  }

  const inputClass = `w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-3 py-2.5 ${LANDSCAPE_Q}:py-2 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all`;

  return (
    <div
      className={`min-h-screen w-full bg-[#0a0a0f] relative overflow-x-hidden flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 ${LANDSCAPE_Q}:py-4 ${LANDSCAPE_Q}:items-start`}
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

      <div className={`relative z-10 w-full max-w-[420px] ${LANDSCAPE_Q}:max-w-[560px]`}>
        <div className={`relative bg-[#111118]/80 backdrop-blur-xl border border-[#00f0ff]/15 rounded-[4px] p-6 sm:p-8 ${LANDSCAPE_Q}:p-5`}>
          <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
          <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

          {/* Header */}
          <div className={`mb-7 ${LANDSCAPE_Q}:mb-4`}>
            <div className={`font-mono text-[11px] text-[#00f0ff] tracking-widest uppercase flex items-center gap-2 mb-3 ${LANDSCAPE_Q}:mb-1.5`}>
              <span
                className="w-1.5 h-1.5 bg-[#00f0ff] rounded-[2px]"
                style={{ boxShadow: "0 0 8px rgba(0,240,255,1)" }}
              />
              Nexus Registration
            </div>
            <h1 className={`font-semibold text-[26px] sm:text-[28px] text-white leading-tight tracking-tight ${LANDSCAPE_Q}:text-[22px]`}>
              Buat <span className="text-[#00f0ff]" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Akun_</span>
            </h1>
            <p className={`text-sm text-[#8b949e] mt-1.5 ${LANDSCAPE_Q}:hidden`}>Daftar untuk mulai mengelola ujian Anda.</p>
          </div>

          {error && (
            <div className={`mb-5 ${LANDSCAPE_Q}:mb-3 border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 text-[#ff8fa8] text-sm rounded-[2px] px-3 py-2.5 font-mono`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${LANDSCAPE_Q}:gap-3`}>
            {/* Name + Email: stacked normally, side-by-side hanya di HP landscape */}
            <div className={`flex flex-col gap-5 ${LANDSCAPE_Q}:grid ${LANDSCAPE_Q}:grid-cols-2 ${LANDSCAPE_Q}:gap-3`}>
              {/* Name */}
              <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
                <label htmlFor="name" className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">
                  Nama Lengkap
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] group-focus-within:text-[#00f0ff] transition-colors" />
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Dr. Budi Santoso"
                    className={inputClass}
                  />
                </div>
              </div>

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
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Password + Confirm: stacked normally, side-by-side hanya di HP landscape */}
            <div className={`flex flex-col gap-5 ${LANDSCAPE_Q}:grid ${LANDSCAPE_Q}:grid-cols-2 ${LANDSCAPE_Q}:gap-3`}>
              {/* Password */}
              <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
                <label htmlFor="password" className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] group-focus-within:text-[#00f0ff] transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 8 karakter"
                    className={`${inputClass} pr-10`}
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

              {/* Confirm password */}
              <div className={`flex flex-col gap-1.5 ${LANDSCAPE_Q}:gap-1`}>
                <label htmlFor="confirmPassword" className="font-mono text-[10px] text-[#8b949e] uppercase tracking-widest">
                  Konfirmasi Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] group-focus-within:text-[#00f0ff] transition-colors" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Ulangi password"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#00f0ff] transition-colors"
                    aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword.length > 0 && (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-mono mt-0.5 ${
                      passwordsMatch ? "text-[#00f0ff]" : "text-[#ff8fa8]"
                    }`}
                  >
                    {passwordsMatch && <Check className="w-3 h-3" />}
                    {passwordsMatch ? "Password cocok" : "Password tidak cocok"}
                  </div>
                )}
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
                  Daftar
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
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className={`w-full inline-flex items-center justify-center gap-2.5 bg-white/5 border border-white/15 text-white font-mono text-xs px-4 py-2.5 ${LANDSCAPE_Q}:py-2 rounded-[2px] uppercase tracking-wider hover:bg-white/10 hover:border-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Daftar dengan Google
          </button>

          {/* Footer */}
          <p className={`text-center text-sm text-[#8b949e] mt-7 ${LANDSCAPE_Q}:mt-4`}>
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-[#00f0ff] hover:underline underline-offset-4">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}