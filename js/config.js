/* Conexión con Supabase (base de datos del progreso de cada usuario).
   Valores en Supabase → Project Settings → API:
     supabaseUrl     → "Project URL"            (https://xxxx.supabase.co)
     supabaseAnonKey → clave "anon public" o "publishable" (sb_publishable_…)
   Estas dos claves son públicas por diseño: la seguridad la ponen las reglas RLS de supabase/schema.sql.
   NUNCA pongas aquí la clave "service_role" ni la "secret".
   Si se dejan vacías, la app funciona igual pero guarda el progreso solo en el navegador. */
window.CLASE7_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
