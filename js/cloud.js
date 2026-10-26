/* Sincronización con Supabase: cuentas (correo + contraseña) y progreso en la nube.
   La app es "local primero": siempre guarda en el navegador y, si hay sesión, sube los cambios
   con un pequeño retraso. Al entrar desde otro dispositivo se combinan ambos progresos pregunta
   por pregunta, quedándose con la respuesta más reciente. Sin configuración, este módulo no hace nada. */
(function () {
  const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.js';
  const PUSH_DELAY = 1500;
  const cfg = window.CLASE7_CONFIG || {};

  const Cloud = {
    enabled: !!(cfg.supabaseUrl && cfg.supabaseAnonKey),
    user: null,
    status: 'off',      // off | loading | out | syncing | ok | offline | error
    lastSync: null,
    error: '',
  };
  let client = null, host = null, timer = null, dirty = false, pushing = null;
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(Cloud); } catch (e) { console.error(e); } });
  const setStatus = (s, err = '') => { Cloud.status = s; Cloud.error = err; emit(); };
  Cloud.on = (fn) => { listeners.add(fn); fn(Cloud); };

  /* ---------- Combinar progreso local y remoto ---------- */
  function merge(a, b) {
    if (!b || !Array.isArray(b.q)) return a;
    if (!a || !Array.isArray(a.q)) return b;
    // resetAt: si el usuario reinició su progreso, se descarta todo lo respondido antes de esa fecha
    const resetAt = Math.max(a.resetAt || 0, b.resetAt || 0);
    const n = Math.max(a.q.length, b.q.length);
    const q = [];
    for (let i = 0; i < n; i++) {
      const x = a.q[i], y = b.q[i];
      let pick;
      if (!x || !y) pick = x || y;
      else {
        const tx = x.t || 0, ty = y.t || 0;
        pick = tx !== ty ? (tx > ty ? x : y) : (x.n >= y.n ? x : y);
      }
      q.push((pick.t || 0) < resetAt ? { b: -1, n: 0, w: 0, d: 0 } : pick);
    }
    const round = (a.resetAt || 0) === (b.resetAt || 0) ? Math.max(a.round || 0, b.round || 0)
      : ((a.resetAt || 0) > (b.resetAt || 0) ? a.round : b.round) || 0;
    return { round, resetAt, q };
  }
  Cloud.merge = merge;

  /* ---------- Mensajes de error en español ---------- */
  function human(err) {
    const m = String((err && (err.message || err.error_description)) || err || '');
    if (!navigator.onLine || /fetch|network/i.test(m)) return 'Sin conexión. Se sincronizará cuando vuelva internet.';
    if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/already registered|already exists/i.test(m)) return 'Ese correo ya tiene cuenta. Usa «Entrar».';
    if (/email not confirmed/i.test(m)) return 'Falta confirmar el correo: revisa tu bandeja de entrada.';
    if (/password.*(6|characters|short)/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
    if (/valid email|invalid.*email|email.*invalid/i.test(m)) return 'Escribe un correo válido.';
    if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
    return m || 'Algo salió mal. Inténtalo de nuevo.';
  }
  Cloud.human = human;

  function loadSDK() {
    if (window.supabase) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = SDK; s.async = true; s.onload = res; s.onerror = () => rej(new Error('network'));
      document.head.appendChild(s);
    });
  }

  /* ---------- Inicio ---------- */
  // host = { getState(): estado local, setState(estado): reemplaza el estado local y repinta }
  Cloud.init = async function (h) {
    host = h;
    if (!Cloud.enabled) { emit(); return; }
    setStatus('loading');
    try {
      await loadSDK();
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'clase7-auth' },
      });
    } catch (e) {
      setStatus('offline', human(e));
      addEventListener('online', () => Cloud.init(host), { once: true });
      return;
    }
    client.auth.onAuthStateChange((event, session) => {
      const prev = Cloud.user && Cloud.user.id;
      Cloud.user = session ? session.user : null;
      if (event === 'PASSWORD_RECOVERY') Cloud.recovery = true; // llegó desde el enlace de "olvidé mi contraseña"
      if (!Cloud.user) { setStatus('out'); return; }
      if (Cloud.user.id !== prev) setTimeout(pull, 0); // primer inicio de sesión en esta carga
      else emit();
    });
    const { data } = await client.auth.getSession();
    if (!data.session) setStatus('out');
  };

  /* ---------- Bajar, combinar y subir ---------- */
  async function pull() {
    if (!client || !Cloud.user) return;
    setStatus('syncing');
    const { data, error } = await client.from('progress').select('state').eq('user_id', Cloud.user.id).maybeSingle();
    if (error) { setStatus(navigator.onLine ? 'error' : 'offline', human(error)); return; }
    const merged = merge(host.getState(), data && data.state);
    host.setState(merged);
    dirty = true;
    await push();
  }
  Cloud.syncNow = pull;

  async function push() {
    if (!client || !Cloud.user || !dirty) return;
    if (pushing) return pushing;
    dirty = false;
    setStatus('syncing');
    pushing = client.from('progress').upsert({ user_id: Cloud.user.id, state: host.getState() }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) { dirty = true; setStatus(navigator.onLine ? 'error' : 'offline', human(error)); }
        else { Cloud.lastSync = new Date(); setStatus('ok'); }
      })
      .catch((e) => { dirty = true; setStatus('offline', human(e)); })
      .finally(() => { pushing = null; if (dirty && navigator.onLine) schedule(); });
    return pushing;
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(push, PUSH_DELAY); }

  // Llamar después de cada cambio local del progreso.
  Cloud.changed = function () {
    if (!Cloud.user) return;
    dirty = true;
    schedule();
  };
  Cloud.flush = function () { clearTimeout(timer); return push(); };
  addEventListener('online', () => { if (dirty) push(); else if (Cloud.status === 'offline' && Cloud.user) pull(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Cloud.flush(); });

  /* ---------- Cuenta ---------- */
  Cloud.signIn = async function (email, password) {
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(human(error));
  };
  Cloud.signUp = async function (email, password) {
    const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw new Error(human(error));
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error(human('already registered'));
    return { needsConfirm: !data.session };
  };
  Cloud.resetPassword = async function (email) {
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
    if (error) throw new Error(human(error));
  };
  Cloud.updatePassword = async function (password) {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error(human(error));
    Cloud.recovery = false;
    emit();
  };
  Cloud.signOut = async function () {
    try { await Cloud.flush(); } catch (e) {}
    await client.auth.signOut();
  };

  /* ---------- Simulacros ---------- */
  Cloud.saveExam = async function (score, total) {
    if (!client || !Cloud.user) return;
    try { await client.from('exam_results').insert({ score, total }); } catch (e) {}
  };
  Cloud.recentExams = async function (limit = 5) {
    if (!client || !Cloud.user) return [];
    const { data, error } = await client.from('exam_results').select('score,total,created_at').order('created_at', { ascending: false }).limit(limit);
    if (error) throw new Error(human(error));
    return data || [];
  };

  window.Cloud = Cloud;
})();
