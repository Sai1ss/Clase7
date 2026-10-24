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
function load() {
  try { const s = JSON.parse(store.get(KEY)); if (s && Array.isArray(s.q) && s.q.length === N) return s; } catch (e) {}
  return fresh();
}
let S = load();
const save = () => store.set(KEY, JSON.stringify(S));
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
    <ul class="list stagger">${list}</ul>
    <div class="actions"><button class="btn primary" id="rAgain">${exam ? 'Otro simulacro' : 'Siguiente tanda de 10'}</button><button class="btn ghost" id="rHome">Volver al inicio</button></div>`;
  r.querySelectorAll('.list button').forEach(b => b.onclick = () => openStudy(+b.dataset.i));
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
$('reset').onclick = () => { if (confirm('¿Borrar todo tu progreso?')) { store.del(KEY); S = fresh(); renderHome(true); } };
document.addEventListener('keydown', (e) => {
  if (!run || $('modal').open || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
  if (!run.answered && k >= 0) { e.preventDefault(); answer(k); }
  else if (run.answered && e.key === 'Enter' && run.mode !== 'exam') { e.preventDefault(); next(); }
});

renderHome(true);
replay($('home'), 'view-enter');

/* ---------- Uso sin conexión (al instalarla en la pantalla de inicio) ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.self === window.top) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
