import { NextRequest, NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/cookies";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ message: "Logout berhasil." });

  // path harus sama persis dengan yang dipakai saat cookie di-set di
  // app/api/auth/login/route.ts (path: "/") supaya browser mau menghapusnya.
  res.cookies.set("session_token", "", sessionCookieOptions(req, 0));

  return res;
}