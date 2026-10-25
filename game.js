// =====================================================================
//  Изометрический движок LEVEL 30 (v2: главы из сцен — улицы и интерьеры).
//  Контент: chapters/*.js (главы), objects.js (объекты), story.js (общее).
//  Формат описан в ENGINE.md.
// =====================================================================
(() => {
'use strict';
const REG = window.L30;
const CHAPTERS = (S.chapters ? S.chapters.map(id => REG.chapters.find(c => c.id === id)).filter(Boolean)
  : REG.chapters.slice().sort((a, b) => (a.n || 0) - (b.n || 0)));
for (const c of REG.chapters) if (c.cast) Object.assign(S.cast, c.cast);
FONT.E = '111100111100111';
// editions (story.js → editions): short.html or ?ed=short skips some objectives and scenes
const ED_NAME = window.L30_ED || params.get('ed') || (location.pathname.match(/(short|teaser)\.html$/) || [])[1] || null;
const ED = (() => { const all = S.editions || {}, e = ED_NAME && all[ED_NAME]; if (!e) return null; return e.base ? { ...all[e.base], ...e } : e; })();
const ED_LAST = ED && ED.chapters ? ED.chapters - 1 : Infinity;   // teaser: last playable chapter index
const edCh = ch => (ED && ch && ED[ch.id]) || null;
const isCutObj = (ch, qi) => !!(edCh(ch) && (edCh(ch).cut || []).includes(qi + 1));
const isCutScene = (ch, sid) => !!(edCh(ch) && (edCh(ch).scenes || []).includes(sid));
// a door into a cut scene leads on to wherever that scene led (through other cut scenes too)
function doorOptions(ch, from, cutSid) {
  const out = [], seen = new Set([cutSid]), q = [cutSid];
  while (q.length) { const id = q.shift();
    for (const L of Object.values((ch.scenes[id] || {}).legend || {})) { if (!L || !L.door || L.door === from) continue;
      if (isCutScene(ch, L.door)) { if (!seen.has(L.door)) { seen.add(L.door); q.push(L.door); } }
      else if (!out.some(o => o.to === L.door)) out.push({ to: L.door, at: L.at || 'S', label: L.label || (ch.scenes[L.door] || {}).title || '' }); } }
  return out;
}
FONT['>'] = '100010001010100';

// ---------------------------------------------------------------- iso projection
const cam = { x: 0, y: 0 }, camR = { x: 0, y: 0 };
const isoX = (wx, wy) => (wx - wy) * 16, isoY = (wx, wy) => (wx + wy) * 8;
const P2 = (wx, wy, z = 0) => [Math.round(isoX(wx, wy)) - camR.x, Math.round(isoY(wx, wy) - z) - camR.y];
// crisp (non-antialiased) polygon helpers, filled column by column
function faceUp(a, b, h, c) {           // vertical face standing on edge a→b (a left of b)
  ctx.fillStyle = c;
  for (let x = a[0]; x < b[0]; x++) { const y = Math.round(a[1] + (b[1] - a[1]) * (x + 0.5 - a[0]) / (b[0] - a[0])); ctx.fillRect(x, y - h, 1, h); }
}
function faceDown(a, b, h, c) {
  ctx.fillStyle = c;
  for (let x = a[0]; x < b[0]; x++) { const y = Math.round(a[1] + (b[1] - a[1]) * (x + 0.5 - a[0]) / (b[0] - a[0])); ctx.fillRect(x, y, 1, h); }
}
function fillQuad(p, c) {
  ctx.fillStyle = c;
  const xs = p.map(q => q[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
  for (let x = x0; x < x1; x++) {
    const cx = x + 0.5; let lo = 1e9, hi = -1e9;
    for (let i = 0; i < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
      if ((cx >= ax && cx <= bx) || (cx >= bx && cx <= ax)) {
        if (ax === bx) { lo = Math.min(lo, ay, by); hi = Math.max(hi, ay, by); }
        else { const y = ay + (by - ay) * (cx - ax) / (bx - ax); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      }
    }
    if (hi > lo) ctx.fillRect(x, Math.round(lo), 1, Math.round(hi) - Math.round(lo));
  }
}
// box standing on the ground (or lifted by z): footprint x0..x0+w, y0..y0+d, height h
function isoBox(x0, y0, w, d, h, col, z = 0) {
  const A = P2(x0, y0, z), B = P2(x0 + w, y0, z), C = P2(x0 + w, y0 + d, z), D = P2(x0, y0 + d, z);
  faceUp(D, C, h, col.l); faceUp(C, B, h, col.r);
  fillQuad([[A[0], A[1] - h], [B[0], B[1] - h], [C[0], C[1] - h], [D[0], D[1] - h]], col.t);
  if (col.e) rect(C[0], C[1] - h, 1, h, col.e);
  return { A, B, C, D };
}
const onEdge = (a, b, t, hh) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t - hh)];
function line(x0, y0, x1, y1, c) {
  ctx.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
}
function tri(cx, top, h, hw, c) { ctx.fillStyle = c; for (let r = 0; r < h; r++) { const w = Math.round(hw * (r + 1) / h); ctx.fillRect(cx - w, top + r, w * 2 + 1, 1); } }
function shadow(x, y, rw) { ctx.globalAlpha = 0.28; rect(x - rw + 2, y - 2, rw * 2 - 3, 1, '#000'); rect(x - rw, y - 1, rw * 2 + 1, 2, '#000'); rect(x - rw + 2, y + 1, rw * 2 - 3, 1, '#000'); ctx.globalAlpha = 1; }
const shade = (c, k) => css(mix(hex(c), k > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(k)));
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;


// ---------------------------------------------------------------- ground tiles
const tileCache = {};
function groundTile(ch, v) {
  const key = ch + v; if (tileCache[key]) return tileCache[key];
  const G = REG.grounds[ch] || REG.grounds['.'], c = document.createElement('canvas'); c.width = 32; c.height = 16;
  const g = c.getContext('2d'), R = rng(v * 131 + ch.charCodeAt(0)), base = hex(G.c);
  for (let py = 0; py < 16; py++) for (let px = 0; px < 32; px++) {
    const rx = px + 0.5 - 16, ry = py + 0.5, u = (rx / 16 + ry / 8) / 2, w = (ry / 8 - rx / 16) / 2;
    if (u < 0 || u > 1 || w < 0 || w > 1) continue;
    let col = css(mix(base, R() < 0.5 ? [0, 0, 0] : [255, 255, 255], R() * 0.06));
    if (G.checker) col = ((u * 2 | 0) + (w * 2 | 0)) % 2 ? G.checker[0] : G.checker[1];
    if (G.planks && (u * 4) % 1 < 0.1) col = G.planks;
    if (G.grid && (u < 0.04 || w < 0.04)) col = G.grid;
    if (G.stripe && Math.abs(w - 0.5) < 0.04 && (u * 3 | 0) % 2 === 0) col = G.stripe;
    if (G.speck && R() < 0.06) col = G.speck;
    if (G.tuft && R() < 0.05) col = G.tuft;
    if (G.flowers && R() < 0.025) col = G.flowers[R() * G.flowers.length | 0];
    g.fillStyle = col; g.fillRect(px, py, 1, 1);
  }
  return (tileCache[key] = c);
}

// ---------------------------------------------------------------- drawing kit for objects (see ENGINE.md)
const K = {
  P2, isoBox, faceUp, faceDown, fillQuad, onEdge, line, tri, disc, rect, shadow, shade, pixText, rng, hex, mix, css, sprite, draw,
  base: o => P2(o.x + o.w / 2, o.y + o.d / 2),
  flat: (x0, y0, w, d, c, z = 0) => fillQuad([P2(x0, y0, z), P2(x0 + w, y0, z), P2(x0 + w, y0 + d, z), P2(x0, y0 + d, z)], c),
  palm(x, y, h) {
    for (let i = 0; i < h; i++) rect(x + Math.round(Math.sin(i / 5) * 3), y - i * 2 - 2, 3, 2, i % 2 ? '#8b5a2b' : '#a0693a');
    const tx = x + Math.round(Math.sin((h - 1) / 5) * 3) + 1, ty = y - h * 2 - 2;
    for (const a of [-2.7, -2.1, -1.5, -0.9, -0.3, 0.2]) for (let j = 1; j < 11; j++)
      rect(tx + Math.cos(a) * j, ty + Math.sin(a) * j * 0.6 + j * j * 0.07, 2, 2, j > 7 ? '#2e8b3e' : '#3faa4f');
    disc(tx + 1, ty + 2, 2, '#6b4423');
  },
  windows(a, b, n, rows, h0, dh, lit, seed, glass = '#5d7a99') {
    const R = rng(seed);
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const [x, y] = onEdge(a, b, (i + 0.5) / n, h0 + r * dh), on = lit && R() < 0.5; R();
      rect(x - 1, y - 4, 3, 4, on ? '#ffd86b' : glass); if (!on) rect(x - 1, y - 4, 1, 1, '#9ab8d4');
    }
  },
  get tick() { return tick; },
  get night() { return !!(SC && SC.def.light === 'night'); },
  get scene() { return SC ? SC.def : {}; },
};
const objDef = id => REG.objects[id];

// ---------------------------------------------------------------- scenes & chapters
// Default meaning of map characters; a scene's legend overrides/extends it.
const DEFAULT_LEGEND = { T: 'tree', P: 'pine', o: 'bush', r: 'rock', L: 'lamp', B: 'bench', p: 'palm', g: 'garage', s: 'sandbox',
  w: 'swing', c: 'car', t: 'tires', x: 'crate', H: 'house', K: 'panel', U: 'uni', G: 'pit', Y: 'palace', v: 'bicycle', u: 'umbrella' };
let CS = null, SC = null, SNAP = false;          // chapter state, current scene
const P = { x: 0, y: 0, face: 1, look: 'kid', walk: 0, moving: false };
let party = [], trail = [], particles = [], arriveT = 0, nearDoor = null;

function buildScene(ch, sid) {
  const def = ch.scenes[sid]; if (!def) throw new Error(`Нет сцены ${sid} в главе ${ch.id}`);
  const G = def.ground, O = def.objects, Hh = G.length, Ww = G[0].length, legend = { ...DEFAULT_LEGEND, ...(def.legend || {}) };
  const sc = { id: sid, def, Ww, Hh, g: G, solid: new Uint8Array(Ww * Hh), objs: [], mems: [], items: [], npcs: [], spots: [], doors: [], spawns: {}, exit: null, bike: null };
  let mi = 0, ni = 0;
  for (let y = 0; y < Hh; y++) for (let x = 0; x < Ww; x++) {
    const ch0 = O[y][x], gch = G[y][x];
    if (gch === ' ' || (REG.grounds[gch] && REG.grounds[gch].water)) sc.solid[y * Ww + x] = 1;
    if (ch0 === '.') continue;
    let L = legend[ch0]; if (typeof L === 'string') L = { obj: L };
    if (L) {
      if (L.obj) {
        const d = objDef(L.obj) || {}, o = { ...L, id: L.obj, x, y, w: L.w || d.w || 1, d: L.d || d.d || 1, seed: hash(x, y) % 997 };
        sc.objs.push(o);
        const solidObj = d.solid !== 0 && L.solid !== 0 && !L.door && !L.auto;
        if (solidObj && (L.from || L.until)) o.timedSolid = true;
        else if (solidObj) for (let dy = 0; dy < o.d; dy++) for (let dx = 0; dx < o.w; dx++) if (y + dy < Hh && x + dx < Ww) sc.solid[(y + dy) * Ww + x + dx] = 1;
      }
      if (L.door) sc.doors.push({ x: x + 0.5, y: y + 0.5, to: L.door, at: L.at || 'S', label: L.label || (ch.scenes[L.door] || {}).title || '', from: L.from, until: L.until });
      if (L.spawn) sc.spawns[ch0] = [x + 0.5, y + 0.5];
      if (L.spot) { const w = L.w || (objDef(L.obj) || {}).w || 1, d = L.d || (objDef(L.obj) || {}).d || 1;
        sc.spots.push({ id: L.spot, x: x + w / 2, y: y + d / 2, r: Math.max(w, d) / 2, label: L.label, say: L.say, auto: L.auto, who: L.who, from: L.from, until: L.until }); }
      continue;
    }
    if (ch0 === 'S') sc.spawns.S = [x + 0.5, y + 0.5];
    else if (ch0 === 'E') sc.exit = { x: x + 0.5, y: y + 0.5 };
    else if (ch0 === '?') { const data = (def.memories || [])[mi++]; if (data) sc.mems.push({ x: x + 0.5, y: y + 0.5, data, opened: false, from: data.from, until: data.until }); }
    else if (ch0 === '*') sc.items.push({ x: x + 0.5, y: y + 0.5, taken: false, n: sc.items.length, kind: (def.item || {}).kind || 'card', from: (def.item || {}).from, until: (def.item || {}).until });
    else if (ch0 >= '1' && ch0 <= '9') { const n = (def.npcs || [])[+ch0 - 1]; if (n) sc.npcs.push({ ...n, x: x + 0.5, y: y + 0.5, joined: false }); ni++; }
    else if (ch0 === 'm') { sc.bike = { x: x + 0.5, y: y + 0.5 }; sc.solid[y * Ww + x] = 1; }
  }
  for (const d of sc.doors) if (isCutScene(ch, d.to)) { d.opts = doorOptions(ch, sid, d.to); if (!d.opts.length) d.from = Infinity; }
  return sc;
}
// where a door actually leads (cut scenes are skipped: prefer the option where the current objective is)
function doorDest(d) {
  if (!d.opts) return d;
  const o = curObj(), t = o && targetScene(o);
  return d.opts.find(x => x.to === t) || d.opts[0];
}
const getScene = sid => CS.scenes[sid] || (CS.scenes[sid] = buildScene(CS.ch, sid));
const objectives = () => CS.ch.objectives || [];
// visibility by story progress: from = appears when objective N becomes current, until = gone after objective N is done
// short edition: «until N» where objective N is cut lasts until the next objective that is played (taxis, gates…)
const effUntil = n => { if (!ED) return n; while (n <= objectives().length && isCutObj(CS.ch, n - 1)) n++; return n; };
const vis = e => SNAP || ((!e.from || CS.qi >= e.from - 1) && (!e.until || CS.qi < effUntil(e.until)));
const partyShown = c => { const h = SC && SC.def.hideParty; return !(h === true || (Array.isArray(h) && h.includes(c.id))); };
const curObj = () => objectives()[CS.qi];
const outfit = who => { const o = (SC && SC.def.outfits && SC.def.outfits[who]) || CS.outfits[who], id = o && `${who}_${o}`; return id && CHARS[id] ? id : who; };

// ---------------------------------------------------------------- UI helpers
let state = 'title', tick = 0, fade = 0, fadeDir = 0, fadeCb = null, dlg = null, bannerT = null, toastT = null;
function transition(cb) { if (!fadeDir) { fadeDir = 1; fadeCb = cb; } }
function banner(y, t, i) {
  const b = $('banner'); b.querySelector('.y').textContent = y; b.querySelector('.t').textContent = t || ''; b.querySelector('.i').textContent = i || '';
  b.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), 3200);
}
function toast(s, ms = 2600) { const t = $('toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), Math.max(ms, String(s).length * 60)); }
// where is the target of an objective (scene id), to hint the player
function targetScene(o) {
  const sc = CS.ch.scenes;
  if (o.where) return o.where;
  if (o.at) return o.at;
  if (o.visit) return o.visit;
  for (const [sid, d] of Object.entries(sc)) {
    if (o.talk && (d.npcs || []).some((n, i) => n.who === o.talk && (!n.from || CS.qi >= n.from - 1) && (!n.until || CS.qi < effUntil(n.until)) && d.objects.some(r => r.includes(String(i + 1))))) return sid;
    if (o.use && Object.entries(d.legend || {}).some(([c, L]) => L && L.spot === o.use && d.objects.some(r => r.includes(c)))) return sid;
  }
  if (o.collect) for (const [sid, d] of Object.entries(sc)) if (d.item && (!o.kind || d.item.kind === o.kind) && d.objects.some(r => r.includes('*'))) {
    const s = CS.scenes[sid]; if (!s || s.items.some(it => !it.taken)) return sid; }
  return null;
}
const gotCount = o => o.kind ? (CS.got[o.kind] || 0) : Object.values(CS.got).reduce((a, b) => a + b, 0);
function questHud() {
  const o = curObj(), q = $('quest');
  let s;
  if (CS.ch.final && !o) s = 'Подойди к байку';
  else if (o) { s = o.text + (o.collect ? ` · ${Math.min(gotCount(o), o.collect)}/${o.collect}` : '');
    const t = targetScene(o); if (t && t !== SC.id && CS.ch.scenes[t]) s += ` · где: ${CS.ch.scenes[t].title || t}`; }
  else s = 'Выход открыт — иди к стрелке';
  $('questText').textContent = s; q.classList.toggle('done', !o);
  $('hudC').textContent = `${CS.ch.years} · ${SC.def.title || CS.ch.title}`;
  $('party').textContent = party.length ? 'С тобой: ' + party.map(c => charName(c.id)).join(', ') : '';
}
function pages(lines, who) {   // a line is a string or { who: 'dasha', text: '…', photo }
  return (Array.isArray(lines) ? lines : [lines]).map(t => typeof t === 'object' && t ? { text: t.text, who: t.who ? charName(t.who) : (t.name || who), photo: t.photo } : { text: t, who });
}
function openDialog(pg, onDone) { dlg = { pages: pg, i: 0, n: 0, onDone }; $('dialog').hidden = false; showPage(); }
function showPage() {
  const p = dlg.pages[dlg.i]; dlg.n = 0;
  const img = $('dlgImg'); if (p.photo) { img.src = p.photo; img.hidden = false; } else img.hidden = true;
  const w = $('dlgWho'); w.hidden = !p.who; w.textContent = p.who || '';
  $('dlgText').textContent = ''; $('dlgMore').style.visibility = 'hidden';
}
function updDialog() {
  const p = dlg.pages[dlg.i], full = p.text || '';
  if (dlg.n < full.length) { dlg.n = Math.min(full.length, dlg.n + 1.2); $('dlgText').textContent = full.slice(0, dlg.n | 0);
    if ((dlg.n | 0) % 3 === 0) tone(600 + Math.random() * 80, 0, 0.02, 'square', 0.015); }
  else $('dlgMore').style.visibility = 'visible';
  if (pressed.act) {
    if (dlg.n < full.length) { dlg.n = full.length; $('dlgText').textContent = full; }
    else if (++dlg.i < dlg.pages.length) showPage();
    else { const cb = dlg.onDone; dlg = null; $('dialog').hidden = true; cb && cb(); }
  }
}
function poof(wx, wy, colors = ['#ffd23f', '#fff', '#e8412c']) {
  for (let i = 0; i < 18; i++) particles.push({ x: isoX(wx, wy), y: isoY(wx, wy) - 10, vx: (Math.random() - .5) * 2.4, vy: -Math.random() * 2.2, life: 32, c: colors[i % colors.length] });
}

// ---------------------------------------------------------------- quests & interaction
function completeObjective() {
  const o = curObj(); CS.qi++; SFX.done(); let nq = CS.qi; while (nq < objectives().length && isCutObj(CS.ch, nq)) nq++; const next = objectives()[nq];
  if (o.outfit) { Object.assign(CS.outfits, o.outfit); for (const c of party) if (o.outfit[c.id]) poof(c.x, c.y, ['#fff', '#ffd23f', '#e86a8a']); }
  if (o.look) { P.look = o.look; CS.look = o.look; poof(P.x, P.y, ['#fff', '#ffd23f']); }
  if (o.leave) party = party.filter(c => !o.leave.includes(c.id));
  toast(o.done || (next ? 'Готово! Дальше: ' + next.text : (CS.ch.done || 'Готово!')), 3200);
  saveProgress(); checkObjectives(); questHud();
}
function checkObjectives() {
  if (curObj() && isCutObj(CS.ch, CS.qi)) { let n = CS.qi; while (n < objectives().length && isCutObj(CS.ch, n)) n++; skipObjectives(n); }
  const o = curObj();
  if (o && o.collect && gotCount(o) >= o.collect) return completeObjective();
  if (o && o.visit && SC.id === o.visit) return completeObjective();
  if (!o && !CS.unlocked) { CS.unlocked = true; if (SC.exit) poof(SC.exit.x, SC.exit.y); }
}
function join(n) { n.joined = true; if (party.some(c => c.id === n.who)) return; party.push({ id: n.who, x: n.x, y: n.y, face: 1, moving: false }); SFX.join(); poof(n.x, n.y); toast(`${charName(n.who)} теперь с тобой!`); }
function talkTo(n) {
  const o = curObj(), who = charName(n.who);
  if (o && o.talk === n.who && (!o.at || o.at === SC.id)) openDialog(pages(o.say || n.lines || '…', who), () => { if (o.join) join(n); completeObjective(); });
  else openDialog(pages(n.lines || '…', who));
}
function useSpot(s) {
  const o = curObj();
  if (o && o.use === s.id) openDialog(pages(o.say || s.say || '…', o.who ? charName(o.who) : s.label), () => completeObjective());
  else if (s.say) openDialog(pages(s.say, s.who ? charName(s.who) : s.label));
}
function openMemory(m) {
  const t = m.data.text, list = Array.isArray(t) ? t : [t];
  if (!m.opened) { m.opened = true; SFX.open(); poof(m.x, m.y); }
  openDialog(list.map((s, i) => ({ text: s, photo: i === 0 ? m.data.photo : null, who: 'Воспоминание' })));
}
function interactables() {
  const out = [];
  for (const n of SC.npcs) if (!n.joined && vis(n)) out.push({ x: n.x, y: n.y, r: 0, kind: 'npc', ref: n });
  const o = curObj();   // a follower can be the target of a talk objective too
  if (o && o.talk && (!o.at || o.at === SC.id)) for (const c of party) if (c.id === o.talk && partyShown(c)) out.push({ x: c.x, y: c.y, r: 0, kind: 'npc', ref: { who: c.id, x: c.x, y: c.y, joined: true, lines: [] } });
  for (const m of SC.mems) if (vis(m)) out.push({ x: m.x, y: m.y, r: 0, kind: 'mem', ref: m });
  for (const s of SC.spots) if (!s.auto && vis(s) && (s.say || (o && o.use === s.id))) out.push({ x: s.x, y: s.y, r: s.r, kind: 'spot', ref: s });
  if (SC.bike && !CS.bikeDone && CS.unlocked) out.push({ x: SC.bike.x, y: SC.bike.y, r: 0, kind: 'bike' });
  return out;
}
function nearest() {
  let best = null, bd = 1e9;
  for (const it of interactables()) { const d = Math.hypot(it.x - P.x, it.y - P.y) - it.r; if (d < 1.15 && d < bd) { bd = d; best = it; } }
  return best;
}
function interact(it) {
  if (it.kind === 'npc') talkTo(it.ref);
  else if (it.kind === 'mem') openMemory(it.ref);
  else if (it.kind === 'spot') useSpot(it.ref);
  else if (it.kind === 'bike') { CS.bikeDone = true; openDialog(pages(CS.ch.bike || ['Поехали!'], 'Механик'), () => transition(startRace)); }
}

// ---------------------------------------------------------------- play update
function blockedAt(wx, wy) {
  const r = 0.2;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    const tx = Math.floor(wx + ox), ty = Math.floor(wy + oy);
    if (tx < 0 || ty < 0 || tx >= SC.Ww || ty >= SC.Hh || SC.solid[ty * SC.Ww + tx]) return true;
  }
  for (const n of SC.npcs) if (!n.joined && vis(n) && Math.hypot(n.x - wx, n.y - wy) < 0.42) return true;
  for (const ob of SC.objs) if (ob.timedSolid && vis(ob) && wx >= ob.x - 0.2 && wx <= ob.x + ob.w + 0.2 && wy >= ob.y - 0.2 && wy <= ob.y + ob.d + 0.2) return true;
  return false;
}
function updPlay() {
  if (dlg) return updDialog();
  let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + stick.x, my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0) + stick.y;
  const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
  P.moving = len > 0.15;
  if (P.moving) {
    const sx = mx * 1.35, sy = my * 1.0, dwx = (sx / 16 + sy / 8) / 2, dwy = (sy / 8 - sx / 16) / 2;
    if (!blockedAt(P.x + dwx, P.y)) P.x += dwx;
    if (!blockedAt(P.x, P.y + dwy)) P.y += dwy;
    if (Math.abs(mx) > 0.15) P.face = mx > 0 ? 1 : -1;
    P.walk++;
  }
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(last.x - P.x, last.y - P.y) > 0.05) { trail.push({ x: P.x, y: P.y }); if (trail.length > 300) trail.shift(); }
  party.forEach((c, k) => {
    const t = trail[Math.max(0, trail.length - 1 - (k + 1) * 12)] || P;
    const dx = t.x - c.x, dy = t.y - c.y, d = Math.hypot(dx, dy);
    c.moving = d > 0.03;
    if (c.moving) { const sp = Math.min(d, d > 3 ? d : 0.09); c.x += dx / d * sp; c.y += dy / d * sp; const fx = isoX(dx, dy); if (Math.abs(fx) > 0.01) c.face = fx > 0 ? 1 : -1; }
  });

  for (const it of SC.items) if (!it.taken && vis(it) && Math.hypot(it.x - P.x, it.y - P.y) < 0.5) {
    it.taken = true; CS.got[it.kind] = (CS.got[it.kind] || 0) + 1; SFX.coin(); poof(it.x, it.y); checkObjectives(); questHud();
  }
  for (const s of SC.spots) if (s.auto && vis(s) && Math.hypot(s.x - P.x, s.y - P.y) < s.r + 0.35) { const o = curObj(); if (o && o.use === s.id) useSpot(s); }
  if (arriveT > 0) arriveT--;
  nearDoor = null;
  for (const d of SC.doors) { if (!vis(d)) continue; const dist = Math.hypot(d.x - P.x, d.y - P.y);
    if (dist < 1.4) nearDoor = d;
    if (dist < 0.45 && arriveT <= 0) { arriveT = 999; const dd = doorDest(d); transition(() => enterScene(dd.to, dd.at)); } }
  if (nearDoor !== doorToastFor) { doorToastFor = nearDoor; const dl = nearDoor && doorDest(nearDoor).label; if (dl) toast(dl, 1600); }
  if (SC.exit && Math.hypot(SC.exit.x - P.x, SC.exit.y - P.y) < 0.5) {
    if (CS.unlocked) transition(() => CS.i >= ED_LAST ? showToBeContinued() : loadChapter(CS.i + 1));
    else if (tick - (CS.exitWarn || 0) > 120) { CS.exitWarn = tick; SFX.deny(); toast('Сначала выполни задания главы'); }
  }
  if (pressed.act) { const it = nearest(); if (it) interact(it); }

  const tx = isoX(P.x, P.y) - W / 2, ty = isoY(P.x, P.y) - H / 2 - 8;
  cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.12;
}

// ---------------------------------------------------------------- world render
const lc = document.createElement('canvas'); lc.width = W; lc.height = H; const lx = lc.getContext('2d');
const vig = document.createElement('canvas'); vig.width = W; vig.height = H;
{ const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
const SKY = { day: '#1d2a3a', evening: '#2a1d33', night: '#0a0c1e', sunset: '#3b1e3a', indoor: '#141019' };

function drawGround() {
  const { Ww, Hh, g } = SC;
  for (let y = 0; y < Hh; y++) for (let x = 0; x < Ww; x++) {
    const ch = g[y][x]; if (ch === ' ') continue;
    const [sx, sy] = P2(x, y); if (sx < -40 || sx > W + 40 || sy < -20 || sy > H + 10) continue;
    ctx.drawImage(groundTile(ch, hash(x, y) % 4), sx - 16, sy);
    if (REG.grounds[ch] && REG.grounds[ch].water && (hash(x, y) + (tick >> 4)) % 5 === 0) rect(sx - 4 + (tick >> 3) % 8, sy + 6, 4, 1, '#bfe6ff');
  }
  const empty = (x, y) => x < 0 || y < 0 || x >= Ww || y >= Hh || g[y][x] === ' ';
  for (let y = 0; y < Hh; y++) for (let x = 0; x < Ww; x++) {
    const ch = g[y][x]; if (ch === ' ') continue; const G = REG.grounds[ch] || REG.grounds['.'];
    if (empty(x, y + 1)) faceDown(P2(x, y + 1), P2(x + 1, y + 1), 12, G.side[0]);
    if (empty(x + 1, y)) faceDown(P2(x + 1, y + 1), P2(x + 1, y), 12, G.side[1]);
  }
}
function drawExit() {
  const e = SC.exit; if (!e) return;
  const pts = [P2(e.x - 0.5, e.y - 0.5), P2(e.x + 0.5, e.y - 0.5), P2(e.x + 0.5, e.y + 0.5), P2(e.x - 0.5, e.y + 0.5)];
  const col = CS.unlocked ? ((tick >> 3) % 2 ? '#ffd23f' : '#fff3a0') : '#8a8a8a';
  for (let i = 0; i < 4; i++) line(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], col);
  const [x, y] = P2(e.x, e.y), next = CHAPTERS[CS.i + 1];
  if (next) { const yr = (next.years.match(/\d{4}/) || [''])[0]; rect(x - 9, y - 30, 19, 9, '#3a2412'); rect(x - 8, y - 29, 17, 7, '#7a5230'); pixText(yr, x - 7, y - 28, '#fff'); rect(x, y - 21, 1, 21, '#5a3a1f'); }
  if (CS.unlocked) { const b = Math.round(Math.sin(tick / 8) * 2); tri(x, y - 44 + b, 5, 4, '#ffd23f'); rect(x - 1, y - 49 + b, 3, 5, '#ffd23f'); }
  else { rect(x - 3, y - 40, 7, 6, '#555'); rect(x - 2, y - 43, 5, 3, '#555'); rect(x - 1, y - 42, 3, 2, '#222'); }
}
function drawDoors() {
  for (const d of SC.doors) { if (!vis(d)) continue;
    const pts = [P2(d.x - 0.4, d.y - 0.4), P2(d.x + 0.4, d.y - 0.4), P2(d.x + 0.4, d.y + 0.4), P2(d.x - 0.4, d.y + 0.4)];
    const col = (tick >> 4) % 2 ? '#ffffff' : '#bfe6ff';
    for (let i = 0; i < 4; i++) line(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], col);
  }
}
function drawItem(kind, x, y, n) {
  switch (kind) {
    case 'helmet': disc(x, y - 9, 4, S.hero.helmet); rect(x - 1, y - 10, 5, 2, '#1a1a1a'); rect(x - 4, y - 6, 9, 1, shade(S.hero.helmet, -0.3)); break;
    case 'ball': disc(x, y - 8, 3, '#e8412c'); rect(x - 1, y - 10, 2, 1, '#fff'); break;
    case 'grocery':
      if (n % 3 === 0) { disc(x, y - 8, 3, '#fbf3e4'); rect(x - 1, y - 10, 1, 1, '#fff'); }
      else if (n % 3 === 1) { rect(x - 3, y - 12, 7, 8, '#e9dcc0'); rect(x - 3, y - 12, 7, 2, '#c9a96e'); rect(x - 1, y - 9, 3, 2, '#3a7ae8'); }
      else { rect(x - 2, y - 13, 5, 9, '#ffffff'); rect(x - 2, y - 13, 5, 2, '#3a7ae8'); rect(x - 1, y - 15, 3, 2, '#ddd'); }
      break;
    case 'news': rect(x - 4, y - 12, 9, 7, '#f2efe6'); rect(x - 3, y - 11, 4, 2, '#e8412c'); rect(x - 3, y - 8, 7, 1, '#888'); rect(x - 3, y - 6, 7, 1, '#888'); break;
    case 'ticket': rect(x - 4, y - 11, 9, 5, '#ffd23f'); rect(x + 1, y - 11, 1, 5, '#b8860b'); rect(x - 3, y - 10, 3, 1, '#1a1020'); break;
    case 'tequila': rect(x - 1, y - 15, 3, 3, '#c8a050'); rect(x - 2, y - 12, 5, 8, '#e8c060'); rect(x - 2, y - 10, 5, 3, '#f4f0e0'); rect(x - 1, y - 16, 3, 1, '#333'); break;
    case 'ring': disc(x, y - 9, 3, '#ffd23f'); disc(x, y - 9, 1, '#000'); rect(x, y - 13, 1, 1, '#bfe6ff'); break;
    case 'bag': rect(x - 4, y - 11, 9, 7, '#c0392b'); rect(x - 1, y - 13, 3, 2, '#5a2a20'); rect(x - 4, y - 8, 9, 1, '#e8c060'); break;
    case 'keys': rect(x - 3, y - 11, 4, 4, '#cfd3da'); rect(x - 2, y - 10, 2, 2, '#4a4a54'); rect(x + 1, y - 9, 4, 1, '#cfd3da'); rect(x + 3, y - 9, 1, 2, '#cfd3da'); rect(x - 4, y - 7, 3, 2, '#1a1a1a'); break;
    case 'lego': { const c = ['#e8412c', '#ffd23f', '#2e86de', '#27ae60'][n % 4]; rect(x - 4, y - 10, 8, 5, c); rect(x - 3, y - 12, 2, 2, c); rect(x + 1, y - 12, 2, 2, c); rect(x - 4, y - 6, 8, 1, shade(c, -0.3)); break; }
    case 'box': rect(x - 4, y - 11, 9, 7, '#d9b07a'); rect(x - 4, y - 11, 9, 2, '#c49a66'); rect(x, y - 11, 1, 7, '#a88050'); break;
    case 'tool': rect(x - 4, y - 8, 8, 2, '#8a8f99'); rect(x + 3, y - 11, 2, 7, '#c0392b'); break;
    case 'cup': rect(x - 2, y - 11, 5, 6, '#fff'); rect(x - 2, y - 11, 5, 1, '#6b4423'); rect(x + 3, y - 10, 1, 3, '#fff'); break;
    default: rect(x - 3, y - 13, 7, 9, '#fff'); rect(x - 2, y - 12, 5, 3, '#e8412c'); rect(x - 2, y - 8, 5, 3, '#1e50ff');
  }
}
function charDraw(spr, wx, wy, flip) { const [x, y] = P2(wx, wy); draw(spr, x - (spr.width >> 1), y - spr.height + 1, flip); }
function bubble(wx, wy, h, ch, col = '#ffd23f') {
  const [x, y] = P2(wx, wy), by = y - h - 12 + Math.round(Math.sin(tick / 8) * 1.5);
  rect(x - 4, by, 9, 9, '#000'); rect(x - 3, by + 1, 7, 7, col); pixText(ch, x - 1, by + 2, '#000');
}
// NPC name labels: crisp HTML overlay (#labels) above the canvas; DOM nodes pooled between frames
let labelQ = [];
const labelEls = [];
function syncLabels() {
  const box = $('labels'); if (!box) return;
  labelQ.forEach((q, i) => {
    let el = labelEls[i];
    if (!el) { el = labelEls[i] = document.createElement('div'); el.className = 'lbl'; el._t = el._l = el._y = null; box.appendChild(el); }
    const key = (q.pre || '') + '|' + (q.col || '') + '|' + q.text;
    if (el._t !== key) { el._t = key; el.textContent = '';
      if (q.pre) { const s = document.createElement('span'); s.textContent = q.pre + ' '; if (q.col) s.style.color = q.col; el.appendChild(s); }
      el.appendChild(document.createTextNode(q.text)); }
    if (el._l !== q.x) { el.style.left = (q.x / W * 100) + '%'; el._l = q.x; }
    if (el._y !== q.y) { el.style.top = (q.y / H * 100) + '%'; el._y = q.y; }
    if (el.hidden) el.hidden = false;
  });
  for (let i = labelQ.length; i < labelEls.length; i++) if (!labelEls[i].hidden) labelEls[i].hidden = true;
}
function renderWorld() {
  camR.x = Math.round(cam.x); camR.y = Math.round(cam.y);
  const tags = [];
  rect(0, 0, W, H, SKY[SC.def.light] || SKY.day);
  drawGround(); drawDoors(); drawExit();
  const o = curObj();
  const list = [];
  for (const ob of SC.objs) { const d = objDef(ob.id); if (!d || !vis(ob)) continue;
    const it = { px: ob.x + ob.w / 2, py: ob.y + ob.d / 2, flat: d.solid === 0 && !ob.tall, draw: () => { try { d.draw(ob, K); } catch (e) { if (!ob.bad) { ob.bad = 1; console.error(`Объект ${ob.id} (${SC.id} ${ob.x},${ob.y}) не рисуется:`, e); } } } };
    if (ob.w > 1 || ob.d > 1) it.box = { x0: ob.x, y0: ob.y, x1: ob.x + ob.w, y1: ob.y + ob.d };
    list.push(it); }
  // memory cube: «?» floats upright above the cube (drawn on the iso faces it looked bent)
  const Q = ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'];
  const qMark = (cx, top, c, o) => { const x0 = Math.round(cx) - 2;
    ctx.fillStyle = o; Q.forEach((r, j) => [...r].forEach((p, i) => { if (p === '#') ctx.fillRect(x0 + i - 1, top + j - 1, 3, 3); }));
    ctx.fillStyle = c; Q.forEach((r, j) => [...r].forEach((p, i) => { if (p === '#') ctx.fillRect(x0 + i, top + j, 1, 1); })); };
  for (const m of SC.mems) if (vis(m)) list.push({ px: m.x, py: m.y, draw: () => {
    const z = 10 + (m.opened ? 0 : Math.round(Math.sin(tick / 12) * 2)), [x, y] = P2(m.x, m.y);
    shadow(x, y, 4);
    isoBox(m.x - 0.22, m.y - 0.22, 0.44, 0.44, 9, m.opened ? { t: '#b8b2a5', l: '#9a958a', r: '#7d786e' } : { t: '#ffe08a', l: '#f5a623', r: '#c97f10' }, z);
    qMark(x, y - z - 21, m.opened ? '#d8d2c4' : '#fff', m.opened ? '#5a564e' : '#7a4a00');
    if (!m.opened && tick % 20 === 0) particles.push({ x: isoX(m.x, m.y) + (Math.random() - .5) * 10, y: isoY(m.x, m.y) - 20, vx: 0, vy: -0.4, life: 30, c: '#fff3a0' }); } });
  for (const it of SC.items) if (!it.taken && vis(it)) list.push({ px: it.x, py: it.y, draw: () => {
    const [x, y] = P2(it.x, it.y), b = Math.round(Math.sin(tick / 10 + it.x) * 2); shadow(x, y, 3);
    drawItem(it.kind, x, y + b, it.n);
    if ((tick + it.x * 10 | 0) % 30 < 4) rect(x + 3, y - 15 + b, 1, 1, '#fff'); } });
  for (const n of SC.npcs) if (!n.joined && vis(n)) list.push({ px: n.x, py: n.y, draw: () => {
    const spr = charSprite(outfit(n.who), 'stand'), [x, y] = P2(n.x, n.y); shadow(x, y, 5);
    charDraw(spr, n.x, n.y, isoX(P.x - n.x, P.y - n.y) < 0);
    const q = o && o.talk === n.who && (!o.at || o.at === SC.id); if (q) bubble(n.x, n.y, spr.height, '!');
    tags.push({ n, x, y, h: spr.height, q }); } });
  for (const s of SC.spots) if (o && o.use === s.id && vis(s)) list.push({ px: s.x + 0.01, py: s.y + 0.01, draw: () => bubble(s.x, s.y, 22, '!') });
  if (SC.bike) list.push({ px: SC.bike.x, py: SC.bike.y, draw: () => { const [x, y] = P2(SC.bike.x, SC.bike.y); shadow(x, y, 14);
    drawBike(bikeSprite(S.hero.bike, S.hero.helmet, '#000', false), x - 15, y + 2, 0, S.hero.number);
    if (!CS.bikeDone && CS.unlocked) bubble(SC.bike.x, SC.bike.y, 16, '!'); } });
  const frameOf = (moving, walk) => moving ? ((walk >> 3) % 2 ? 'walk1' : 'walk2') : 'stand';
  for (const c of party) if (partyShown(c)) list.push({ px: c.x, py: c.y, draw: () => { const spr = charSprite(outfit(c.id), frameOf(c.moving, tick)); const [x, y] = P2(c.x, c.y); shadow(x, y, 5); charDraw(spr, c.x, c.y, c.face < 0); if (o && o.talk === c.id) bubble(c.x, c.y, spr.height, '!'); } });
  list.push({ px: P.x, py: P.y, draw: () => { const spr = heroSprite(P.look, frameOf(P.moving, P.walk)); const [x, y] = P2(P.x, P.y); shadow(x, y, 5); charDraw(spr, P.x, P.y, P.face < 0); } });

  // flat things (rugs, mats) first, then depth-sorted
  for (const it of list) if (it.flat) it.draw();
  const inFront = (p, b) => p.px >= b.x1 || p.py >= b.y1;
  const rest = list.filter(it => !it.flat);
  rest.sort((a, b) => {
    if (a.box && !b.box) return inFront(b, a.box) ? -1 : 1;
    if (b.box && !a.box) return inFront(a, b.box) ? 1 : -1;
    return (a.px + a.py) - (b.px + b.py);
  });
  for (const it of rest) it.draw();

  let near = null;
  if (state === 'play' && !dlg && !SNAP) {
    const it = nearest();
    if (it && it.kind === 'npc') near = it.ref;
    if (it) { const h = it.kind === 'npc' ? charSprite(outfit(it.ref.who), 'stand').height + (o && o.talk === it.ref.who ? 12 : 0) : it.kind === 'bike' ? 28 : it.kind === 'spot' ? 34 : 22; bubble(it.x, it.y, h, 'E', '#fff'); }
    if (nearDoor) { const [x, y] = P2(nearDoor.x, nearDoor.y); rect(x - 4, y - 18, 9, 9, '#000'); rect(x - 3, y - 17, 7, 7, '#bfe6ff'); pixText('>', x - 1, y - 16, '#000'); }
  }
  if (SNAP) { applyTint(); return; }
  if (state === 'play') for (const t of tags) {   // name sits above the sprite and above any «!»/«E» bubbles
    const stack = (t.q ? 12 : 0) + (near === t.n ? 12 : 0), by = t.y - t.h - (stack ? stack + 3 : 1);
    if (t.x < -40 || t.x > W + 40 || by < 0 || by > H + 20) continue;
    labelQ.push({ text: charName(t.n.who), x: t.x, y: by });
  }
  particles = particles.filter(p => p.life-- > 0);
  for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.06; rect(p.x - camR.x, p.y - camR.y, 2, 2, p.c); }
  applyLight();
  ctx.drawImage(vig, 0, 0);
}
function applyTint() {   // uniform lighting for gallery snapshots (no camera-dependent effects)
  const m = SC.def.light, t = { night: ['#0a0c2c', 0.45], evening: ['#40206a', 0.18], sunset: ['#ff7a3c', 0.13], indoor: ['#ffcf8a', 0.06] }[m];
  if (t) { ctx.globalAlpha = t[1]; rect(0, 0, W, H, t[0]); ctx.globalAlpha = 1; }
}
// gallery: render a whole scene into one big canvas by stitching 320×180 frames
function snapshot(chIdx, sid) {
  const save = { CS, SC, state, party, P: { ...P }, cam: { ...cam } };
  try {
    const ch = CHAPTERS[chIdx];
    CS = { ch, i: chIdx, scenes: {}, qi: 0, got: {}, unlocked: true, outfits: { ...(ch.outfits || {}) }, look: ch.look || 'now', bikeDone: true };
    SC = getScene(sid); party = []; state = 'play'; SNAP = true;
    const sp = SC.spawns.S || Object.values(SC.spawns)[0] || [SC.Ww / 2, SC.Hh / 2]; [P.x, P.y] = sp; P.look = SC.def.look || CS.look; P.moving = false;
    const minX = Math.floor(isoX(0, SC.Hh)) - 24, maxX = Math.ceil(isoX(SC.Ww, 0)) + 24, minY = -110, maxY = Math.ceil(isoY(SC.Ww, SC.Hh)) + 24;
    const out = document.createElement('canvas'); out.width = maxX - minX; out.height = maxY - minY;
    const og = out.getContext('2d'); og.imageSmoothingEnabled = false;
    for (let y = minY; y < maxY; y += H) for (let x = minX; x < maxX; x += W) { cam.x = x; cam.y = y; renderWorld(); og.drawImage(cv, x - minX, y - minY); }
    return out;
  } finally { SNAP = false; CS = save.CS; SC = save.SC; state = save.state; party = save.party; Object.assign(P, save.P); Object.assign(cam, save.cam); }
}
function applyLight() {
  const mode = SC.def.light;
  if (mode === 'night' || mode === 'evening') {
    lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, W, H);
    lx.fillStyle = mode === 'night' ? 'rgba(10,12,44,0.66)' : 'rgba(40,20,60,0.25)'; lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const g = lx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = g; lx.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const ob of SC.objs) if ((objDef(ob.id) || {}).light) { const [x, y] = K.base(ob); hole(x, y - 14, 44); }
    const [px, py] = P2(P.x, P.y); hole(px, py - 10, 30);
    for (const m of SC.mems) if (!m.opened) { const [x, y] = P2(m.x, m.y); hole(x, y - 16, 22); }
    if (SC.exit && CS.unlocked) { const [x, y] = P2(SC.exit.x, SC.exit.y); hole(x, y - 20, 26); }
    ctx.drawImage(lc, 0, 0);
    if (mode === 'night') { ctx.globalAlpha = 0.12; for (const ob of SC.objs) if ((objDef(ob.id) || {}).light) { const [x, y] = K.base(ob); disc(x, y - 18, 12, '#ffe9a0'); } ctx.globalAlpha = 1; }
  }
  if (mode === 'evening') { ctx.globalAlpha = 0.1; rect(0, 0, W, H, '#ff9a50'); ctx.globalAlpha = 1; }
  if (mode === 'sunset') { ctx.globalAlpha = 0.13; rect(0, 0, W, H, '#ff7a3c'); ctx.globalAlpha = 1; }
  if (mode === 'indoor') { ctx.globalAlpha = 0.06; rect(0, 0, W, H, '#ffcf8a'); ctx.globalAlpha = 1; }
  if (SC.def.snow) { const R = rng(7); for (let i = 0; i < 40; i++) { const x = (R() * W + tick * 0.2 * (1 + R())) % W, y = (R() * H + tick * (0.4 + R() * 0.4)) % H; rect(x, y, 1, 1, '#fff'); } }
}

// ---------------------------------------------------------------- chapter flow
let doorToastFor = null;
function enterScene(sid, at = 'S') {
  SC = getScene(sid);
  const sp = SC.spawns[at] || SC.spawns.S || Object.values(SC.spawns)[0] || [1.5, 1.5];
  [P.x, P.y] = sp; P.moving = false; P.look = SC.def.look || CS.look;
  trail = []; party.forEach((c, k) => { c.x = P.x - 0.3 * (k + 1); c.y = P.y - 0.3 * (k + 1); });
  cam.x = isoX(P.x, P.y) - W / 2; cam.y = isoY(P.x, P.y) - H / 2 - 8; arriveT = 40;
  if (SC.def.title && CS.started) toast(SC.def.title, 1800);
  CS.started = true;
  checkObjectives(); questHud();
}
function initChapter(i) {
  const ch = CHAPTERS[i];
  CS = { ch, i, scenes: {}, qi: 0, got: {}, unlocked: !(ch.objectives || []).length, outfits: { ...(ch.outfits || {}) }, look: ch.look || 'now', bikeDone: false };
  party = party.filter(c => !(ch.away || []).includes(c.id));
  saveProgress();
}
function loadChapter(i, sceneId) {
  if (i >= CHAPTERS.length) return;
  initChapter(i); const ch = CS.ch;
  enterScene(sceneId || ch.start || Object.keys(ch.scenes)[0], 'S');
  banner(ch.years, ch.title, ch.intro); questHud();
}
// silently apply objectives CS.qi..n-1 (joins, leaves, outfits, looks, collected items) — for jumps and ?done
function skipObjectives(n = objectives().length) {
  for (; CS.qi < Math.min(n, objectives().length); CS.qi++) {
    const o = objectives()[CS.qi];
    if (o.join) for (const sid of Object.keys(CS.ch.scenes)) { const s = getScene(sid), nn = s.npcs.find(x => x.who === o.talk && !x.joined);
      if (nn) { nn.joined = true; if (!party.some(c => c.id === nn.who)) party.push({ id: nn.who, x: P.x, y: P.y, face: 1, moving: false }); break; } }
    if (o.collect) { let left = o.collect;
      for (const sid of Object.keys(CS.ch.scenes)) for (const it of getScene(sid).items)
        if (left > 0 && !it.taken && (!o.kind || it.kind === o.kind) && (!it.from || CS.qi >= it.from - 1)) { it.taken = true; left--; }
      const k = o.kind || 'card'; CS.got[k] = (CS.got[k] || 0) + o.collect; }
    if (o.outfit) Object.assign(CS.outfits, o.outfit);
    if (o.look) { CS.look = o.look; P.look = o.look; }
    if (o.leave) party = party.filter(c => !o.leave.includes(c.id));
  }
  if (CS.qi >= objectives().length) CS.unlocked = true;
  saveProgress(); questHud();
}
// first objective that happens in scene sid (so jumping there gives the right quest)
function firstObjectiveIn(sid, viaDoor) {
  const keep = CS.qi, os = objectives(), d = CS.ch.scenes[sid] || {};
  const hasItem = o => o.collect && d.item && (!o.kind || d.item.kind === o.kind) && (d.objects || []).some(r => r.includes('*'));
  let found = -1;
  for (let q = 0; q < os.length && found < 0; q++) { CS.qi = q; if (targetScene(os[q]) === sid || hasItem(os[q])) found = q; }
  CS.qi = keep;
  if (found >= 0) return found;
  // nothing happens here: take the moment of a scene that has a door into this one
  for (const [id, s] of Object.entries(CS.ch.scenes)) if (id !== sid && Object.values(s.legend || {}).some(L => L && L.door === sid)) {
    const q = viaDoor ? -1 : firstObjectiveIn(id, true); if (q > 0) return q; }
  const froms = [...(d.npcs || []), ...(d.memories || []), ...Object.values(d.legend || {})].map(e => e && e.from).filter(Boolean);
  return froms.length ? Math.min(...froms) - 1 : 0;
}
function partyBefore(chIdx) {
  party = [];
  for (let i = 0; i < chIdx; i++) {
    const ch = CHAPTERS[i];
    party = party.filter(c => !(ch.away || []).includes(c.id));
    for (const o of ch.objectives || []) {
      if (o.join && o.talk && !party.some(c => c.id === o.talk)) party.push({ id: o.talk, x: 0, y: 0, face: 1, moving: false });
      if (o.leave) party = party.filter(c => !o.leave.includes(c.id));
    }
  }
}
// jump to chapter chIdx; with sceneId — to that scene with the quest state of its first objective; qi — explicit objective
function jumpTo(chIdx, sceneId, qi) {
  chIdx = clamp(chIdx, 0, CHAPTERS.length - 1);
  dlg = null; $('dialog').hidden = true; partyBefore(chIdx); initChapter(chIdx);
  const ch = CS.ch, sid = sceneId && ch.scenes[sceneId] ? sceneId : ch.start || Object.keys(ch.scenes)[0];
  skipObjectives(qi != null ? qi : sceneId ? firstObjectiveIn(sid) : 0);
  enterScene(sid, 'S'); banner(ch.years, ch.title, sceneId ? ch.scenes[sid].title : ch.intro); questHud();
}
function startGame(chIdx = 0, sceneId) {
  if (state !== 'title') return;
  audioInit(); state = 'play'; $('title').hidden = true; $('hud').hidden = false; $('app').classList.add('ingame');
  jumpTo(chIdx, sceneId, params.has('done') ? Infinity : undefined);
}
// progress (for the menu: which chapters/scenes can be revisited)
function loadProgress() { try { return JSON.parse(localStorage.getItem('l30progress')) || { ch: 0, qi: {} }; } catch (e) { return { ch: 0, qi: {} }; } }
function saveProgress() {
  if (!CS || state === 'title' || SNAP || params.has('ch')) return; const p = loadProgress();
  p.ch = Math.max(p.ch, CS.i); p.qi[CS.ch.id] = Math.max(p.qi[CS.ch.id] || 0, CS.qi);
  try { localStorage.setItem('l30progress', JSON.stringify(p)); } catch (e) {}
}
$('startBtn').onclick = e => { e.stopPropagation(); startGame(); };
$('tLogo').innerHTML = S.title.replace(/(\d+)/, '<b>$1</b>');
$('tSub').textContent = S.subtitle + (ED ? ` · ${ED.title}` : '');
if (matchMedia('(pointer:coarse)').matches) document.querySelector('#title .help').innerHTML = 'Джойстик — палец слева на экране · кнопка E — говорить<br>выполняй задания · ищи воспоминания «?»';
// ---------------------------------------------------------------- audio
let AC = null, muted = false, engine = null;
function audioInit() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
function tone(f1, f2, dur, type = 'square', vol = 0.06, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  coin: () => { tone(988, 0, 0.07, 'square', 0.05); tone(1319, 0, 0.22, 'square', 0.05, 0.07); },
  open: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0, 0.12, 'square', 0.05, i * 0.07)); },
  done: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0, 0.1, 'triangle', 0.08, i * 0.07)); },
  join: () => { [392, 523, 392, 523, 659, 784].forEach((f, i) => tone(f, 0, 0.08, 'triangle', 0.08, i * 0.06)); },
  deny: () => tone(180, 120, 0.15, 'square', 0.05),
  light: () => tone(440, 0, 0.25, 'square', 0.05),
  go: () => tone(880, 0, 0.5, 'square', 0.06),
  win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0, i === 6 ? 0.8 : 0.14, 'square', 0.06, i * 0.13)); },
};
function engineOn() { if (!AC || engine) return; const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
  o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = muted ? 0 : 0.035;
  o.connect(f).connect(g).connect(AC.destination); o.start(); engine = { o, g }; }
function engineSet(v) { if (engine) { engine.o.frequency.setTargetAtTime(55 + v * 38, AC.currentTime, 0.05); engine.g.gain.setTargetAtTime(muted ? 0 : 0.03, AC.currentTime, 0.1); } }
function engineOff() { if (engine) { engine.g.gain.setTargetAtTime(0, AC.currentTime, 0.2); const o = engine.o; setTimeout(() => o.stop(), 800); engine = null; } }
// ---------------------------------------------------------------- menu: sound, revisit chapters/scenes (Esc)
let paused = false;
const menuEl = document.createElement('div'); menuEl.id = 'menu'; menuEl.hidden = true; ($('app') || document.body).append(menuEl);
const DEBUG_ALL = params.has('ch') || params.has('all');
function sceneOrder(ch) {   // scenes of a chapter with the objective index where each first matters
  const keep = CS; CS = { ch, i: CHAPTERS.indexOf(ch), qi: 0, scenes: {}, got: {}, outfits: {}, look: 'now' };
  const rows = Object.keys(ch.scenes).filter(sid => !isCutScene(ch, sid)).map((sid, k) => ({ sid, q: firstObjectiveIn(sid), k }));
  CS = keep; return rows.sort((a, b) => a.q - b.q || a.k - b.k);
}
function renderMenu() {
  const pr = loadProgress(), maxCh = Math.min(ED_LAST, DEBUG_ALL ? CHAPTERS.length - 1 : Math.max(pr.ch, CS.i));
  const open = menuEl.dataset.open != null ? +menuEl.dataset.open : CS.i;
  let h = `<div class="mbox"><div class="mh">МЕНЮ</div>
    <button data-a="resume">▶ Продолжить</button>
    <button data-a="sound">Звук: ${muted ? 'выкл' : 'вкл'}</button>
    ${document.getElementById('fbBtn') ? '<button data-a="fb">+ Замечание</button>' : ''}
    <div class="mh2">Главы</div>`;
  CHAPTERS.forEach((ch, i) => {
    if (i > ED_LAST) return;
    if (i > maxCh) { h += `<div class="mch locked">${i + 1}. ???</div>`; return; }
    h += `<button class="mch${i === CS.i ? ' cur' : ''}" data-a="ch" data-i="${i}">${i === open ? '▾' : '▸'} ${i + 1}. ${ch.title} <span>${ch.years}</span></button>`;
    if (i !== open) return;
    const reached = DEBUG_ALL || i < pr.ch ? Infinity : Math.max(pr.qi[ch.id] || 0, i === CS.i ? CS.qi : 0);
    h += `<div class="msc"><button data-a="go" data-i="${i}">С начала главы</button>`;
    for (const r of sceneOrder(ch)) { const t = ch.scenes[r.sid].title || r.sid;
      h += r.q <= reached ? `<button data-a="go" data-i="${i}" data-s="${r.sid}"${i === CS.i && r.sid === SC.id ? ' class="cur"' : ''}>${t}</button>` : `<div class="locked">???</div>`; }
    h += '</div>';
  });
  menuEl.innerHTML = h + `<div class="mfoot">Esc — закрыть меню</div></div>`;
}
function openMenu() { if (paused || !['play', 'race'].includes(state) || fadeDir) return; paused = true; for (const k in keys) keys[k] = false;
  stick.x = stick.y = 0; delete menuEl.dataset.open; renderMenu(); menuEl.hidden = false; engineSet && engine && engine.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); }
function closeMenu() { paused = false; menuEl.hidden = true; }
menuEl.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === menuEl) closeMenu(); });
menuEl.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
  if (a === 'resume') closeMenu();
  else if (a === 'sound') { muted = !muted; renderMenu(); }
  else if (a === 'fb') { closeMenu(); document.getElementById('fbBtn').click(); }
  else if (a === 'ch') { menuEl.dataset.open = +b.dataset.i === +(menuEl.dataset.open ?? CS.i) ? -1 : b.dataset.i; renderMenu(); }
  else if (a === 'go') { closeMenu(); if (state === 'race') { engineOff(); state = 'play'; $('hint').hidden = true; $('center').textContent = ''; $('toast').style.bottom = ''; }
    const i = +b.dataset.i, s = b.dataset.s; transition(() => jumpTo(i, s)); }
});
addEventListener('keydown', e => { if (e.code !== 'Escape') return; e.preventDefault(); paused ? closeMenu() : openMenu(); });
$('mute').onclick = e => { e.stopPropagation(); openMenu(); };

// ---------------------------------------------------------------- input
const keys = {}, pressed = {}, stick = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
const MAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down', Space: 'act', Enter: 'act', KeyE: 'act', KeyX: 'act', KeyZ: 'act' };
const press = a => { if (!keys[a]) pressed[a] = true; keys[a] = true; };
addEventListener('keydown', e => { const a = MAP[e.code]; if (!a) return; e.preventDefault(); audioInit(); press(a); });
addEventListener('keyup', e => { const a = MAP[e.code]; if (a) keys[a] = false; });
{
  const zone = $('stickZone'), st = $('stick'), knob = $('knob'), R = 44;
  // phone held upright: #app is turned 90° (see index.html) → screen point → game-screen point
  const ROT = matchMedia('(orientation:portrait) and (pointer:coarse)');
  const loc = e => ROT.matches ? [e.clientY, (window.visualViewport ? visualViewport.width : innerWidth) - e.clientX] : [e.clientX, e.clientY];
  zone.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); if (dlg) { pressed.act = true; return; }
    const [lx, ly] = loc(e);
    stick.id = e.pointerId; stick.ox = lx; stick.oy = ly; try { zone.setPointerCapture(e.pointerId); } catch (_) {}
    st.hidden = false; st.style.left = lx + 'px'; st.style.top = ly + 'px'; knob.style.transform = 'translate(-50%,-50%)'; });
  zone.addEventListener('pointermove', e => { if (e.pointerId !== stick.id) return;
    const [lx, ly] = loc(e); let dx = lx - stick.ox, dy = ly - stick.oy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    const wasUp = stick.y < -0.6; stick.x = dx / R; stick.y = dy / R; if (!wasUp && stick.y < -0.6) pressed.up = true;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; });
  const end = e => { if (e.pointerId !== stick.id) return; stick.id = null; stick.x = stick.y = 0; st.hidden = true; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  const btn = $('actBtn');
  btn.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); press('act'); btn.classList.add('on'); });
  const off = e => { e.preventDefault(); keys.act = false; btn.classList.remove('on'); };
  btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('pointerleave', off);
  // tap on the dialog box = next line
  $('dialog').addEventListener('pointerdown', e => { if (dlg) { e.preventDefault(); audioInit(); pressed.act = true; } });
}
$('stage').addEventListener('pointerdown', () => { audioInit(); if (dlg) pressed.act = true; });

// ---------------------------------------------------------------- mini-game: race (ported from the platformer)
// grid: index → row (i/2, last row first) and lane (even = far lane 0, odd = near lane 2). Front row: Quartararo (pole) + Martín.
// c = bike, h = helmet, tag = colour of the number in the name label; top = cruise speed (Женя maxes at 4.6)
const RIVALS = [
  { c: '#e8e8e8', h: '#111', n: 7, top: 3.2 },
  { c: '#00a651', h: '#fff', n: 12, top: 3.3 },
  { c: '#ff7a00', h: '#1e3a8a', n: 23, name: 'Бастианини', tag: '#ff9a3c', top: 3.5 },   // KTM Tech3
  { c: '#c8102e', h: '#fff', n: 63, name: 'Баньяя', tag: '#ff5a5a', top: 3.6 },           // Ducati
  { c: '#1e50ff', h: '#ffd400', n: 20, name: 'Квартараро', tag: '#6f9bff', q: true },       // Yamaha — scripted, see updRace
  { c: '#151515', h: '#7a1fd1', n: 89, name: 'Мартин', tag: '#c08cff', top: 3.7 },        // Aprilia
];
const LANES = [131, 147, 163];
const R = { d: 0, v: 0, t: 0, phase: 'lights', goAt: 0, rivals: [], len: 4500, fin: 0, place: 0, wheelie: 0, wa: 0, lines: [] };
let crowdC, boardsC, asphaltC;
function buildRaceArt() {
  const R2 = rng(42), mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  let g; [crowdC, g] = mk(128, 44);
  for (let row = 0; row < 11; row++) { g.fillStyle = row % 2 ? '#6f7480' : '#7c818d'; g.fillRect(0, row * 4, 128, 4);
    for (let x = 0; x < 128; x += 2) if (R2() < 0.8) { g.fillStyle = ['#ff7a00', '#e8412c', '#ffd400', '#fff', '#1e50ff', '#111', '#f1c27d', '#00a651'][R2() * 8 | 0]; g.fillRect(x, row * 4 + 1, 2, 2); } }
  [boardsC, g] = mk(192, 14);
  [['#ff7a00', '#fff'], ['#111', '#e8412c'], ['#fff', '#1e50ff']].forEach(([bg, fg], i) => {
    g.fillStyle = bg; g.fillRect(i * 64, 0, 62, 14); g.fillStyle = fg; g.fillRect(i * 64 + 6, 5, 50, 4); g.fillRect(i * 64 + 6, 3, 6, 8); });
  [asphaltC, g] = mk(64, 52); g.fillStyle = '#4a4a54'; g.fillRect(0, 0, 64, 52);
  for (let i = 0; i < 90; i++) { g.fillStyle = R2() < 0.5 ? '#55555f' : '#40404a'; g.fillRect(R2() * 64 | 0, R2() * 52 | 0, 1, 1); }
}
function startRace() {
  $('app').classList.add('ingame');
  state = 'race'; buildRaceArt(); dlg = null; $('dialog').hidden = true; $('banner').classList.remove('show');
  Object.assign(R, { d: 0, v: 0, t: 0, phase: 'lights', goAt: 260 + Math.random() * 60 | 0, len: S.race.length || 4500, fin: 0, place: 0, wheelie: 0, qPassed: false });
  R.rivals = RIVALS.map(({ c, h, n, name, tag, q, top }, i) => ({ d: 40 + Math.floor(i / 2) * 40, lane: i % 2 ? 2 : 0, v: 0, top: q ? 4.4 : top + Math.random() * 0.15,
    acc: q ? 0.05 : 0.03 + Math.random() * 0.015, spr: bikeSprite(c, h, hex(c).reduce((a, b) => a + b) < 120 ? '#d8d8d8' : '#2a2a2a'), n, name, tag, q, wa: 0 }));
  R.quart = R.rivals.find(r => r.q);
  $('hud').hidden = false; $('quest').hidden = true; $('party').textContent = '';
  $('hint').hidden = false; $('hint').textContent = S.race.hint; $('center').textContent = '';
  audioInit(); engineOn(); hudRace();
}
function hudRace() {
  const place = 1 + R.rivals.filter(r => r.d > R.d).length;
  $('hudC').textContent = `P${R.fin ? R.place : place}/${R.rivals.length + 1} · ${Math.round(R.v * 68)} km/h`;
}
function updRace() {
  R.t++;
  if (R.phase === 'lights') {
    if (R.t % 45 === 0 && R.t / 45 <= 5) SFX.light();
    if (R.t >= R.goAt) { R.phase = 'go'; SFX.go(); $('center').textContent = 'GO!'; setTimeout(() => { if (state === 'race' && !R.fin) $('center').textContent = ''; }, 900); }
  } else {
    const gas = keys.right || keys.act || stick.x > 0.4;
    if (!R.fin) R.v = gas ? Math.min(R.v + 0.06, 4.6) : Math.max(R.v - 0.035, 0);
    else R.v = Math.max(R.v - 0.04, 0.6);
    if (keys.left || stick.x < -0.4) R.v = Math.max(R.v - 0.08, 0);
    if (pressed.up && R.wheelie <= 0 && R.v > 1) R.wheelie = 40;
    for (const r of R.rivals) {
      let cap = R.fin ? r.top * 0.7 : r.d - R.d > 160 ? r.top * 0.55 : r.top;
      if (r.q && !R.fin) {
        // Quartararo keeps a target gap to Женя: ~45px ahead for 70% of the race (he can out-sprint 4.6 here),
        // then the target slides to ~45px behind by the line (and he can no longer match 4.6) → a visible late pass.
        // It's a birthday: in the last 30% he eases off whatever Женя does, so the pass always happens.
        const p = R.d / R.len, G = p < 0.7 ? 45 + Math.sin(R.t / 55) * 14 : p < 0.9 ? 45 - (p - 0.7) / 0.2 * 70 : -25 - (p - 0.9) / 0.1 * 20;
        cap = Math.max(p < 0.7 ? 3.8 : 2, Math.min(p < 0.7 ? 4.75 : r.top, R.v + 0.06 * (G - (r.d - R.d))));
      }
      r.v = r.v < cap ? Math.min(r.v + r.acc, cap) : Math.max(r.v - 0.05, cap); r.d += r.v; r.wa += r.v / 4; }
    if (!R.qPassed && R.quart && !R.fin && R.d > R.quart.d && R.d > R.len * 0.3) { R.qPassed = true;
      $('toast').style.bottom = '50cqh'; toast('Обогнал Квартараро!', 2200); SFX.coin(); } // raised over the crowd so it doesn't cover the bikes
  }
  R.d += R.v; R.wa += R.v / 4; if (R.wheelie > 0) R.wheelie--;
  if (!R.fin && R.d >= R.len) { R.fin = R.t; R.place = 1 + R.rivals.filter(r => r.d > R.d).length;
    $('center').textContent = R.place === 1 ? 'P1 · ПОБЕДА!' : `P${R.place} · ФИНИШ!`; $('hint').hidden = true; $('toast').classList.remove('show'); SFX.win(); }
  if (R.fin && R.t - R.fin === 170) transition(startReveal);
  if (R.v > 2.5 && Math.random() < R.v / 6) R.lines.push({ x: W + 10, y: 20 + Math.random() * 150, l: 10 + Math.random() * 30 });
  for (const l of R.lines) l.x -= R.v * 4; R.lines = R.lines.filter(l => l.x + l.l > 0);
  engineSet(R.v); hudRace();
}
const PX = 90;
function renderRace(still) {
  const d = R.d;
  for (let k = 0; k < 10; k++) rect(0, k * 10, W, 10, css(mix(hex('#3a9be8'), hex('#c2e6ff'), k / 9)));
  disc(60, 26, 10, '#fff3b0'); disc(60, 26, 7, '#ffe066');
  ctx.fillStyle = '#93b6cc'; for (let i = 0; i < W; i += 2) { const X = i + d * 0.05; const h = 18 + Math.sin(X * 0.03) * 7 + Math.sin(X * 0.011) * 9; ctx.fillRect(i, 70 - h, 2, h + 30); }
  { const o = -((d * 0.4) % 128); for (let k = -1; k < 4; k++) { const x = Math.round(o + k * 128);
      rect(x, 44, 128, 4, '#2c313b'); rect(x + 6, 48, 2, 6, '#2c313b'); rect(x + 120, 48, 2, 6, '#2c313b'); ctx.drawImage(crowdC, x, 54); }
    for (let i = 0; i < 30; i++) rect(Math.random() * W, 55 + (Math.random() * 11 | 0) * 4, 2, 2, ['#ff7a00', '#fff', '#ffd400', '#e8412c'][i % 4]);
    rect(0, 98, W, 2, '#2c313b'); }
  { const o = -((d * 0.8) % 192); for (let k = 0; k < 3; k++) ctx.drawImage(boardsC, Math.round(o + k * 192), 100); }
  rect(0, 114, W, 4, '#3f9a3a');
  { const o = -(d % 64); for (let k = 0; k < 7; k++) ctx.drawImage(asphaltC, Math.round(o + k * 64), 121); }
  for (let x = -(d % 16) - 16; x < W; x += 16) { rect(x, 118, 8, 3, '#e8412c'); rect(x + 8, 118, 8, 3, '#fff'); rect(x, 173, 8, 3, '#fff'); rect(x + 8, 173, 8, 3, '#e8412c'); }
  rect(0, 176, W, 4, '#3f9a3a');
  const fl = wx => { const x = Math.round(PX + wx - d); if (x < -10 || x > W + 10) return;
    for (let j = 0; j < 13; j++) for (let i = 0; i < 2; i++) rect(x + i * 4, 121 + j * 4, 4, 4, (i + j) % 2 ? '#111' : '#fff'); };
  fl(36); fl(R.len + 30);
  ctx.globalAlpha = 0.7; for (const l of R.lines) rect(l.x, l.y, l.l, 1, '#fff'); ctx.globalAlpha = 1;
  const all = [...R.rivals, { lane: 1, me: true }].sort((a, b) => a.lane - b.lane), lab0 = labelQ.length;
  for (const r of all) {
    if (r.me) drawBike(bikeSprite(S.hero.bike, S.hero.helmet, S.hero.suit || '#2b2b38', true, LOOKS.now.pal.H), PX, LANES[1], R.wa, S.hero.number, R.wheelie > 0 ? Math.sin(Math.min(1, R.wheelie / 40) * Math.PI) * 0.35 : 0);
    else { const x = PX + r.d - d; if (x > -40 && x < W + 10) { drawBike(r.spr, x, LANES[r.lane], r.wa, r.n);
      if (r.name && !still && x > -10 && x < W - 6) labelQ.push({ pre: '#' + r.n, col: r.tag, text: r.name, x: Math.round(x + 16), y: LANES[r.lane] - 21 }); } }
  }
  // riders bunched in one lane (the grid): stack their name labels so they don't overlap (~3.6 canvas px per glyph, 6 px per row)
  const placed = [];
  for (const q of labelQ.slice(lab0)) { const w = (q.pre.length + 1 + q.text.length) * 3.6 + 4, l = q.x - w / 2;
    let k = 0; while (k < 3 && placed.some(o => o.y0 === q.y && o.k === k && l < o.l + o.w && o.l < l + w)) k++;
    placed.push({ y0: q.y, k, l, w }); q.y -= k * 6; }
  if (R.phase === 'lights' && !still) { rect(104, 6, 112, 22, '#1a1a1a');
    const on = Math.min(5, R.t / 45 | 0);
    for (let i = 0; i < 5; i++) { disc(116 + i * 22, 13, 4, i < on ? '#ff2a2a' : '#401010'); disc(116 + i * 22, 22, 3, i < on ? '#ff2a2a' : '#401010'); } }
}

// ---------------------------------------------------------------- reveal
let confetti = [];
function startReveal() {
  state = 'reveal'; engineOff(); R.phase = 'go'; R.v = 0.8; $('toast').style.bottom = '';
  $('center').textContent = ''; $('hint').hidden = true; $('hud').hidden = true; $('touch').style.display = 'none';
  const G = S.gift;
  $('gHello').textContent = G.hello; $('gHead').textContent = G.header; $('gTitle').textContent = G.title;
  $('gSub').textContent = G.subtitle; $('gStub').textContent = G.stub; $('gNote').textContent = G.note;
  $('gRows').innerHTML = ''; for (const [k, v] of G.rows) { const a = document.createElement('div'); a.className = 'k'; a.textContent = k;
    const b = document.createElement('div'); b.textContent = v; $('gRows').append(a, b); }
  $('reveal').hidden = false; audioInit(); SFX.win();
}
function updReveal() {
  R.d += R.v; R.wa += R.v / 4; for (const r of R.rivals) { r.d += 0.6; r.wa += 0.15; }
  for (let i = 0; i < 3; i++) confetti.push({ x: Math.random() * W, y: -4, vx: (Math.random() - .5) * 0.6, vy: 0.5 + Math.random() * 0.8,
    c: ['#ffd23f', '#e8412c', '#fff', '#1e50ff', '#00a651', '#ff7a00'][Math.random() * 6 | 0], ph: Math.random() * 6 });
  for (const p of confetti) { p.x += p.vx + Math.sin(tick / 10 + p.ph) * 0.3; p.y += p.vy; }
  confetti = confetti.filter(p => p.y < H + 4);
}
$('again').onclick = () => location.href = location.pathname;
// teaser: after the last playable chapter — «to be continued» screen
function showToBeContinued() {
  state = 'tbc'; $('hud').hidden = true; $('dialog').hidden = true; dlg = null;
  const t = ED.end || {};
  $('tbcTitle').textContent = t.title || 'Продолжение следует…'; $('tbcText').textContent = t.text || '';
  $('tbc').hidden = false; SFX.win && SFX.win();
}
$('tbcAgain').onclick = () => location.href = location.pathname + location.search;


// ---------------------------------------------------------------- loop
function update() {
  tick++;
  if (fadeDir) { fade += fadeDir * 0.05; if (fade >= 1) { fade = 1; fadeDir = -1; const cb = fadeCb; fadeCb = null; cb && cb(); } if (fade <= 0) { fade = 0; fadeDir = 0; } }
  if (state === 'title') { const cx = SC.Ww / 2, cy = SC.Hh / 2, a = tick / 400;
    cam.x = isoX(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4) - W / 2; cam.y = isoY(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4) - H / 2;
    if (pressed.act) startGame(); }
  else if (state === 'tbc') { const cx = SC.Ww / 2, cy = SC.Hh / 2, a = tick / 500;
    cam.x = isoX(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3) - W / 2; cam.y = isoY(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3) - H / 2; }
  else if (paused) {}
  else if (state === 'play') updPlay();
  else if (state === 'race') updRace();
  else if (state === 'reveal') updReveal();
  for (const k in pressed) delete pressed[k];
}
function render() {
  labelQ = [];
  if (state === 'race' || state === 'reveal') renderRace(state === 'reveal'); else renderWorld();
  if (state === 'reveal') for (const p of confetti) rect(p.x, p.y, 2, Math.sin(tick / 5 + p.ph) > 0 ? 2 : 1, p.c);
  if (fade > 0) { ctx.globalAlpha = fade; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; }
  syncLabels();
}
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  render(); requestAnimationFrame(frame);
}

// debug: ?ch=N (&scene=id) (&done) | ?scene=race | ?scene=reveal — все главы и сцены: debug.html
// (старый параметр ?level=N тоже работает)
CS = { ch: CHAPTERS[0], i: 0, scenes: {}, qi: 0, got: {}, unlocked: false, outfits: {}, look: CHAPTERS[0].look || 'kid' };
SC = getScene(CHAPTERS[0].start || Object.keys(CHAPTERS[0].scenes)[0]); [P.x, P.y] = SC.spawns.S || [1.5, 1.5]; P.look = CS.look;
const sc = params.get('scene'), chParam = params.get('ch') || params.get('level');
if (sc === 'race' || sc === 'reveal') { $('title').hidden = true; state = 'play'; startRace(); if (sc === 'reveal') { R.d = R.len; startReveal(); } }
else if (chParam) startGame(+chParam - 1, sc || undefined);
window.GAME = { P, keys, get CS() { return CS; }, get SC() { return SC; }, get party() { return party; }, get state() { return state; }, get dlg() { return dlg; }, R, CHAPTERS,
  enterScene: (sid, at) => enterScene(sid, at), ED, isCutObj, isCutScene, doorOptions, vis, targetScene, getScene, setQi: q => { CS.qi = q; }, jumpTo: (i, s, q) => jumpTo(i, s, q), snapshot,
  step(n = 1, k = {}) { for (let i = 0; i < n; i++) { for (const a in k) { if (k[a] && !keys[a]) pressed[a] = true; keys[a] = k[a]; } update(); } render(); } };
requestAnimationFrame(frame);
})();
