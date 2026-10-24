/* Ilustraciones SVG para las preguntas que no tienen imagen en el PDF.
   Cada escena se dibuja en un lienzo de 320×180 y no revela la respuesta. */
let UID = 0;
const C = { g: '#b9dba2', road: '#5d6470', w: '#ffffff', y: '#f3c533', me: '#2f6fe0', oth: '#a5adb8', red: '#e2463b', side: '#d8d3c6', sky: '#d6e9f8', paper: '#dde8f6' };
const sv = (inner, bg = C.g) => `<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="180" fill="${bg}"/>${inner}</svg>`;
const rect = (x, y, w, h, f, rx = 0, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${ex}/>`;
const ln = (x1, y1, x2, y2, c = C.w, w = 3, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const tx = (x, y, s, size = 14, f = '#18202e', a = 'middle', wt = 700) => `<text x="${x}" y="${y}" font-size="${size}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="${wt}" fill="${f}" text-anchor="${a}">${s}</text>`;
const circ = (x, y, r, f, ex = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${ex}/>`;
function car(x, y, a = 0, c = C.me, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><rect x="-11" y="-20" width="22" height="40" rx="6" fill="${c}" stroke="rgba(0,0,0,.28)"/><rect x="-8" y="-12" width="16" height="8" rx="2" fill="#d8e7ff"/><rect x="-8" y="9" width="16" height="5" rx="2" fill="#d8e7ff" opacity=".8"/></g>`;
}
function truck(x, y, a = 0, c = '#c9772f', len = 84) {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-13" y="${-len / 2}" width="26" height="22" rx="4" fill="${c}"/><rect x="-10" y="${-len / 2 + 4}" width="20" height="7" rx="2" fill="#d8e7ff"/><rect x="-14" y="${-len / 2 + 25}" width="28" height="${len - 25}" rx="3" fill="#eef0f3" stroke="#8a929c"/></g>`;
}
function arrow(d, c = '#ffd23f', w = 4) {
  const id = 'ah' + (UID++);
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker></defs><path class="draw" pathLength="1" d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${id})"/>`;
}
function center(x1, y1, x2, y2, t) {
  const h = y1 === y2, o = (d) => h ? [x1, y1 + d, x2, y2 + d] : [x1 + d, y1, x2 + d, y2];
  switch (t) {
    case 'yd': return ln(x1, y1, x2, y2, C.y, 3, '14 10');
    case 'ys': return ln(x1, y1, x2, y2, C.y, 3);
    case 'wd': return ln(x1, y1, x2, y2, C.w, 3, '14 10');
    case 'ws': return ln(x1, y1, x2, y2, C.w, 3);
    case 'ysd': return ln(...o(-3), C.y, 3) + ln(...o(3), C.y, 3, '14 10');
    default: return '';
  }
}
function hroad(y, h, c = 'yd') { return rect(0, y, 320, h, C.road) + ln(0, y + 3, 320, y + 3, C.w, 2) + ln(0, y + h - 3, 320, y + h - 3, C.w, 2) + center(0, y + h / 2, 320, y + h / 2, c); }
function inter() {
  return rect(0, 50, 320, 70, C.road) + rect(120, 0, 80, 180, C.road)
    + center(0, 85, 118, 85, 'yd') + center(202, 85, 320, 85, 'yd') + center(160, 0, 160, 48, 'yd') + center(160, 122, 160, 180, 'yd')
    + ln(162, 125, 198, 125, C.w, 4);
}
function light(x, y, st, s = .58) {
  const off = '#3a3f48';
  const lamp = (cy, col, on, bl) => circ(15, cy, 10, on ? col : off, bl ? 'class="blink"' : '');
  let g = lamp(69, '#34c759', st === 'g');
  if (st === 'rGA') g = circ(15, 69, 10, off) + `<path d="M8 69h11M15 63l6 6-6 6" stroke="#34c759" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="0" y="0" width="30" height="84" rx="7" fill="#1f232b"/>${lamp(15, '#ff3b30', st === 'r' || st === 'rGA' || st === 'fr', st === 'fr')}${lamp(42, '#ffcc00', st === 'y' || st === 'fy', st === 'fy')}${g}</g>`;
}
function speedSign(x, y, label, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${rect(18, 50, 4, 26, '#7d858f')}${rect(0, 0, 40, 52, '#fff', 4, 'stroke="#222" stroke-width="2"')}${tx(20, 15, 'MÁX', 9, '#222')}${tx(20, 42, label, 22, '#222')}</g>`;
}
function oct(x, y, r, label = 'ALTO') {
  let p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push((x + r * Math.cos(a)).toFixed(1) + ',' + (y + r * Math.sin(a)).toFixed(1)); }
  return `<polygon points="${p.join(' ')}" fill="#d32f2f" stroke="#fff" stroke-width="1.5"/>` + tx(x, y + r * .28, label, r * .55, '#fff');
}
function tree(x, y) { return rect(x - 2, y + 8, 4, 12, '#7a5a3a') + circ(x, y, 14, '#5c9b45'); }
function person(x, y, arm = false, c = '#18202e') {
  return `<g transform="translate(${x} ${y})" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"><circle cx="0" cy="-30" r="6" fill="${c}" stroke="none"/><line x1="0" y1="-23" x2="0" y2="0"/><line x1="0" y1="0" x2="-7" y2="15"/><line x1="0" y1="0" x2="7" y2="15"/><line x1="0" y1="-18" x2="-8" y2="-6"/>${arm ? '<line x1="0" y1="-18" x2="-24" y2="-18"/>' : '<line x1="0" y1="-18" x2="8" y2="-6"/>'}</g>`;
}
function dim(x1, y1, x2, y2, label, c = '#fff') {
  return ln(x1, y1, x2, y2, c, 2) + (y1 === y2 ? ln(x1, y1 - 5, x1, y1 + 5, c, 2) + ln(x2, y2 - 5, x2, y2 + 5, c, 2) + tx((x1 + x2) / 2, y1 - 6, label, 13, c)
    : ln(x1 - 5, y1, x1 + 5, y1, c, 2) + ln(x2 - 5, y2, x2 + 5, y2, c, 2) + tx(x1 + 10, (y1 + y2) / 2 + 5, label, 13, c, 'start'));
}
function card(label, big) {
  return sv(`<rect x="50" y="28" width="220" height="124" rx="14" fill="#fff" stroke="#c9d3e0" stroke-width="2"/><path d="M50 42a14 14 0 0 1 14-14h192a14 14 0 0 1 14 14v12H50z" fill="#2356d8"/>`
    + tx(160, 47, 'ALBERTA · ' + label, 10.5, '#fff') + rect(66, 66, 48, 62, '#dfe6ef', 6) + circ(90, 88, 11, '#9aa7b8') + `<path d="M72 126c3-16 33-16 36 0" fill="#9aa7b8"/>`
    + rect(126, 72, 80, 7, '#dfe6ef', 3) + rect(126, 88, 60, 7, '#dfe6ef', 3) + rect(126, 104, 70, 7, '#dfe6ef', 3)
    + circ(236, 120, 24, '#e2463b') + tx(236, 129, big, 24, '#fff'), C.paper);
}
function doc(l1, l2, icon) {
  return sv(`<rect x="100" y="12" width="120" height="156" rx="10" fill="#fff" stroke="#c9d3e0" stroke-width="2"/>` + tx(160, 34, l1, 9.5, '#2356d8') + tx(160, 46, l2, 9.5, '#2356d8')
    + rect(116, 58, 88, 5, '#e3e8ef', 2) + rect(116, 68, 70, 5, '#e3e8ef', 2) + rect(116, 78, 80, 5, '#e3e8ef', 2) + tx(160, 128, icon, 38) + ln(118, 152, 202, 152, '#18202e', 1.5), C.paper);
}
function clock(icon, label) {
  let t = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; t += ln(110 + 44 * Math.sin(a), 90 - 44 * Math.cos(a), 110 + 51 * Math.sin(a), 90 - 51 * Math.cos(a), '#18202e', i % 3 ? 2 : 4); }
  return sv(circ(110, 90, 60, '#fff', 'stroke="#18202e" stroke-width="4"') + t + ln(110, 90, 110, 56, '#18202e', 5) + ln(110, 90, 136, 102, '#18202e', 4) + circ(110, 90, 5, '#e2463b')
    + tx(240, 104, icon, 54) + tx(240, 150, label, 14), C.paper);
}
function pedals(label) {
  return sv(rect(0, 140, 320, 40, '#1b1f26') + rect(108, 58, 84, 48, '#8b95a3', 9) + ln(120, 72, 180, 72, '#6d7683', 3) + ln(120, 82, 180, 82, '#6d7683', 3) + ln(120, 92, 180, 92, '#6d7683', 3)
    + rect(214, 44, 28, 76, '#8b95a3', 6) + tx(150, 128, 'FRENO', 12, '#cfd6df') + tx(228, 136, 'ACEL.', 10, '#cfd6df')
    + rect(18, 16, 112, 28, '#e2463b', 14) + tx(74, 35, label, 12, '#fff'), '#2a2f38');
}
function accelScene(meOnRamp) {
  return rect(0, 20, 320, 80, C.road) + ln(0, 23, 320, 23, C.w, 2) + center(0, 60, 320, 60, 'wd')
    + rect(40, 100, 230, 24, C.road) + `<polygon points="270,100 310,100 270,124" fill="${C.road}"/>` + `<path d="M-10 196 Q22 112 60 112" fill="none" stroke="${C.road}" stroke-width="24"/>`
    + ln(40, 100, 280, 100, C.w, 2, '8 6') + ln(60, 124, 268, 124, C.w, 2)
    + (meOnRamp ? car(105, 112, 90) + car(245, 80, 90, C.oth) + arrow('M128 112 C160 112 168 82 205 82')
      : car(150, 80, 90) + car(112, 112, 90, C.oth) + car(60, 40, 90, C.oth));
}
function busRear(mode) {
  const r = mode === 'r', a = mode === 'a';
  return sv(`<polygon points="0,180 320,180 205,96 115,96" fill="${C.road}"/>` + rect(95, 18, 130, 136, '#f6b800', 12) + rect(108, 38, 104, 44, '#2a3240', 6)
    + tx(160, 100, 'SCHOOL BUS', 11, '#111') + rect(88, 140, 144, 14, '#222', 4)
    + circ(110, 28, 6, r ? '#ff3b30' : '#6b2222', r ? 'class="blink"' : '') + circ(210, 28, 6, r ? '#ff3b30' : '#6b2222', r ? 'class="blink2"' : '')
    + circ(130, 28, 6, a ? '#ffb000' : '#6b5522', a ? 'class="blink"' : '') + circ(190, 28, 6, a ? '#ffb000' : '#6b5522', a ? 'class="blink2"' : '')
    + (r ? oct(74, 92, 16, 'STOP') : '') + rect(104, 120, 22, 10, '#c33', 2) + rect(194, 120, 22, 10, '#c33', 2), C.sky);
}
function ambulance(x, y, a) {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-13" y="-26" width="26" height="52" rx="5" fill="#fff" stroke="#c33" stroke-width="2"/><rect x="-13" y="4" width="26" height="6" fill="#d33"/><rect x="-10" y="-20" width="20" height="8" rx="2" fill="#d8e7ff"/><rect class="blink" x="-11" y="-8" width="10" height="5" fill="#ff3b30"/><rect class="blink2" x="1" y="-8" width="10" height="5" fill="#2f7bff"/></g>`;
}
function nightRoad(bg, extra) {
  return sv(`<polygon points="30,180 290,180 175,62 145,62" fill="#2b3240"/>` + ln(160, 178, 160, 64, C.y, 3, '14 12') + extra + rect(110, 160, 100, 30, '#2f6fe0', 10), bg);
}
function seatFig(scale, label) {
  return sv(`<g transform="translate(160 96) scale(${scale})">` + rect(-50, -70, 100, 140, '#8d97a6', 18) + rect(-30, -96, 60, 30, '#8d97a6', 10) + circ(0, -48, 18, '#f0c9a0')
    + rect(-30, -26, 60, 80, '#3d6fd8', 14) + ln(26, -24, -22, 50, '#222', 8) + ln(-30, 40, 30, 40, '#222', 8) + '</g>' + tx(270, 100, label, 20), C.paper);
}

const SCN = {
  1: () => sv(hroad(80, 60) + car(90, 125, 90) + car(230, 95, -90, C.oth) + speedSign(255, 6, '?') + tree(40, 40) + tree(150, 34)),
  2: () => sv(ln(60, 0, 60, 180, '#e8e8e8', 3) + ln(260, 0, 260, 180, '#e8e8e8', 3) + car(160, 60, 0, C.me, 1.3) + arrow('M160 92 C160 140 125 152 70 152') + rect(14, 14, 114, 26, '#000', 13, 'fill-opacity=".45"') + tx(71, 32, 'marcha atrás', 13, '#fff'), '#6b717c'),
  3: () => sv(inter() + light(268, 2, 'rGA') + car(180, 150, 0) + arrow('M180 126 Q180 103 214 103 L300 103')),
  4: () => card('LICENCIA COMPLETA', '?'),
  5: () => sv(hroad(45, 90) + truck(95, 112, 90) + car(205, 68, 90) + arrow('M222 70 C256 70 262 112 300 112')),
  6: () => sv(inter() + light(268, 2, 'r') + car(180, 150, 0) + arrow('M180 126 Q180 103 214 103 L300 103')),
  8: () => sv(hroad(40, 100, 'ws') + car(80, 65, 90, C.oth) + car(170, 115, 90) + tx(290, 34, '→ mismo sentido', 11, '#18202e', 'end')),
  9: () => sv(rect(0, 150, 320, 30, C.side) + rect(0, 20, 320, 130, C.road) + center(0, 70, 320, 70, 'yd') + ln(0, 120, 320, 120, C.w, 3) + ln(0, 150, 320, 150, '#aaa', 3)
    + car(60, 135, 90, C.oth, .9) + car(205, 135, 90, '#c0504d', .9) + car(130, 95, 90)),
  10: () => sv(hroad(40, 100, 'wd') + rect(98, 46, 54, 42, '#e2463b', 6, 'fill-opacity=".28"') + car(122, 67, 90, C.oth) + car(180, 115, 90) + tx(125, 32, 'punto ciego', 12) + tx(180, 160, '👀', 18)),
  13: () => doc('CONSENTIMIENTO', 'DE LOS PADRES', '✍️'),
  14: () => sv(inter() + `<polygon points="236,6 284,6 260,44" fill="#d32f2f"/><polygon points="244,11 276,11 260,36" fill="#fff"/>` + car(180, 150, 0) + car(60, 103, 90, C.oth) + person(225, 150)),
  15: () => nightRoad('#0f1626', `<polygon points="120,165 200,165 178,104 142,104" fill="#ffe680" opacity=".35"/>` + tx(160, 86, '🦌', 22) + circ(272, 30, 12, '#f4f1d0')),
  16: () => sv(rect(80, 14, 160, 152, C.me, 34) + rect(96, 36, 128, 112, '#e9edf3', 14) + rect(112, 50, 40, 36, '#b9c2cf', 8) + rect(168, 50, 40, 36, '#b9c2cf', 8) + rect(106, 98, 108, 40, '#b9c2cf', 8)
    + circ(132, 66, 10, '#f0c9a0') + circ(188, 66, 10, '#f0c9a0') + circ(124, 116, 10, '#f0c9a0') + circ(160, 116, 10, '#f0c9a0') + circ(196, 116, 10, '#f0c9a0') + circ(178, 108, 10, '#f0c9a0', 'stroke="#e2463b" stroke-width="3"')
    + tx(282, 96, '5 cinturones', 11, '#18202e') + tx(282, 112, '6 personas', 11, '#e2463b'), C.paper),
  17: () => sv(hroad(60, 60, '') + car(230, 90, 90, C.oth) + car(110, 90, 90) + rect(270, 30, 4, 32, '#7d858f') + rect(262, 22, 20, 12, '#f3c533', 2) + tx(172, 48, '⏱ 2 segundos', 13)),
  19: () => sv(inter() + light(268, 2, 'fr') + car(180, 150, 0) + tx(262, 170, 'rojo intermitente', 10.5, '#18202e')),
  21: () => seatFig(.75, 'edad ?'),
  22: () => sv(rect(0, 150, 320, 30, C.side) + rect(0, 30, 320, 120, C.road) + center(0, 70, 320, 70, 'yd') + ln(0, 150, 320, 150, '#999', 3) + car(55, 122, 90, C.oth) + car(160, 120, 90) + car(265, 122, 90, C.oth) + dim(205, 131, 205, 150, '? cm')),
  23: () => doc('INFORME', 'MÉDICO', '🩺'),
  26: () => card('CLASE 5 · PROBATORIA', '⏳'),
  27: () => sv(rect(100, 0, 120, 180, C.road) + center(160, 0, 160, 180, 'yd') + ln(168, 50, 212, 110, C.w, 7) + ln(212, 50, 168, 110, C.w, 7) + car(190, 155, 0) + tree(50, 60) + tree(270, 120)),
  28: () => sv(hroad(40, 100) + car(140, 96, 90) + car(184, 84, 205, C.red) + `<polygon points="166,70 172,82 184,78 176,90 186,98 172,98 168,110 162,98 150,100 158,90 150,80 162,82" fill="#ffd23f"/>` + tx(262, 30, '$ ?', 24)),
  29: () => sv(hroad(50, 80, '') + ln(292, 54, 292, 126, C.w, 5) + car(255, 90, 90, C.oth) + car(160, 90, 90) + dim(182, 64, 233, 64, '?')),
  30: () => sv(hroad(50, 80, '') + car(205, 90, 90) + car(158, 90, 90, C.red) + `<polygon points="182,22 198,48 166,48" fill="#ffd23f" stroke="#18202e" stroke-width="2"/>` + tx(182, 45, '!', 16)),
  31: () => sv(hroad(40, 100) + rect(0, 40, 320, 100, '#dceeff', 0, 'fill-opacity=".35"') + `<path d="M40 128 Q100 125 140 112" stroke="#222" stroke-width="3" fill="none" opacity=".5"/><path d="M40 112 Q100 108 136 96" stroke="#222" stroke-width="3" fill="none" opacity=".5"/>` + car(160, 100, 60) + tx(270, 30, '❄️', 22)),
  33: () => sv(inter() + light(268, 2, 'g') + car(180, 150, 0) + car(140, 26, 180, C.oth) + arrow('M180 126 Q180 67 140 67 L30 67')),
  34: () => sv(rect(0, 15, 320, 70, C.road) + rect(0, 85, 320, 26, C.road) + ln(0, 18, 320, 18, C.w, 2) + center(0, 50, 320, 50, 'wd') + ln(0, 85, 320, 85, C.w, 2, '8 6')
    + `<path d="M-10 186 Q30 100 70 98" fill="none" stroke="${C.road}" stroke-width="24"/><path d="M250 98 Q290 100 330 186" fill="none" stroke="${C.road}" stroke-width="24"/>`
    + car(92, 98, 80, C.oth) + car(190, 70, 100, '#c0504d') + arrow('M108 96 Q140 92 168 68', '#ffd23f', 3) + arrow('M206 74 Q236 84 262 102', '#ff8a7a', 3)),
  35: () => doc('EXAMEN', 'DE MANEJO', '🔧'),
  36: () => sv(hroad(40, 100) + car(170, 115, 90, C.oth) + car(115, 85, 65) + arrow('M136 76 Q190 60 240 64') + speedSign(276, 0, '?', .7)),
  38: () => sv(hroad(40, 100) + [60, 100, 140, 180, 220, 260].map(x => `<polygon points="${x},98 ${x + 7},84 ${x + 14},98" fill="#ff7a1a" stroke="#fff"/>`).join('') + `<polygon points="30,4 52,26 30,48 8,26" fill="#ff7a1a" stroke="#222"/>` + tx(30, 31, '🚧', 14) + car(120, 118, 90) + speedSign(276, 0, '?', .7)),
  39: () => pedals('SIN FRENOS ABS'),
  40: () => sv(hroad(40, 100) + car(210, 115, 90) + ambulance(90, 115, 90) + car(250, 64, -90, C.oth) + tx(90, 162, '🔊 sirena', 12)),
  41: () => pedals('PARADA NORMAL'),
  42: () => seatFig(.9, '🔒'),
  44: () => sv(rect(130, 0, 60, 180, C.road) + rect(0, 60, 320, 60, C.road) + circ(160, 90, 64, C.road) + circ(160, 90, 30, '#8cc06f', 'stroke="#fff" stroke-width="3"')
    + ln(162, 156, 188, 156, C.w, 3, '5 4') + car(175, 172, 0, C.me, .8) + car(118, 120, 135, C.oth, .8) + arrow('M206 66 A50 50 0 0 0 114 66', '#ffd23f', 3)),
  45: () => sv(rect(0, 20, 320, 80, C.road) + ln(0, 23, 320, 23, C.w, 2) + center(0, 60, 320, 60, 'wd') + `<polygon points="110,100 150,100 150,124" fill="${C.road}"/>` + rect(150, 100, 120, 24, C.road)
    + `<path d="M250 112 Q290 114 330 190" fill="none" stroke="${C.road}" stroke-width="24"/>` + ln(140, 100, 320, 100, C.w, 2, '8 6') + car(80, 80, 90, C.oth) + car(215, 112, 92) + arrow('M240 112 Q272 116 296 150', '#ffd23f', 3)),
  46: () => sv(rect(0, 20, 320, 84, C.road) + center(0, 48, 320, 48, 'wd') + center(0, 76, 320, 76, 'wd') + rect(130, 104, 60, 76, C.road) + center(160, 104, 160, 180, 'yd')
    + rect(14, 2, 86, 16, '#111', 2) + tx(57, 14, '← ONE WAY', 10, '#fff') + car(175, 150, 0) + arrow('M175 126 Q175 62 120 62', '#ffd23f', 3) + tx(96, 66, '?', 18, '#fff')),
  47: () => sv(rect(0, 30, 320, 60, C.road) + center(0, 60, 320, 60, 'yd') + rect(130, 90, 60, 90, C.road) + center(160, 92, 160, 180, 'yd') + car(175, 148, 0) + car(50, 75, 90, C.oth) + tx(160, 22, '?', 18)),
  48: () => sv(rect(90, 0, 140, 180, C.road) + center(136, 0, 136, 180, 'wd') + center(184, 0, 184, 180, 'wd') + rect(0, 26, 320, 50, C.road) + center(0, 51, 88, 51, 'yd') + center(232, 51, 320, 51, 'yd')
    + rect(240, 92, 70, 16, '#111', 2) + tx(275, 104, 'ONE WAY ↑', 10, '#fff') + car(113, 140, 0, C.me, .9).replace('<g ', '<g opacity=".45" ') + car(160, 140, 0, C.me, .9).replace('<g ', '<g opacity=".45" ') + car(207, 140, 0, C.me, .9).replace('<g ', '<g opacity=".45" ')
    + tx(160, 108, '¿qué carril?', 13, '#fff') + arrow('M160 80 Q160 51 120 51 L20 51', '#ffd23f', 3)),
  49: () => sv(ln(60, 0, 60, 180, '#e8e8e8', 3) + ln(260, 0, 260, 180, '#e8e8e8', 3) + car(160, 56, 0, C.me, 1.3) + arrow('M160 90 L160 160') + rect(14, 14, 144, 26, '#000', 13, 'fill-opacity=".45"') + tx(86, 32, 'atrás en línea recta', 12, '#fff'), '#6b717c'),
  50: () => sv(accelScene(true)),
  52: () => clock('🌙', 'aprendiz Clase 7'),
  53: () => sv(inter() + light(268, 2, 'fy') + car(180, 150, 0) + tx(262, 170, 'amarillo intermitente', 10.5, '#18202e')),
  54: () => clock('🏫', 'zona escolar'),
  56: () => sv(accelScene(false)),
  57: () => sv(`<polygon points="0,180 320,180 320,58 0,160" fill="#9cc386"/>` + `<g transform="translate(190 92) rotate(-19)">${rect(-44, -30, 88, 22, C.me, 8)}${rect(-26, -46, 48, 20, C.me, 8)}${rect(-20, -42, 16, 12, '#d8e7ff', 2)}${rect(2, -42, 16, 12, '#d8e7ff', 2)}${circ(-26, -6, 9, '#222')}${circ(26, -6, 9, '#222')}</g>`
    + rect(16, 14, 96, 74, '#fff', 10) + ln(100, 20, 100, 82, '#888', 5) + car(62, 50, 0, C.me, .9) + rect(46, 28, 5, 12, '#222', 1) + rect(73, 28, 5, 12, '#222', 1) + tx(62, 24, '?', 12) + tx(104, 98, 'bordillo', 10, '#18202e', 'end') + tx(250, 40, 'cuesta arriba ↗', 13), C.sky),
  58: () => busRear('r'),
  59: () => sv(rect(0, 70, 60, 110, '#9aa6b6') + rect(18, 40, 40, 140, '#7f8ca0') + rect(262, 50, 58, 130, '#9aa6b6') + rect(240, 80, 40, 100, '#7f8ca0') + `<polygon points="50,180 270,180 170,70 150,70" fill="${C.road}"/>` + ln(160, 178, 160, 72, C.y, 3, '12 10')
    + ln(160, 160, 160, 84, '#fff', 2, '2 5') + tx(198, 94, '? s', 14, '#18202e') + tx(160, 174, '👁', 20), C.sky),
  62: () => sv(rect(0, 150, 320, 30, C.side) + rect(0, 30, 320, 120, C.road) + center(0, 70, 320, 70, 'yd') + ln(0, 150, 320, 150, '#999', 3) + car(70, 132, 90, C.oth) + car(160, 132, 90) + car(255, 132, 90, C.oth) + car(40, 92, 90, '#c0504d') + arrow('M182 122 Q206 98 262 94', '#ffd23f', 3)),
  63: () => sv(`<path d="M0 180 L0 140 Q160 30 320 140 L320 180Z" fill="#9cc386"/><path d="M0 140 Q160 30 320 140" fill="none" stroke="${C.road}" stroke-width="12"/>` + car(70, 98, 60, C.me, .8) + car(258, 104, -120, C.oth, .8).replace('<g ', '<g opacity=".35" ') + tx(160, 56, '?', 20), C.sky),
  64: () => clock('🛝', 'zona de juegos'),
  66: () => sv(hroad(40, 100) + rect(0, 40, 320, 100, '#dceeff', 0, 'fill-opacity=".3"') + `<path d="M30 110 Q110 112 150 96" stroke="#222" stroke-width="3" fill="none" opacity=".5"/>` + car(178, 88, 120) + tx(270, 30, '❓', 20)),
  67: () => sv(rect(0, 150, 320, 30, C.side) + rect(0, 30, 320, 120, C.road) + rect(268, 0, 52, 180, C.road) + center(0, 70, 266, 70, 'yd') + ln(0, 150, 266, 150, '#999', 3) + rect(250, 150, 4, 26, '#7d858f') + oct(252, 140, 13) + car(150, 130, 90) + dim(172, 108, 238, 108, '? m')),
  68: () => sv(ln(70, 20, 70, 160, '#fff', 3) + ln(160, 20, 160, 160, '#fff', 3) + ln(250, 20, 250, 160, '#fff', 3) + rect(82, 56, 66, 66, '#1f5fd1', 8) + tx(115, 104, '♿', 42, '#fff') + car(205, 90, 0, C.oth, 1.2), '#6b717c'),
  69: () => sv(rect(0, 60, 320, 60, '#2b3240') + center(0, 90, 320, 90, 'wd') + `<polygon points="122,84 122,96 232,112 232,68" fill="#ffe680" opacity=".25"/>` + car(250, 90, 90, C.oth) + car(100, 90, 90) + dim(122, 46, 230, 46, '? m', '#e8ecf3') + circ(280, 26, 10, '#f4f1d0'), '#0f1626'),
  72: () => card('CLASE 7 · APRENDIZ', '?'),
  73: () => sv(speedSign(140, 30, '?', 1.6) + tx(70, 80, '🌧️', 34) + tx(260, 80, '❄️', 34) + tx(70, 140, '🌫️', 34) + tx(260, 140, '☀️', 34), C.sky),
  74: () => sv(rect(0, 50, 320, 70, C.road) + rect(120, 0, 80, 180, C.road) + car(180, 152, 0) + car(50, 103, 90, C.oth) + tx(160, 90, '?', 22, '#fff') + tree(40, 20) + tree(270, 150)),
  76: () => sv(accelScene(true)),
  77: () => nightRoad('#8a939e', `<polygon points="125,165 195,165 178,128 142,128" fill="#fff6c8" opacity=".45"/>` + rect(0, 0, 320, 180, '#ebeef2', 0, 'fill-opacity=".55"')),
  79: () => sv(inter() + light(268, 2, 'r') + car(180, 150, 0) + arrow('M180 126 Q180 103 214 103 L300 103')),
  81: () => sv(rect(100, 0, 120, 180, C.road) + center(160, 0, 160, 180, 'wd') + [0, 1, 2, 3, 4, 5, 6, 7].map(k => rect(104 + k * 14.5, 34, 8, 26, '#fff')).join('') + car(190, 92, 0, C.oth) + person(132, 64) + car(130, 152, 0) + tx(40, 30, 'mismo sentido ↑', 11, '#18202e', 'start')),
  82: () => sv(rect(150, 70, 70, 110, '#8d97a6', 18) + rect(160, 26, 50, 40, '#6f7a89', 12) + circ(170, 56, 26, '#f0c9a0') + circ(178, 58, 5, '#d6a77a') + rect(120, 80, 60, 70, '#3d6fd8', 14) + arrow('M260 46 L222 46', '#e2463b', 3) + tx(272, 51, '?', 18), C.paper),
  84: () => sv(rect(14, 4, 136, 36, '#1f7a4a', 6) + tx(82, 20, 'PASSING LANE', 11, '#fff') + tx(82, 33, 'AHEAD', 11, '#fff') + hroad(50, 90, 'wd') + truck(170, 72, 90, C.me, 70) + car(80, 72, 90, C.oth) + car(40, 118, 90, C.oth)),
  85: () => busRear('a'),
  86: () => clock('🌇', '¿“noche”?'),
  88: () => sv(rect(0, 0, 320, 70, C.road) + center(0, 35, 320, 35, 'yd') + rect(0, 70, 320, 26, C.side) + person(70, 92) + rect(130, 96, 60, 84, '#8b919a') + car(160, 128, 0) + car(260, 52, 90, C.oth) + tx(270, 140, 'P', 30, '#fff'), '#6b717c'),
  89: () => sv(rect(120, 0, 80, 180, C.road) + center(160, 0, 160, 180, 'yd') + rect(0, 46, 320, 28, '#8c7b6a') + Array.from({ length: 27 }, (_, k) => rect(k * 12 + 2, 48, 5, 24, '#6b5848')).join('') + ln(0, 53, 320, 53, '#777', 3) + ln(0, 67, 320, 67, '#777', 3)
    + ln(180, 112, 198, 112, C.w, 4) + rect(234, 30, 4, 90, '#7d858f') + ln(218, 26, 254, 50, '#fff', 7) + ln(254, 26, 218, 50, '#fff', 7) + circ(224, 70, 7, '#ff3b30', 'class="blink"') + circ(248, 70, 7, '#ff3b30', 'class="blink2"') + tx(276, 30, '🔔', 18) + car(180, 150, 0)),
  90: () => sv(`<path d="M-10 140 C120 140 210 120 250 -10" fill="none" stroke="${C.road}" stroke-width="72"/><path d="M-10 140 C120 140 210 120 250 -10" fill="none" stroke="${C.y}" stroke-width="3" stroke-dasharray="14 10"/>` + car(70, 157, 90) + tree(270, 120) + tree(60, 40)),
  92: () => sv(inter() + `<g transform="translate(212 112) rotate(118)">${rect(-13, -40, 26, 22, '#c9772f', 4)}${rect(-14, -16, 28, 56, '#555', 3)}${[-9, -3, 3, 9].map(x => rect(x - 3, -16, 6, 92, '#8b5a2b', 3)).join('')}</g>` + `<path d="M150 160 A70 70 0 0 1 120 100" stroke="#e2463b" stroke-width="3" fill="none" stroke-dasharray="6 5"/>` + tx(96, 150, 'peligro', 11, '#e2463b') + car(180, 168, 0, C.me, .8)),
  94: () => sv(inter() + [24, 74, 244, 294].map(x => car(x, 103, 90, '#2b2f36', .85) + rect(x - 2, 88, 10, 6, '#8e5bd6')).join('') + car(180, 155, 0) + tx(64, 44, 'cortejo fúnebre →', 11, '#18202e')),
  95: () => sv(hroad(30, 95) + rect(0, 125, 320, 40, '#c9b48f') + `<path d="M0 132 L320 132" stroke="#a8936f" stroke-width="2" stroke-dasharray="3 6"/>` + car(160, 120, 90) + tx(250, 160, 'grava', 12, '#5a4a2f')),
  97: () => sv(rect(0, 0, 320, 24, C.side) + ln(0, 24, 320, 24, '#999', 3) + [20, 80, 140, 200, 260].map(x => ln(x, 24, x + 40, 120, '#fff', 3)).join('') + car(76, 60, -22, C.oth) + car(136, 60, -22) + car(256, 60, -22, C.oth) + dim(150, 24, 150, 40, '? cm', '#fff'), '#6b717c'),
  98: () => sv(rect(0, 30, 320, 110, C.road) + center(0, 85, 128, 85, 'yd') + center(192, 85, 320, 85, 'yd') + [0, 1, 2, 3, 4, 5, 6].map(k => rect(140, 36 + k * 15, 44, 8, '#fff')).join('') + rect(0, 140, 320, 40, C.side) + rect(0, 0, 320, 30, C.side) + person(206, 172, true) + car(60, 110, 90)),
  101: () => sv(inter() + light(268, 2, 'y') + car(180, 160, 0) + tx(262, 170, 'amarillo fijo', 10.5, '#18202e')),
  102: () => sv(hroad(40, 100, 'ysd') + car(80, 115, 90) + car(240, 65, -90, C.oth) + tx(12, 34, 'tu carril ↓ (abajo, hacia la derecha)', 11, '#18202e', 'start')),
  103: () => sv(speedSign(60, 40, '?', 1.5) + tx(200, 80, '🏫', 46) + rect(170, 104, 110, 36, '#fff', 10, 'stroke="#c9d3e0"') + tx(225, 129, '9:00 a.m.', 18), C.sky),
  104: () => sv(hroad(40, 100) + car(210, 115, 90, C.oth) + car(120, 98, 70) + arrow('M140 88 Q180 64 236 66', '#ffd23f', 3)),
  106: () => sv(rect(0, 150, 320, 30, C.side) + rect(0, 30, 320, 120, C.road) + center(0, 70, 320, 70, 'yd') + ln(0, 150, 320, 150, '#999', 3)
    + `<g transform="translate(222 158)">${rect(-8, -14, 16, 22, '#e2463b', 4)}${rect(-12, -18, 24, 6, '#e2463b', 3)}${rect(-14, -8, 28, 5, '#c33', 2)}</g>` + car(120, 130, 90) + dim(142, 110, 214, 110, '? m')),
  108: () => sv(hroad(40, 100) + car(210, 115, 90) + car(120, 98, 70, C.oth) + arrow('M140 88 Q180 64 236 66', '#ffd23f', 3) + tx(210, 160, 'tú', 12, '#fff')),
};
