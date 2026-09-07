import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: "Semua field wajib diisi." }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ message: "Password minimal 8 karakter." }, { status: 400 });
        }

        const existing = await prisma.dosen.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ message: "Email sudah terdaftar." }, { status: 409 });
        }

        const hashed = await hashPassword(password);
        await prisma.dosen.create({
            data: { nama: name, email, password: hashed },
        });

        return NextResponse.json({ message: "Registrasi berhasil." }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
    }
}