import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Semua rute yang ada di dalam grup app/(dosen)/... harus disebut eksplisit
// di sini, karena route group "(dosen)" TIDAK muncul di URL sehingga
// middleware matcher harus mencocokkan path aslinya (/dashboard, /kelas, dst),
// bukan nama foldernya.
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/kelas",
  "/soal",
  "/settings",
  "/output",
];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/auth");
  const isProtected = PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const valid = token ? await verifyToken(token) : null;

  if (isProtected && !valid) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  if (isAuthPage && valid) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/kelas/:path*",
    "/soal/:path*",
    "/settings/:path*",
    "/output/:path*",
    "/auth/:path*",
  ],
};