"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Shield,
  CheckCircle,
  AlertCircle,
  Key,
} from "lucide-react";

type Profile = {
  id: string;
  nama: string;
  email: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // profile form
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setNama(data.nama);
        setEmail(data.email);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    setProfileMsg(null);
    if (!nama.trim() || !email.trim()) {
      setProfileMsg({ type: "error", text: "Nama dan email wajib diisi." });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profil berhasil diperbarui." });
        setProfile((prev) =>
          prev ? { ...prev, nama: nama.trim(), email: email.trim() } : prev
        );
      } else {
        setProfileMsg({ type: "error", text: data.message || "Gagal memperbarui profil." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Terjadi kesalahan server." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "error", text: "Semua field wajib diisi." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password baru minimal 6 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password berhasil diubah." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "error", text: data.message || "Gagal mengubah password." });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Terjadi kesalahan server." });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-[1600px] mx-auto py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-16 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="py-4 mb-6">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-[var(--text)] tracking-tight">
          Pengaturan
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Kelola profil dan keamanan akun Anda.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* ========== PROFIL ========== */}
        <section className="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-soft)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
              <User className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-[var(--text)]">
                Profil
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Informasi dasar akun Anda
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Nama */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                <User className="w-3.5 h-3.5" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="
                  w-full px-4 py-2.5
                  bg-[var(--bg)]
                  border border-[var(--border)]
                  rounded-xl
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-faint)]
                  focus:outline-none focus:border-[var(--accent)]
                  focus:ring-2 focus:ring-[var(--accent-soft)]
                  transition-all
                "
                placeholder="Nama dosen"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full px-4 py-2.5
                  bg-[var(--bg)]
                  border border-[var(--border)]
                  rounded-xl
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-faint)]
                  focus:outline-none focus:border-[var(--accent)]
                  focus:ring-2 focus:ring-[var(--accent-soft)]
                  transition-all
                "
                placeholder="email@universitas.ac.id"
              />
            </div>

            {/* Status message */}
            {profileMsg && (
              <div
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  ${
                    profileMsg.type === "success"
                      ? "bg-[var(--success-soft)] text-[var(--success-ink)]"
                      : "bg-[var(--danger-soft)] text-[var(--danger-text)]"
                  }
                `}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {profileMsg.text}
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                  text-[var(--accent-fg)]
                  text-sm font-bold
                  shadow-md shadow-[var(--accent-soft)]
                  transition-all active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Profil
              </button>
            </div>
          </div>
        </section>

        {/* ========== PASSWORD ========== */}
        <section className="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-soft)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-ink)] flex items-center justify-center">
              <Lock className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-[var(--text)]">
                Ubah Password
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Perbarui password akun Anda
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Current Password */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                <Key className="w-3.5 h-3.5" />
                Password Saat Ini
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="
                  w-full px-4 py-2.5
                  bg-[var(--bg)]
                  border border-[var(--border)]
                  rounded-xl
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-faint)]
                  focus:outline-none focus:border-[var(--accent)]
                  focus:ring-2 focus:ring-[var(--accent-soft)]
                  transition-all
                "
                placeholder="Masukkan password saat ini"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                <Lock className="w-3.5 h-3.5" />
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="
                  w-full px-4 py-2.5
                  bg-[var(--bg)]
                  border border-[var(--border)]
                  rounded-xl
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-faint)]
                  focus:outline-none focus:border-[var(--accent)]
                  focus:ring-2 focus:ring-[var(--accent-soft)]
                  transition-all
                "
                placeholder="Minimal 6 karakter"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                <Shield className="w-3.5 h-3.5" />
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="
                  w-full px-4 py-2.5
                  bg-[var(--bg)]
                  border border-[var(--border)]
                  rounded-xl
                  text-sm text-[var(--text)]
                  placeholder:text-[var(--text-faint)]
                  focus:outline-none focus:border-[var(--accent)]
                  focus:ring-2 focus:ring-[var(--accent-soft)]
                  transition-all
                "
                placeholder="Ulangi password baru"
              />
            </div>

            {/* Status message */}
            {passwordMsg && (
              <div
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  ${
                    passwordMsg.type === "success"
                      ? "bg-[var(--success-soft)] text-[var(--success-ink)]"
                      : "bg-[var(--danger-soft)] text-[var(--danger-text)]"
                  }
                `}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {passwordMsg.text}
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-[var(--warning)] hover:bg-[var(--warning-hover)]
                  text-[var(--warning-fg)]
                  text-sm font-bold
                  shadow-md shadow-[var(--warning-soft)]
                  transition-all active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Ubah Password
              </button>
            </div>
          </div>
        </section>

        {/* ========== INFO SISTEM ========== */}
        <section className="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-soft)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--success-soft)] text-[var(--success-ink)] flex items-center justify-center">
              <Shield className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-[var(--text)]">
                Informasi Sistem
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Status integrasi dan layanan
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard
                label="Google Drive"
                status={true}
                detail="Terhubung"
              />
              <InfoCard
                label="Link Submit"
                status={true}
                detail="Token unik per soal"
              />
              <InfoCard
                label="Multi-Provider LLM"
                status={true}
                detail="Failover otomatis"
              />
              <InfoCard
                label="Agent Service"
                status={true}
                detail="Express :4000"
              />
              <InfoCard
                label="Database"
                status={true}
                detail="MySQL + Prisma"
              />
              <InfoCard
                label="Email Service"
                status={true}
                detail="Resend"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border-soft)]">
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          status
            ? "bg-[var(--success)] ring-2 ring-[var(--success-soft)]"
            : "bg-[var(--text-faint)]"
        }`}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text)] truncate">{label}</p>
        <p className="text-xs text-[var(--text-muted)] truncate">{detail}</p>
      </div>
    </div>
  );
}
