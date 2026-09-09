import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kelasId, items } = body;

  if (!kelasId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "kelasId dan daftar mahasiswa wajib diisi" },
      { status: 400 }
    );
  }
  if (items.length > 200) {
    return NextResponse.json(
      { error: "Maksimal 200 mahasiswa dalam sekali tambah" },
      { status: 400 }
    );
  }

  const valid: { nama: string; nim: string; email: string }[] = [];
  const invalid: string[] = [];
  const seenNim = new Set<string>();

  for (const raw of items) {
    const nama = typeof raw?.nama === "string" ? raw.nama.trim() : "";
    const nim = typeof raw?.nim === "string" ? raw.nim.trim() : "";
    const email = typeof raw?.email === "string" ? raw.email.trim() : "";

    if (!nama || !nim || !email) {
      invalid.push(`${nama}${nim}${email}` || "(baris tidak lengkap)");
      continue;
    }
    if (seenNim.has(nim)) {
      invalid.push(`${nama} (NIM ${nim} duplikat di batch)`);
      continue;
    }
    seenNim.add(nim);
    valid.push({ nama, nim, email });
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data valid untuk ditambahkan" },
      { status: 400 }
    );
  }

  const existing = await db.mahasiswa.findMany({
    where: { kelasId },
    select: { nim: true },
  });
  const existingNim = new Set(existing.map((m) => m.nim));

  const toCreate = valid.filter((m) => !existingNim.has(m.nim));
  const skipped = valid.filter((m) => existingNim.has(m.nim));

  if (toCreate.length > 0) {
    try {
      await db.mahasiswa.createMany({
        data: toCreate.map((m) => ({ ...m, kelasId })),
      });
    } catch (err: any) {
      console.error("Gagal menambah mahasiswa massal:", err);
      return NextResponse.json(
        { error: "Gagal menambah mahasiswa massal" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    added: toCreate.length,
    skipped: skipped.map((m) => m.nim),
    invalid,
  });
}