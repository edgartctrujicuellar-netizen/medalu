import { createClient } from "@supabase/supabase-js";

// Este cliente usa la llave pública (anon key).
// Solo puede LEER productos que no estén ocultos (así lo definimos
// en la política de seguridad de la tabla `productos`).
// Es seguro que esté en el navegador.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
