import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout berhasil." });

  // path harus sama persis dengan yang dipakai saat cookie di-set di
  // app/api/auth/login/route.ts (path: "/") supaya browser mau menghapusnya.
  res.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}