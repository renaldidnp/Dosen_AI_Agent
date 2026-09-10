"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  nama: string;
  email: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.nama) setProfile(data);
        }
      } catch (err) {
        console.error("[useProfile] Gagal memuat profil:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}

export function avatarInitials(nama?: string | null): string {
  if (!nama) return "?";
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}