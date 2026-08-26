import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Drive sync route active" });
}

export async function POST() {
  return NextResponse.json({ message: "Drive sync endpoint" });
}
