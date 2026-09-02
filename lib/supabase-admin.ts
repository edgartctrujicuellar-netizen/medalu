import { createClient } from "@supabase/supabase-js";

// ⚠️ IMPORTANTE: este cliente usa la Service Role Key, que puede
// leer y escribir CUALQUIER cosa en la base de datos, ignorando
// las políticas de seguridad.
//
// SOLO se debe importar desde archivos que corren en el servidor
// (rutas dentro de app/api/**). NUNCA lo importes desde page.tsx
// ni desde ningún componente "use client" — si lo haces, la llave
// secreta terminaría expuesta en el navegador.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
