import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Estos dos valores viven solo en el servidor, ya no en el
// código que se manda al navegador.
const RESP_SEGURIDAD = "medalu";
const CLAVE_MAESTRA = "69303242";

export async function POST(req: NextRequest) {
  const { respuesta, claveMaestra, nuevaPass } = await req.json();

  const respOk = (respuesta || "").trim().toLowerCase() === RESP_SEGURIDAD;
  const maeOk = (claveMaestra || "").trim() === CLAVE_MAESTRA;

  if (!respOk && !maeOk) {
    return NextResponse.json(
      { error: "Respuesta de seguridad o clave maestra incorrectas." },
      { status: 401 }
    );
  }
  if (!nuevaPass || !nuevaPass.trim()) {
    return NextResponse.json({ error: "Ingresa una contraseña válida." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("configuracion")
    .upsert({ clave: "admin_pass", valor: nuevaPass.trim() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
