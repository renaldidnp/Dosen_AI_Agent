import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword, verifyPassword } from "@/lib/auth";
import { sessionCookieOptions } from "@/lib/cookies";

function getTokenFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/session_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function GET(req: Request) {
  try {
    const token = getTokenFromCookie(req);
    if (!token) {
      return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Token tidak valid." }, { status: 401 });
    }

    const dosen = await prisma.dosen.findUnique({
      where: { id: payload.id },
      select: { id: true, nama: true, email: true },
    });

    if (!dosen) {
      return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(dosen);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const token = getTokenFromCookie(req);
    if (!token) {
      return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Token tidak valid." }, { status: 401 });
    }

    const { nama, email } = await req.json();

    if (!nama?.trim() || !email?.trim()) {
      return NextResponse.json({ message: "Nama dan email wajib diisi." }, { status: 400 });
    }

    // cek email duplikat
    const existing = await prisma.dosen.findUnique({ where: { email: email.trim() } });
    if (existing && existing.id !== payload.id) {
      return NextResponse.json({ message: "Email sudah digunakan oleh akun lain." }, { status: 400 });
    }

    const updated = await prisma.dosen.update({
      where: { id: payload.id },
      data: { nama: nama.trim(), email: email.trim() },
      select: { id: true, nama: true, email: true },
    });

    // update cookie dengan data baru
    const { signToken } = await import("@/lib/auth");
    const newToken = await signToken({ id: updated.id, email: updated.email, nama: updated.nama });

    const res = NextResponse.json({ message: "Profil berhasil diperbarui.", data: updated });
    res.cookies.set(
      "session_token",
      newToken,
      sessionCookieOptions(req as NextRequest, 60 * 60 * 24 * 7),
    );

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromCookie(req);
    if (!token) {
      return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Token tidak valid." }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Semua field wajib diisi." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password baru minimal 6 karakter." }, { status: 400 });
    }

    const dosen = await prisma.dosen.findUnique({ where: { id: payload.id } });
    if (!dosen) {
      return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, dosen.password);
    if (!valid) {
      return NextResponse.json({ message: "Password saat ini salah." }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.dosen.update({
      where: { id: payload.id },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "Password berhasil diubah." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
