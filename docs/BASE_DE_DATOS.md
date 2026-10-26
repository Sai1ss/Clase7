# Base de datos: progreso de cada usuario

La app sigue siendo un sitio estático en **GitHub Pages**. El progreso de cada persona se guarda en **Supabase**, un servicio administrado de Postgres con plan gratuito que incluye inicio de sesión. No hay servidor propio que mantener ni nada desplegado en Railway.

```
 Celular / PC (navegador)                       Supabase (plan gratuito)
 ┌──────────────────────────┐   HTTPS + JWT    ┌───────────────────────────────┐
 │ GitHub Pages: HTML/CSS/JS│ ───────────────▶ │ Auth: correo + contraseña     │
 │ localStorage (sin red)   │ ◀─────────────── │ Postgres: progress            │
 └──────────────────────────┘                  │           exam_results        │
                                               │ RLS: cada uno ve solo lo suyo │
 GitHub Actions (cada 3 días) ── ping() ─────▶ └───────────────────────────────┘
```

## Cómo funciona

- **Local primero.** Cada respuesta se guarda al instante en el navegador; la app funciona sin cuenta y sin internet.
- **Sincronización.** Con sesión iniciada, los cambios se suben 1,5 s después de responder, y también al cerrar o cambiar de app. Si no hay red, se reintenta al volver.
- **Varios dispositivos.** Al entrar se combinan el progreso local y el de la nube **pregunta por pregunta**, quedándose con la respuesta más reciente. Si alguien juega sin cuenta y después crea una, no pierde nada.
- **Reiniciar.** «Reiniciar mi progreso» queda registrado, así que el progreso viejo de otro dispositivo no vuelve a aparecer.
- **Simulacros.** Cada simulacro se guarda en `exam_results`, y en «Tu cuenta» se ven los últimos 5.
- **Seguridad.** La clave que va en `js/config.js` es pública por diseño. Lo que protege los datos son las reglas **Row Level Security** de `supabase/schema.sql`: cada usuario solo puede leer y escribir sus propias filas.

## Puesta en marcha (una sola vez, unos 10 minutos)

1. **Crear el proyecto.** Entra en [supabase.com](https://supabase.com), inicia sesión con GitHub y crea un proyecto: *New project*, nombre `clase7`, región **Canada (Central)** (la más cercana a Alberta). Guarda la contraseña de la base de datos en un lugar seguro.
2. **Crear las tablas.** Ve a *SQL Editor → New query*, pega todo el contenido de [`supabase/schema.sql`](../supabase/schema.sql) y pulsa **Run**. Debe responder *Success*.
3. **Configurar el inicio de sesión.** En *Authentication → Sign In / Providers → Email*:
   - Deja **Email** activado.
   - **Desactiva «Confirm email».** El servidor de correo gratuito de Supabase solo envía unos pocos correos por hora; si se exige confirmar, tus amigos podrían quedarse sin poder entrar. Sin confirmación, la cuenta queda lista al instante.
4. **Indicar la dirección de la web.** En *Authentication → URL Configuration*:
   - **Site URL:** `https://sai1ss.github.io/Clase7/`
   - **Redirect URLs:** añade `https://sai1ss.github.io/Clase7/**`

   Esto sirve para los enlaces de «¿Olvidaste tu contraseña?».
5. **Copiar las claves.** En *Project Settings → API Keys* copia la **Project URL** y la clave **anon public** (o la **publishable**, que empieza por `sb_publishable_`). Pégalas en [`js/config.js`](../js/config.js):

   ```js
   window.CLASE7_CONFIG = {
     supabaseUrl: 'https://xxxxxxxx.supabase.co',
     supabaseAnonKey: 'eyJ...  o  sb_publishable_...',
   };
   ```

   ⚠️ **Nunca** pongas la clave `service_role` ni la `secret`: esas saltan la seguridad.
6. **Publicar.** Haz commit y push. En 1–2 minutos aparece el botón de cuenta (👤) en la web.
7. **Probar la tarea programada (opcional).** En GitHub, ve a *Actions → Mantener Supabase activo → Run workflow*. Debe terminar en verde.

## Límites del plan gratuito (de sobra para este uso)

| Recurso | Límite | Uso estimado |
|---|---|---|
| Base de datos | 500 MB | ~3 KB por usuario → más de 100 000 usuarios |
| Usuarios activos al mes | 50 000 | — |
| Pausa por inactividad | 7 días sin uso | Lo evita el workflow `supabase-keepalive` |
| Correos (recuperar contraseña) | Pocos por hora | Para más, conectar un SMTP propio (p. ej. Resend) en *Authentication → Emails → SMTP* |

GitHub desactiva los workflows programados si el repositorio pasa 60 días sin commits; si ocurre, basta con reactivarlo en la pestaña *Actions*.

## Consultar los datos

En Supabase, *Table Editor* muestra las tablas. Por ejemplo, cuántas personas usan la app y su avance:

```sql
select u.email,
       p.updated_at,
       (select count(*) from jsonb_array_elements(p.state->'q') x where (x->>'b')::int >= 3) as dominadas
from progress p join auth.users u on u.id = p.user_id
order by p.updated_at desc;
```
