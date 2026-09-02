import { NextRequest, NextResponse } from "next/server";
import { passwordValida } from "@/lib/check-admin";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const ok = await passwordValida(password);

  if (!ok) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
