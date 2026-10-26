/* Lógica del cuestionario: repetición espaciada en tandas de 10, simulacro de examen, mapa de progreso y tema. */

const KEY = 'clase7-v2', THEME_KEY = 'clase7-theme';
const N = Q.length, BATCH = 10, EXAM = 30, PASS = 25;
const INT = [1, 2, 3, 5, 8, 13]; // tandas hasta el próximo repaso según la caja (0 = fallada)
const LET = ['A', 'B', 'C', 'D'];
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const fresh = () => ({ round: 0, q: Q.map(() => ({ b: -1, n: 0, w: 0, d: 0 })) });
const OLD_KEY = 'clase7-progreso-v1'; // formato de la primera versión: { rounds, q: [{ shown, wrong, last }] }
function load() {
  try { const s = JSON.parse(store.get(KEY)); if (s && Array.isArray(s.q) && s.q.length === N) return s; } catch (e) {}
  try {
    const o = JSON.parse(store.get(OLD_KEY));
    if (o && Array.isArray(o.q) && o.q.length === N) {
      const s = { round: o.rounds || 0, q: o.q.map(x => x && x.shown ? { b: x.last ? 2 : 0, n: x.shown, w: x.wrong || 0, d: 0 } : { b: -1, n: 0, w: 0, d: 0 }) };
      store.set(KEY, JSON.stringify(s));
      return s;
    }
  } catch (e) {}
  return fresh();
}
let S = load();
// Pide al navegador que no borre estos datos por falta de espacio o inactividad.
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
const save = () => { store.set(KEY, JSON.stringify(S)); window.Cloud && Cloud.changed(); };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Algoritmo ---------- */
// Tanda: primero los repasos que tocan (las falladas antes), luego preguntas nunca vistas y, si sobra espacio, las más débiles.
function pickBatch() {
  S.round++;
  const seen = [], unseen = [];
  S.q.forEach((s, i) => (s.b < 0 ? unseen : seen).push(i));
  shuffle(unseen);
  const due = seen.filter(i => S.q[i].d <= S.round).sort((a, b) => S.q[a].b - S.q[b].b || S.q[a].d - S.q[b].d);
  const later = seen.filter(i => S.q[i].d > S.round).sort((a, b) => S.q[a].d - S.q[b].d || S.q[a].b - S.q[b].b);
  const failedDue = due.filter(i => S.q[i].b === 0).length;
  const cap = unseen.length ? Math.min(due.length, Math.max(3, Math.min(5, failedDue))) : BATCH;
  const pick = due.slice(0, cap);
  for (const i of unseen) { if (pick.length >= BATCH) break; pick.push(i); }
  for (const i of due.slice(cap).concat(later)) { if (pick.length >= BATCH) break; pick.push(i); }
  return shuffle(pick);
}
function grade(i, ok) {
  const s = S.q[i];
  s.n++;
  s.t = Date.now(); // permite combinar el progreso entre dispositivos
  if (ok) s.b = s.b < 0 ? 2 : Math.min(5, s.b + 1);
  else { s.b = 0; s.w++; }
  s.d = S.round + INT[s.b];
  save();
}

/* ---------- Animación de números ---------- */
function countUp(el, to, suffix = '', dur = 750) {
  const from = el._to ?? (parseInt(el.textContent, 10) || 0);
  const token = el._token = (el._token || 0) + 1; // una animación nueva cancela la anterior
  el._to = to;
  if (reduceMotion || from === to) { el.textContent = to + suffix; return; }
  const t0 = performance.now();
  const step = (t) => {
    if (el._token !== token) return;
    const p = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

/* ---------- Tema ---------- */
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  $('theme').innerHTML = isDark() ? ICON_SUN : ICON_MOON;
}
applyTheme(store.get(THEME_KEY));
$('theme').onclick = () => { const t = isDark() ? 'light' : 'dark'; store.set(THEME_KEY, t); applyTheme(t); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(store.get(THEME_KEY)));
addEventListener('scroll', () => $('top').classList.toggle('scrolled', scrollY > 4), { passive: true });

/* ---------- Vistas ---------- */
function visualHTML(i, cls = 'enter') {
  const item = Q[i];
  if (item.img) return `<div class="visual plate ${cls}"><img src="img/${item.img}.jpg" alt="Señal de la pregunta ${i + 1}" decoding="async"><div class="src">Imagen del PDF</div></div>`;
  if (SCN[i + 1]) return `<div class="visual scene ${cls}">${SCN[i + 1]()}</div>`;
  return '';
}
function show(view) {
  ['home', 'quiz', 'result'].forEach(v => $(v).classList.toggle('hidden', v !== view));
  replay($(view), 'view-enter');
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function renderHome(animateMap = false) {
  const seen = S.q.filter(s => s.b >= 0).length, mast = S.q.filter(s => s.b >= 3).length, bad = S.q.filter(s => s.b === 0).length;
  const due = S.q.filter(s => s.b >= 0 && s.d <= S.round + 1).length;
  const pct = Math.round(mast / N * 100);
  countUp($('kNew'), N - seen); countUp($('kDue'), due); countUp($('kBad'), bad); countUp($('kMast'), mast); countUp($('kPct'), pct, '%');
  requestAnimationFrame(() => $('ringArc').setAttribute('stroke-dasharray', `${pct} 100`));
  $('goErrors').disabled = bad === 0;
  $('goErrors').textContent = bad ? `Repasar falladas (${bad})` : 'Repasar falladas';
  $('goPracticeLabel').textContent = seen ? 'Siguiente tanda de 10' : 'Empezar tanda de 10';
  $('hint').textContent = seen === 0 ? 'Empieza con una tanda: verás 10 preguntas nuevas, cada una con su imagen y la explicación de la respuesta.'
    : seen < N ? `Llevas ${seen} de ${N} vistas. Sigue con tandas hasta ver todas; las falladas volverán solas.`
    : mast < N * .9 ? `¡Ya viste las ${N}! Ahora cada tanda refuerza las más débiles. Meta: casi todo el mapa en verde.`
    : 'El mapa está casi todo en verde: haz simulacros de examen (30 preguntas, se aprueba con 25).';
  const map = $('map'); map.innerHTML = '';
  map.classList.toggle('intro', animateMap && !reduceMotion);
  S.q.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'cell'; b.textContent = i + 1; b.style.setProperty('--i', i);
    if (s.b >= 0) b.dataset.b = s.b;
    b.setAttribute('aria-label', `Pregunta ${i + 1}`);
    b.onclick = () => openStudy(i);
    map.appendChild(b);
  });
}

/* ---------- Sesión de preguntas ---------- */
let run = null;
function startRun(mode) {
  let ids;
  if (mode === 'practice') ids = pickBatch();
  else if (mode === 'errors') ids = shuffle(S.q.map((_, i) => i).filter(i => S.q[i].b === 0)).slice(0, BATCH);
  else ids = shuffle(Q.map((_, i) => i)).slice(0, EXAM);
  if (!ids.length) return;
  save();
  run = { mode, queue: ids.map(i => ({ i, retry: false })), pos: 0, first: new Map(), retries: {}, answered: false };
  show('quiz');
  renderQ();
}
function renderSegs() {
  const segs = $('segs'); segs.innerHTML = '';
  run.queue.forEach((it, k) => {
    const d = document.createElement('div');
    d.className = 'seg' + (k === run.pos && !run.answered ? ' cur' : it.res === undefined ? '' : run.mode === 'exam' ? ' done' : it.res ? ' ok' : ' bad');
    segs.appendChild(d);
  });
  $('count').textContent = `${run.pos + 1}/${run.queue.length}`;
}
function renderQ() {
  const it = run.queue[run.pos], i = it.i, item = Q[i], s = S.q[i];
  it.perm = it.perm || shuffle([0, 1, 2, 3]);
  run.answered = false;
  renderSegs();
  const tags = [`<span class="tag">Pregunta #${i + 1}</span>`];
  if (run.mode === 'exam') tags.push('<span class="tag">Simulacro</span>');
  else if (it.retry) tags.push('<span class="tag retry">↻ Otra vez: la fallaste en esta tanda</span>');
  else if (s.b < 0) tags.push('<span class="tag new">Nueva</span>');
  else tags.push(`<span class="tag rev">Repaso${s.w ? ` · fallada ${s.w}×` : ''}</span>`);
  $('tags').innerHTML = tags.join('');
  $('visual').innerHTML = visualHTML(i);
  $('qText').textContent = item.q;
  replay($('qText'), 'view-enter');
  const box = $('opts'); box.innerHTML = '';
  box.classList.add('stagger');
  it.perm.forEach((oi, k) => {
    const b = document.createElement('button');
    b.className = 'opt'; b.style.setProperty('--i', k);
    b.innerHTML = `<span class="k">${LET[k]}</span><span>${esc(item.o[oi])}</span>`;
    b.onclick = () => answer(k);
    box.appendChild(b);
  });
  $('fb').innerHTML = '';
  $('next').classList.add('hidden');
}
const ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle pathLength="1" cx="12" cy="12" r="10"/><path pathLength="1" d="M7.5 12.5l3 3 6-6.5"/></svg>';
const ICON_BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle pathLength="1" cx="12" cy="12" r="10"/><path pathLength="1" d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';

function answer(k) {
  if (run.answered) return;
  run.answered = true;
  const it = run.queue[run.pos], i = it.i, item = Q[i];
  const chosen = it.perm[k], ok = chosen === item.a;
  it.res = ok;
  const btns = [...$('opts').children];
  $('opts').classList.remove('stagger');
  btns.forEach(b => b.disabled = true);

  if (run.mode === 'exam') {
    btns[k].classList.add('sel');
    run.first.set(i, ok);
    grade(i, ok);
    setTimeout(next, 320);
    return;
  }

  btns.forEach((b, j) => {
    if (it.perm[j] === item.a) b.classList.add('ok');
    else if (j === k) b.classList.add('bad');
    else b.classList.add('dim');
  });
  if (!it.retry) { run.first.set(i, ok); grade(i, ok); }
  let again = '';
  if (!ok && (run.retries[i] || 0) < 2) {
    run.retries[i] = (run.retries[i] || 0) + 1;
    run.queue.splice(Math.min(run.queue.length, run.pos + 4), 0, { i, retry: true });
    again = '<div class="again">↻ Volverá a salir en unos momentos, dentro de esta misma tanda.</div>';
  }
  renderSegs();
  const note = item.n ? `<div class="note">⚠ ${esc(item.n)}</div>` : '';
  $('fb').innerHTML = ok
    ? `<div class="fb ok"><h3>${ICON_OK}¡Correcto!</h3><div class="why"><b>Por qué</b>${esc(item.e)}</div>${note}</div>`
    : `<div class="fb bad"><h3>${ICON_BAD}No es correcto</h3><p>Elegiste: <s>${esc(item.o[chosen])}</s></p><p>Respuesta correcta: <b>${esc(item.o[item.a])}</b></p><div class="why"><b>Por qué</b>${esc(item.e)}</div>${note}${again}</div>`;
  $('next').textContent = run.pos === run.queue.length - 1 ? 'Ver resultado' : 'Continuar';
  $('next').classList.remove('hidden');
  $('next').focus({ preventScroll: true });
  setTimeout(() => $('fb').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }), 120);
}
function next() {
  if (!run) return;
  if (run.pos < run.queue.length - 1) {
    run.pos++;
    renderQ();
    $('quiz').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  } else finish();
}
function finish() {
  const ids = [...run.first.keys()];
  const good = ids.filter(i => run.first.get(i)).length, total = ids.length;
  const mast = S.q.filter(s => s.b >= 3).length, seen = S.q.filter(s => s.b >= 0).length;
  const exam = run.mode === 'exam', pass = good >= PASS;
  const head = exam
    ? `<div class="score"><b id="rScore">0</b><span>de ${total} · ${Math.round(good / total * 100)}%</span></div>
       <span class="verdict ${pass ? 'pass' : 'fail'}">${pass ? 'Aprobado ✓' : 'Aún no'} · se necesitan ${PASS} de ${EXAM}</span>`
    : `<div class="score"><b id="rScore">0</b><span>de ${total} correctas al primer intento</span></div>
       <div class="bar"><i id="rBar"></i></div>
       <p class="hint">Vistas: ${seen}/${N} · Dominadas: ${mast}/${N}</p>`;
  const order = exam ? ids.sort((a, b) => run.first.get(a) - run.first.get(b)) : ids;
  const list = order.map((i, k) => `<li style="--i:${k}"><button data-i="${i}"><span class="mk ${run.first.get(i) ? 'ok' : 'bad'}">${run.first.get(i) ? '✓' : '✗'}</span><span><b>#${i + 1}</b> ${esc(Q[i].q)}<small>${esc(Q[i].o[Q[i].a])}</small></span></button></li>`).join('');
  const r = $('result');
  r.innerHTML = `<h2>${exam ? 'Resultado del simulacro' : 'Tanda terminada'}</h2>${head}
    ${window.Cloud && Cloud.user ? '' : '<button class="cloud-line out" id="rBackup" type="button" style="width:100%;text-align:left"><span>💾 <b>Guarda tu enlace de progreso</b> para no perder tu avance si se borran los datos del navegador.</span></button>'}
    <ul class="list stagger">${list}</ul>
    <div class="actions"><button class="btn primary" id="rAgain">${exam ? 'Otro simulacro' : 'Siguiente tanda de 10'}</button><button class="btn ghost" id="rHome">Volver al inicio</button></div>`;
  r.querySelectorAll('.list button').forEach(b => b.onclick = () => openStudy(+b.dataset.i));
  if ($('rBackup')) $('rBackup').onclick = shareProgress;
  if (exam && window.Cloud) Cloud.saveExam(good, total);
  const mode = run.mode === 'errors' ? 'practice' : run.mode;
  $('rAgain').onclick = () => startRun(mode);
  $('rHome').onclick = () => { renderHome(true); show('home'); };
  run = null;
  renderHome();
  show('result');
  countUp($('rScore'), good, '', 900);
  if ($('rBar')) requestAnimationFrame(() => requestAnimationFrame(() => { $('rBar').style.width = (good / total * 100) + '%'; }));
}

/* ---------- Ficha de estudio ---------- */
function openStudy(i) {
  const item = Q[i], s = S.q[i];
  const state = s.b < 0 ? 'Sin ver' : s.b === 0 ? 'Fallada' : s.b >= 3 ? 'Dominada' : 'Aprendiendo';
  $('modalBody').innerHTML = `<div class="mhead"><span class="tag">Pregunta #${i + 1}</span><span class="tag">${state}</span>${s.n ? `<span class="tag">${s.n - s.w} ✓ · ${s.w} ✗</span>` : ''}<button class="close" id="mClose" aria-label="Cerrar">×</button></div>
    <div class="modal-visual">${visualHTML(i)}</div><p class="q">${esc(item.q)}</p>
    <div class="opts stagger">${item.o.map((o, k) => `<div class="opt ${k === item.a ? 'ok' : 'dim'}" style="--i:${k}"><span class="k">${'abcd'[k]}</span><span>${esc(o)}</span></div>`).join('')}</div>
    <div class="fb ok"><div class="why" style="border:0;margin:0;padding:0"><b>Por qué</b>${esc(item.e)}</div>${item.n ? `<div class="note">⚠ ${esc(item.n)}</div>` : ''}</div>`;
  $('mClose').onclick = () => $('modal').close();
  $('modal').showModal();
  $('modalBody').scrollTop = 0;
}
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) $('modal').close(); });

/* ---------- Eventos ---------- */
$('goPractice').onclick = () => startRun('practice');
$('goErrors').onclick = () => startRun('errors');
$('goExam').onclick = () => startRun('exam');
$('next').onclick = next;
$('quit').onclick = () => {
  if (!run || confirm('¿Salir de la tanda? Lo que ya respondiste queda guardado.')) { run = null; renderHome(true); show('home'); }
};
$('reset').onclick = () => {
  const where = window.Cloud && Cloud.user ? ' en todos tus dispositivos' : '';
  if (confirm(`¿Borrar todo tu progreso${where}?`)) { S = fresh(); S.resetAt = Date.now(); save(); renderHome(true); }
};
document.addEventListener('keydown', (e) => {
  if (!run || $('modal').open || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
  if (!run.answered && k >= 0) { e.preventDefault(); answer(k); }
  else if (run.answered && e.key === 'Enter' && run.mode !== 'exam') { e.preventDefault(); next(); }
});

renderHome(true);
replay($('home'), 'view-enter');

/* ---------- Enlace de progreso (respaldo y paso a otro dispositivo, sin cuenta) ----------
   Formato: base64url de [versión=1, ronda (2 bytes), y por pregunta: caja+1, veces, fallos, repaso relativo+128]. */
const APP_URL = 'https://sai1ss.github.io/Clase7/';
const b64u = {
  enc: (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function exportCode() {
  const r = clamp(S.round, 0, 65535), out = [1, r >> 8, r & 255];
  S.q.forEach(s => out.push(s.b + 1, clamp(s.n, 0, 255), clamp(s.w, 0, 255), clamp(s.d - S.round + 128, 0, 255)));
  return b64u.enc(out);
}
function decodeCode(text) {
  const m = String(text).match(/[#&?]p=([A-Za-z0-9_-]+)/) || String(text).trim().match(/^([A-Za-z0-9_-]{100,})$/);
  if (!m) throw new Error('No reconozco ese enlace o código.');
  let by; try { by = b64u.dec(m[1]); } catch (e) { throw new Error('El código está incompleto o dañado.'); }
  if (by[0] !== 1 || by.length !== 3 + N * 4) throw new Error('El código está incompleto o dañado.');
  const round = (by[1] << 8) | by[2];
  return {
    round,
    q: Q.map((_, i) => {
      const o = 3 + i * 4, b = by[o] - 1;
      return b < 0 || b > 5 ? { b: -1, n: 0, w: 0, d: 0 } : { b, n: by[o + 1], w: by[o + 2], d: round + by[o + 3] - 128 };
    }),
  };
}
// Combina con lo de este dispositivo: por pregunta se queda con la que tenga más práctica.
function combine(local, inc) {
  const round = Math.max(local.round, inc.round), now = Date.now();
  return {
    round, resetAt: local.resetAt,
    q: local.q.map((x, i) => {
      const y = inc.q[i];
      if (y.n > x.n || (y.n === x.n && y.b > x.b)) return { ...y, d: y.d - inc.round + round, t: now };
      return { ...x, d: x.d - local.round + round };
    }),
  };
}
const summary = (st) => {
  const seen = st.q.filter(s => s.b >= 0).length, mast = st.q.filter(s => s.b >= 3).length;
  return { seen, mast };
};
async function shareProgress() {
  const url = `${APP_URL}#p=${exportCode()}`, { seen, mast } = summary(S);
  const text = `Mi progreso del cuestionario Clase 7 (${seen}/${N} vistas, ${mast} dominadas). Ábrelo para cargarlo:`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Mi progreso · Clase 7', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  let copied = false;
  try { await navigator.clipboard.writeText(url); copied = true; } catch (e) {}
  const body = $('modalBody'); body.dataset.view = 'share';
  body.innerHTML = `<div class="mhead"><span class="tag">Enlace de progreso</span><button class="close" id="mClose" aria-label="Cerrar">×</button></div>
    <h2>${copied ? '✓ Enlace copiado' : 'Copia este enlace'}</h2>
    <p class="hint" style="margin-top:0">Guárdalo donde no se pierda (WhatsApp, notas, correo). Al abrirlo en cualquier celular o PC se carga tu avance: ${seen}/${N} vistas, ${mast} dominadas.</p>
    <textarea class="code" readonly rows="4">${esc(url)}</textarea>
    <div class="actions"><button class="btn primary" id="copyAgain">Copiar enlace</button></div>`;
  const ta = body.querySelector('textarea');
  $('copyAgain').onclick = async () => { ta.select(); try { await navigator.clipboard.writeText(url); } catch (e) { document.execCommand('copy'); } $('copyAgain').textContent = '✓ Copiado'; };
  $('mClose').onclick = () => $('modal').close();
  if (!$('modal').open) $('modal').showModal();
  ta.focus(); ta.select();
}
function openImport(prefill = '') {
  const body = $('modalBody'); body.dataset.view = 'import';
  let inc = null;
  body.innerHTML = `<div class="mhead"><span class="tag">Cargar progreso</span><button class="close" id="mClose" aria-label="Cerrar">×</button></div>
    <h2>Pega tu enlace o código de progreso</h2>
    <textarea class="code" id="impText" rows="4" placeholder="https://sai1ss.github.io/Clase7/#p=…" spellcheck="false" autocapitalize="off">${esc(prefill)}</textarea>
    <p class="form-msg" id="impMsg" role="alert"></p>
    <div class="actions"><button class="btn primary" id="impGo" disabled>Cargar en este dispositivo</button></div>
    <p class="hint small">Se combina con lo que ya tengas aquí: de cada pregunta se conserva el registro con más práctica. No se pierde nada.</p>`;
  const ta = $('impText'), msg = $('impMsg'), go = $('impGo');
  const check = () => {
    inc = null; go.disabled = true; msg.className = 'form-msg'; msg.textContent = '';
    if (!ta.value.trim()) return;
    try {
      inc = decodeCode(ta.value);
      const a = summary(inc);
      msg.className = 'form-msg ok'; msg.textContent = `Progreso encontrado: ${a.seen}/${N} vistas, ${a.mast} dominadas.`;
      go.disabled = false;
    } catch (e) { msg.className = 'form-msg bad'; msg.textContent = e.message; }
  };
  ta.oninput = check; check();
  go.onclick = () => {
    if (!inc) return;
    S = combine(S, inc); save();
    $('modal').close();
    renderHome(true); show('home');
  };
  $('mClose').onclick = () => $('modal').close();
  if (!$('modal').open) $('modal').showModal();
}
$('shareProg').onclick = shareProgress;
$('loadProg').onclick = () => openImport();
// Abrir la app desde un enlace de progreso (…/Clase7/#p=…)
if (/[#&]p=/.test(location.hash)) {
  const link = location.hash;
  history.replaceState(null, '', location.pathname + location.search);
  setTimeout(() => openImport(link), 450);
}

/* ---------- Cuenta y sincronización en la nube ---------- */
const ICON_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
const ICON_CLOUD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10.5a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.2 10 4 4 0 0 0 7 18z"/></svg>';
const STATUS_TEXT = {
  loading: 'Conectando…', out: 'Sin sesión', syncing: 'Sincronizando…', ok: 'Guardado en la nube',
  offline: 'Sin conexión · se guardará al volver internet', error: 'No se pudo sincronizar',
};
function ago(d) {
  if (!d) return '';
  const s = Math.round((Date.now() - d) / 1000);
  return s < 10 ? 'ahora mismo' : s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function renderCloud(c) {
  const btn = $('acct'), line = $('cloudLine');
  btn.classList.toggle('hidden', !c.enabled);
  line.classList.toggle('hidden', !c.enabled || c.status === 'loading');
  if (!c.enabled) return;
  btn.dataset.status = c.status;
  btn.innerHTML = ICON_USER + '<i class="dot"></i>';
  btn.setAttribute('aria-label', c.user ? `Tu cuenta (${c.user.email}) · ${STATUS_TEXT[c.status] || ''}` : 'Entrar o crear cuenta');
  if (c.user) {
    line.className = 'cloud-line in';
    line.innerHTML = `${ICON_CLOUD}<span><b>${esc(STATUS_TEXT[c.status] || '')}</b> · ${esc(c.user.email)}</span>`;
    line.onclick = openAccount;
  } else {
    line.className = 'cloud-line out';
    line.innerHTML = `${ICON_CLOUD}<span><b>Guarda tu progreso en la nube.</b> Crea una cuenta gratis y sigue en cualquier celular o PC.</span><button class="btn ghost sm" type="button">Entrar</button>`;
    line.onclick = openAccount;
  }
  if (c.recovery && !$('modal').open) openAccount();
  if ($('modal').open && $('modalBody').dataset.view === 'account') refreshAccountStatus(c);
}
function refreshAccountStatus(c) {
  const el = $('acctStatus');
  if (el) el.innerHTML = `<i class="dot" data-status="${c.status}"></i>${esc(STATUS_TEXT[c.status] || '')}${c.lastSync && c.status === 'ok' ? ` · ${ago(c.lastSync)}` : ''}${c.error && c.status !== 'ok' ? `<small>${esc(c.error)}</small>` : ''}`;
}

let acctTab = 'in';
function openAccount() {
  const c = window.Cloud;
  if (!c || !c.enabled) return;
  const body = $('modalBody');
  body.dataset.view = 'account';
  const head = `<div class="mhead"><span class="tag">Tu cuenta</span><button class="close" id="mClose" aria-label="Cerrar">×</button></div>`;

  if (c.user && c.recovery) {
    body.innerHTML = `${head}<h2>Elige una contraseña nueva</h2>
      <form class="form" id="pwForm"><label>Contraseña nueva<input type="password" name="pw" minlength="6" autocomplete="new-password" required></label>
      <p class="form-msg" id="fMsg" role="alert"></p><button class="btn primary" type="submit">Guardar contraseña</button></form>`;
    $('pwForm').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, msg = $('fMsg'); f.querySelector('button').disabled = true;
      try { await Cloud.updatePassword(f.pw.value); msg.className = 'form-msg ok'; msg.textContent = 'Contraseña actualizada.'; setTimeout(openAccount, 900); }
      catch (err) { msg.className = 'form-msg bad'; msg.textContent = err.message; f.querySelector('button').disabled = false; }
    };
  } else if (c.user) {
    body.innerHTML = `${head}
      <div class="acct-id"><div class="avatar">${esc(c.user.email[0].toUpperCase())}</div><div><b>${esc(c.user.email)}</b><p class="acct-status" id="acctStatus"></p></div></div>
      <p class="hint">Tu progreso se guarda solo después de cada respuesta. Entra con este correo en otro celular o PC y continuarás donde lo dejaste.</p>
      <h2 style="margin-top:18px">Últimos simulacros</h2><ul class="exams" id="exams"><li class="muted small">Cargando…</li></ul>
      <div class="actions"><button class="btn ghost" id="syncNow">Sincronizar ahora</button><button class="btn ghost" id="signOut">Cerrar sesión</button></div>`;
    refreshAccountStatus(c);
    $('syncNow').onclick = () => Cloud.syncNow();
    $('signOut').onclick = async () => {
      if (!confirm('¿Cerrar sesión? Tu progreso queda guardado en tu cuenta y este dispositivo vuelve a empezar desde cero.')) return;
      await Cloud.signOut();
      store.del(KEY); S = fresh(); renderHome(true);
      $('modal').close();
    };
    Cloud.recentExams().then(list => {
      $('exams').innerHTML = list.length ? list.map(x => {
        const pass = x.total === EXAM && x.score >= PASS;
        return `<li><span class="mk ${pass ? 'ok' : 'bad'}">${pass ? '✓' : '✗'}</span><b>${x.score}/${x.total}</b><span class="muted small">${new Date(x.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span></li>`;
      }).join('') : '<li class="muted small">Aún no has hecho simulacros.</li>';
    }).catch(err => { $('exams').innerHTML = `<li class="muted small">${esc(err.message)}</li>`; });
  } else {
    const isIn = acctTab === 'in';
    body.innerHTML = `${head}
      <div class="seg-ctl" role="tablist"><button role="tab" aria-selected="${isIn}" data-tab="in">Entrar</button><button role="tab" aria-selected="${!isIn}" data-tab="up">Crear cuenta</button></div>
      <form class="form" id="authForm" novalidate>
        <label>Correo<input type="email" name="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" required></label>
        <label>Contraseña<input type="password" name="pw" minlength="6" autocomplete="${isIn ? 'current-password' : 'new-password'}" required>
          ${isIn ? '' : '<span class="field-hint">Mínimo 6 caracteres.</span>'}</label>
        <p class="form-msg" id="fMsg" role="alert"></p>
        <button class="btn primary" type="submit">${isIn ? 'Entrar' : 'Crear cuenta'}</button>
        ${isIn ? '<button class="linkish" type="button" id="forgot">¿Olvidaste tu contraseña?</button>' : ''}
      </form>
      <p class="hint small">Lo que ya respondiste en este dispositivo se suma a tu cuenta al entrar.</p>`;
    body.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { acctTab = b.dataset.tab; openAccount(); });
    const form = $('authForm'), msg = $('fMsg');
    const say = (t, ok = false) => { msg.className = 'form-msg ' + (ok ? 'ok' : 'bad'); msg.textContent = t; };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = form.email.value, pw = form.pw.value;
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return say('Escribe un correo válido.');
      if (pw.length < 6) return say('La contraseña debe tener al menos 6 caracteres.');
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; say('');
      try {
        if (isIn) { await Cloud.signIn(email, pw); $('modal').close(); }
        else {
          const r = await Cloud.signUp(email, pw);
          if (r.needsConfirm) say('Te enviamos un correo para confirmar la cuenta. Ábrelo y luego entra aquí.', true);
          else $('modal').close();
        }
      } catch (err) { say(err.message); }
      btn.disabled = false;
    };
    if ($('forgot')) $('forgot').onclick = async () => {
      const email = form.email.value;
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return say('Escribe tu correo arriba y vuelve a tocar «¿Olvidaste tu contraseña?».');
      try { await Cloud.resetPassword(email); say('Te enviamos un enlace para crear una contraseña nueva.', true); } catch (err) { say(err.message); }
    };
  }
  $('mClose').onclick = () => $('modal').close();
  if (!$('modal').open) $('modal').showModal();
}
$('modal').addEventListener('close', () => { delete $('modalBody').dataset.view; });
$('acct').onclick = openAccount;

if (window.Cloud) {
  Cloud.on(renderCloud);
  Cloud.init({
    getState: () => S,
    setState: (next) => {
      if (!next || !Array.isArray(next.q) || next.q.length !== N) return;
      S = next;
      store.set(KEY, JSON.stringify(S));
      if (!run) renderHome();
    },
  });
}

/* ---------- Uso sin conexión (al instalarla en la pantalla de inicio) ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.self === window.top) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
