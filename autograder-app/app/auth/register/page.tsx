"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, Check } from "lucide-react";

const PASSWORD_MIN_LENGTH = 8;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="w-full max-w-[420px]">
      <div className="relative bg-[#111118]/80 backdrop-blur-xl border border-[#00f0ff]/15 rounded-[4px] p-6 sm:p-8">
        <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/70" />
        <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]/70" />

        {/* Header */}
        <div className="mb-7">
          <div className="font-mono text-[11px] text-[#00f0ff] tracking-widest uppercase flex items-center gap-2 mb-3">
            <span
              className="w-1.5 h-1.5 bg-[#00f0ff] rounded-[2px]"
              style={{ boxShadow: "0 0 8px rgba(0,240,255,1)" }}
            />
            Nexus Registration
          </div>
          <h1 className="font-semibold text-[26px] sm:text-[28px] text-white leading-tight tracking-tight">
            Buat <span className="text-[#00f0ff]" style={{ textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Akun_</span>
          </h1>
          <p className="text-sm text-[#8b949e] mt-1.5">Daftar untuk mulai mengelola ujian Anda.</p>
        </div>

        {error && (
          <div className="mb-5 border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 text-[#ff8fa8] text-sm rounded-[2px] px-3 py-2.5 font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
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
                className="w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all"
              />
            </div>
          </div>

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

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
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
                className="w-full bg-[#0a0a0f] border border-white/10 focus:border-[#00f0ff] focus:shadow-[0_0_0_1px_rgba(0,240,255,0.3)] rounded-[2px] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[#4b5563] outline-none transition-all"
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
                Daftar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-[#8b949e] mt-7">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-[#00f0ff] hover:underline underline-offset-4">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}