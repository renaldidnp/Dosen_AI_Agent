import type { NextRequest } from "next/server";

/**
 * Tentukan flag `secure` untuk cookie berdasarkan protocol asli request.
 *
 * App berjalan di balik Nginx (reverse proxy). Saat akses lewat plain HTTP
 * (mis. masih belum punya domain/HTTPS), cookie TIDAK boleh diberi flag
 * `Secure` — kalau tidak, browser menolak mengirimnya balik dan sesi login
 * dianggap gagal. Nginx set header X-Forwarded-Proto=origin; begitu ada
 * HTTPS/domain di depan, flag ini otomatis aktif kembali.
 */
export function cookieSecure(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  return process.env.NODE_ENV === "production";
}

export function sessionCookieOptions(req: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    secure: cookieSecure(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}