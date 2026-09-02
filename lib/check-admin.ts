import { supabaseAdmin } from "./supabase-admin";

// Contraseña de fábrica, se usa solo si nunca se guardó ninguna
// en la tabla `configuracion` (primera vez que se usa el sitio).
const PASS_DEFECTO = "Medalu2026";

export async function obtenerPasswordActual(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("configuracion")
    .select("valor")
    .eq("clave", "admin_pass")
    .maybeSingle();

  return data?.valor || PASS_DEFECTO;
}

export async function passwordValida(password: string | null): Promise<boolean> {
  if (!password) return false;
  const passActual = await obtenerPasswordActual();
  return password === passActual;
}
