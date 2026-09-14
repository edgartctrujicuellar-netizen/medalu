import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { passwordValida } from "@/lib/check-admin";

function tomarPassword(req: NextRequest): string | null {
  return req.headers.get("x-admin-password");
}

// Crear un producto nuevo
export async function POST(req: NextRequest) {
  const pass = tomarPassword(req);
  if (!(await passwordValida(pass))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { nombre, precio, categoria, imagen, comentarios } = await req.json();

  if (!nombre || !precio) {
    return NextResponse.json(
      { error: "El nombre y el precio son obligatorios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("productos")
    .insert({
      id: "p_" + Date.now(),
      nombre,
      precio: parseFloat(precio),
      categoria,
      imagen,
      comentarios: comentarios && comentarios.trim() !== "" ? comentarios.trim() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ producto: data });
}

// Marcar/desmarcar agotado
export async function PATCH(req: NextRequest) {
  const pass = tomarPassword(req);
  if (!(await passwordValida(pass))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id, agotado } = await req.json();

  const { error } = await supabaseAdmin
    .from("productos")
    .update({ agotado })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Ocultar un producto (no lo borramos, solo dejamos de mostrarlo)
export async function DELETE(req: NextRequest) {
  const pass = tomarPassword(req);
  if (!(await passwordValida(pass))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await req.json();

  const { error } = await supabaseAdmin
    .from("productos")
    .update({ oculto: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
