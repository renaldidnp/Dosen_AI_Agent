import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const soal = await db.soal.findMany({
    include: { indikator: true, submission: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(soal);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { judul, deskripsi, dosenId, googleFormId, googleFormUrl, driveFolderId, indikator } = body;

  const soal = await db.soal.create({
    data: {
      judul,
      deskripsi,
      dosenId,
      googleFormId,
      googleFormUrl,
      driveFolderId,
      indikator: {
        create: indikator, // [{ nama, bobot, rubrik, skorMax }]
      },
    },
    include: { indikator: true },
  });

  return NextResponse.json(soal, { status: 201 });
}
