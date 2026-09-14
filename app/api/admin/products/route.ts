import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, precio, categoria, imagen, comentarios, agotado } = body;

    if (!nombre || !precio) {
      return NextResponse.json(
        { error: "El nombre y el precio son obligatorios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("productos")
      .upsert([
        {
          id: id || undefined,
          nombre,
          precio: parseFloat(precio),
          categoria,
          imagen,
          comentarios: comentarios && comentarios.trim() !== "" ? comentarios.trim() : null,
          agotado: agotado ?? false,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ producto: data[0] });
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, agotado } = body;

    const { error } = await supabase
      .from("productos")
      .update({ agotado })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    const { error } = await supabase.from("productos").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
