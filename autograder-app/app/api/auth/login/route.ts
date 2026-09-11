import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { sessionCookieOptions } from "@/lib/cookies";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: "Email dan password wajib diisi." }, { status: 400 });
        }

        const dosen = await prisma.dosen.findUnique({ where: { email } });
        if (!dosen) {
            return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
        }

        const valid = await verifyPassword(password, dosen.password);
        if (!valid) {
            return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
        }

        const token = await signToken({ id: dosen.id, email: dosen.email, nama: dosen.nama });

        const res = NextResponse.json({ message: "Login berhasil." }, { status: 200 });
        res.cookies.set(
            "session_token",
            token,
            sessionCookieOptions(req as NextRequest, 60 * 60 * 24 * 7), // 7 hari
        );

        return res;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
    }
}