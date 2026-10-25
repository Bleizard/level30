// =====================================================================
//  ГЛАВА 1. Детство на Дыбенко · 1996–2011
//  Сцены: двор на Дыбенко → квартира, манеж (Зимний стадион), Леголенд (Дания).
//  Это эталонная глава: формат описан в ../ENGINE.md.
// =====================================================================

// ---- объекты, нужные только этой главе
L30.object('metro', { w: 2, d: 1, draw: (o, K) => {             // павильон метро «Улица Дыбенко»
  const b = K.isoBox(o.x, o.y + 0.15, o.w, o.d - 0.3, 18, { t: '#c9ccd1', l: '#7fa3c4', r: '#5f83a4', e: '#dfe6ee' });
  K.faceUp(K.onEdge(b.D, b.C, 0, 14), K.onEdge(b.D, b.C, 1, 14), 4, '#d0302a');
  const [x, y] = K.onEdge(b.D, b.C, 0.5, 6);                    // большая «М»
  K.rect(x - 4, y - 7, 2, 7, '#d0302a'); K.rect(x + 3, y - 7, 2, 7, '#d0302a'); K.rect(x - 2, y - 6, 1, 2, '#d0302a'); K.rect(x + 2, y - 6, 1, 2, '#d0302a'); K.rect(x, y - 4, 1, 2, '#d0302a');
} });
// ---- манеж «Зимний стадион» (бывший Михайловский манеж Бренны/Росси, Манежная пл.):
//      200-метровый круг с наклонными виражами, прыжковые секторы внутри, трибуны, табло,
//      высокие арочные окна между пилястрами, поверху — фермы перекрытия.
L30.ground('C', { c: '#8f3a2e', side: ['#5a221c', '#4a1c17'], speck: '#a34a3c' });       // сектор внутри круга (тёмная резина)
const ch1Steel = '#7d8288';
function ch1MWall(o, K, extra, w = 1) {             // высокая стена манежа: плинтус, карниз, ферма поверху
  const c = K.scene.wall || { t: '#9a8f80', l: '#efe6d2', r: '#d9cfb9', e: '#fbf5e6' }, h = 42;
  const b = K.isoBox(o.x, o.y, w, 1, h, c);
  for (const [a, e, col] of [[b.D, b.C, c.l], [b.C, b.B, c.r]]) {
    K.faceUp(a, e, 3, K.shade(col, -0.2));
    K.faceUp(K.onEdge(a, e, 0, 30), K.onEdge(a, e, 1, 30), 2, K.shade(col, -0.14));
    const n = 4 * w;                                 // решётчатая ферма: два пояса + раскосы
    K.line(...K.onEdge(a, e, 0, 34), ...K.onEdge(a, e, 1, 34), ch1Steel);
    K.line(...K.onEdge(a, e, 0, 40), ...K.onEdge(a, e, 1, 40), ch1Steel);
    for (let i = 0; i < n; i++) K.line(...K.onEdge(a, e, i / n, i % 2 ? 40 : 34), ...K.onEdge(a, e, (i + 1) / n, i % 2 ? 34 : 40), ch1Steel);
    if (extra) extra(a, e, col);
  }
  return b;
}
function ch1Arch(K, a, e, t0, t1, h0, hw, R, frame, fill) {   // проём с полукруглым верхом на грани a→e
  for (let pass = 0; pass < 2; pass++) {
    const p = pass ? 0.04 : 0, s0 = t0 + p, s1 = t1 - p, dh = pass, rr = R - pass, n = 12;
    for (let i = 0; i < n; i++) {
      const u0 = s0 + (s1 - s0) * i / n, u1 = s0 + (s1 - s0) * (i + 1) / n, u = ((u0 + u1) / 2 - (s0 + s1) / 2) / ((s1 - s0) / 2);
      K.faceUp(K.onEdge(a, e, u0, h0 + dh), K.onEdge(a, e, u1, h0 + dh), hw - 2 * dh + Math.round(rr * Math.sqrt(Math.max(0, 1 - u * u))), pass ? fill : frame);
    }
  }
}
L30.object('ch1_mwall', { draw: (o, K) => ch1MWall(o, K, (a, e, col) => {          // простенок с пилястрой
  K.faceUp(K.onEdge(a, e, 0.36, 3), K.onEdge(a, e, 0.64, 3), 26, K.shade(col, 0.14));
  K.faceUp(K.onEdge(a, e, 0.62, 3), K.onEdge(a, e, 0.66, 3), 26, K.shade(col, -0.12));
  K.faceUp(K.onEdge(a, e, 0.3, 28), K.onEdge(a, e, 0.7, 28), 2, K.shade(col, -0.06));
}) });
L30.object('ch1_mwall_win', { draw: (o, K) => ch1MWall(o, K, (a, e) => {           // высокое арочное окно (их в манеже 54)
  const fr = '#f6f1e4';
  ch1Arch(K, a, e, 0.2, 0.8, 7, 15, 4, fr, K.night ? '#1d2550' : '#bfe0f4');
  const [mx, my] = K.onEdge(a, e, 0.5, 8); K.rect(mx, my - 17, 1, 17, fr);
  K.line(...K.onEdge(a, e, 0.22, 15), ...K.onEdge(a, e, 0.78, 15), fr);
  K.line(...K.onEdge(a, e, 0.22, 22), ...K.onEdge(a, e, 0.78, 22), fr);
  if (!K.night) { const [x, y] = K.onEdge(a, e, 0.33, 12); K.rect(x, y - 4, 1, 3, '#ffffff'); }
}) });
L30.object('ch1_mwall_door', { solid: 0, draw: (o, K) => ch1MWall(o, K, (a, e) => {   // высокие двери на Манежную площадь
  ch1Arch(K, a, e, 0.18, 0.82, 0, 19, 5, '#e2d6b8', '#6b4a2e');
  const [mx, my] = K.onEdge(a, e, 0.5, 0); K.rect(mx, my - 22, 1, 22, '#3a2618');
}) });
const ch1Txt = (K, a, e, s, t0, hh, c) => [...s].forEach((ch, i) => { const [x, y] = K.onEdge(a, e, t0 + i * 4 / (e[0] - a[0]), hh); K.pixText(ch, x, y, c); });
L30.object('ch1_mwall_board', { w: 2, d: 1, draw: (o, K) => {                     // электронное табло с секундомером
  const b = ch1MWall(o, K, null, 2), a = b.D, e = b.C;
  K.faceUp(K.onEdge(a, e, 0.08, 8), K.onEdge(a, e, 0.92, 8), 22, '#2a2a30');
  K.faceUp(K.onEdge(a, e, 0.1, 9), K.onEdge(a, e, 0.9, 9), 20, '#0e0f14');
  const f = K.tick % 2700, sec = String(f / 60 | 0).padStart(2, '0'), cs = String((f % 60) * 100 / 60 | 0).padStart(2, '0');
  ch1Txt(K, a, e, '200', 0.36, 27, '#ff9a2a');
  ch1Txt(K, a, e, sec + ' ' + cs, 0.22, 18, '#ffd23f');
  const [dx, dy] = K.onEdge(a, e, 0.22 + 8.5 / (e[0] - a[0]), 14); K.rect(dx, dy, 1, 1, '#ffd23f');
} });
L30.object('ch1_stands', { w: 6, d: 1, draw: (o, K) => {                           // трибуна в три ступени со зрителями
  const tiers = [[0, 0.34, 15], [0.34, 0.33, 10], [0.67, 0.33, 5]], seat = ['#2f6db5', '#e3c23a', '#2f6db5'];
  tiers.forEach(([dy, dd, h], i) => {
    K.isoBox(o.x, o.y + dy, o.w, dd, h, { t: '#b9b4aa', l: '#9a958c', r: '#85807a', e: '#cfcac0' });
    for (let k = 0; k < o.w * 4; k++) { const [x, y] = K.P2(o.x + (k + 0.5) / 4, o.y + dy + dd * 0.3, h); K.rect(x - 1, y - 3, 3, 3, seat[i]); }
  });
  const R = K.rng(o.seed), shirts = ['#e8412c', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#ecf0f1', '#34495e'],
    hairs = ['#3a2a1a', '#d9b46a', '#1a1a1a', '#8a4a2a', '#b0b0b0'], skins = ['#efc6a5', '#e8b48c', '#f3d2b8'];
  tiers.forEach(([dy, dd, h], i) => {
    for (let k = 0; k < o.w * 3; k++) {
      if (R() < 0.3) continue;
      const [x, y] = K.P2(o.x + (k + 0.3 + R() * 0.4) / 3, o.y + dy + dd * 0.5, h);
      const sh = shirts[R() * shirts.length | 0], hr = hairs[R() * hairs.length | 0], sk = skins[R() * skins.length | 0];
      const up = ((K.tick >> 4) + k * 3 + i * 5 + o.seed) % 13 === 0, lift = up ? 2 : 0;   // кто-то вскакивает и машет
      K.rect(x - 1, y - 6 - lift, 3, 4, sh); K.rect(x - 1, y - 9 - lift, 3, 3, sk); K.rect(x - 1, y - 9 - lift, 3, 1, hr);
      if (up) { K.rect(x - 2, y - 13, 1, 4, sk); K.rect(x + 2, y - 13, 1, 4, sk); }
    }
  });
} });
L30.object('ch1_judges', { draw: (o, K) => {                                      // судейский столик и фотофиниш напротив финиша
  K.isoBox(o.x + 0.15, o.y + 0.3, 0.7, 0.45, 7, { t: '#f4f4f0', l: '#c0392b', r: '#a52f24' });
  const [x, y] = K.P2(o.x + 0.5, o.y + 0.5, 7);
  K.rect(x - 3, y - 4, 5, 3, '#1a1a1e'); K.rect(x + 2, y - 3, 2, 1, '#555a62');
  K.rect(x - 2, y - 5, 1, 1, (K.tick >> 4) % 2 ? '#ff3b30' : '#5a1a16');
} });
L30.object('ch1_bank', { w: 2, d: 8, solid: 0, draw: (o, K) => {                  // вираж с наклоном (side: 'l' | 'r')
  const s = o.side === 'r' ? 1 : -1, cx = s > 0 ? o.x : o.x + o.w, cy = o.y + o.d / 2, H = 4, N = 16;
  const ang = i => Math.PI * i / N;
  const pt = (f, i, z) => K.P2(cx + s * o.w * f * Math.sin(ang(i)), cy - (o.d / 4) * (1 + f) * Math.cos(ang(i)), z == null ? H * f : z);
  for (const [f0, f1, c] of [[0, 0.5, '#b8473a'], [0.5, 1, '#c8573f']])
    for (let i = 0; i < N; i++) K.fillQuad([pt(f0, i), pt(f1, i), pt(f1, i + 1), pt(f0, i + 1)], c);
  for (const f of [0, 0.5, 1]) for (let i = 0; i < N; i++) K.line(...pt(f, i), ...pt(f, i + 1), '#f0e6e0');
  for (let i = 0; i < N; i++) {                                                  // наружный борт — там, где он смотрит на нас
    const m = ang(i + 0.5);
    if (s * Math.sin(m) / o.w - Math.cos(m) / (o.d / 2) <= 0) continue;
    const p = pt(1, i, 0), q = pt(1, i + 1, 0);
    if (p[0] < q[0]) K.faceUp(p, q, H, '#6e2a22'); else if (q[0] < p[0]) K.faceUp(q, p, H, '#6e2a22');
  }
} });
L30.object('ch1_infield', { w: 11, d: 4, draw: (o, K) => {                       // сектор внутри круга: ядро, прыжки в длину и в высоту
  const X = o.x, Y = o.y, W = o.w, D = o.d, kerb = { t: '#f4f4f0', l: '#d0d0cc', r: '#b8b8b4' }, wl = '#f0e6e0';
  K.isoBox(X, Y, W, 0.1, 2, kerb); K.isoBox(X, Y, 0.1, D, 2, kerb);              // бровка (дальние стороны)
  const cx = X + 1.6, cy = Y + 1.2, circ = (r, z = 0) => Array.from({ length: 14 }, (_, i) => K.P2(cx + r * Math.cos(i / 14 * Math.PI * 2), cy + r * Math.sin(i / 14 * Math.PI * 2), z));
  for (const a of [-0.35, 0.35]) K.line(...K.P2(cx, cy), ...K.P2(cx + 3 * Math.cos(a), cy + 3 * Math.sin(a)), wl);   // сектор толкания ядра
  K.fillQuad(circ(0.5), '#6a6d72'); const ring = circ(0.5); ring.forEach((p, i) => K.line(...p, ...ring[(i + 1) % ring.length], wl));
  { const [x, y] = K.P2(cx + 2.1, cy + 0.4); K.disc(x, y - 2, 2, '#3a3d44'); K.rect(x - 1, y - 3, 1, 1, '#8a8f99'); }   // ядро
  K.flat(X + 0.4, Y + 2.55, 5.2, 0.5, '#c55a44');                                 // разбег прыжков в длину
  K.line(...K.P2(X + 0.4, Y + 2.55), ...K.P2(X + 5.6, Y + 2.55), wl); K.line(...K.P2(X + 0.4, Y + 3.05), ...K.P2(X + 5.6, Y + 3.05), wl);
  K.flat(X + 5.0, Y + 2.55, 0.14, 0.5, '#ffffff');                                // брусок отталкивания
  K.isoBox(X + 5.7, Y + 2.25, 2.3, 1.2, 1, { t: '#e0c48a', l: '#9a958c', r: '#85807a' });   // яма с песком
  { const R = K.rng(o.seed); for (let i = 0; i < 16; i++) { const [x, y] = K.P2(X + 5.8 + R() * 2.1, Y + 2.35 + R() * 1.0, 1); K.rect(x, y, 2, 1, R() < 0.5 ? '#c9ad72' : '#f0dca6'); } }
  K.isoBox(X + 7.9, Y + 0.35, 2.6, 1.3, 6, { t: '#2f6db5', l: '#2a5c9a', r: '#224a7d', e: '#4a86d0' });   // мат для прыжков в высоту
  K.isoBox(X + 7.9, Y + 1.45, 2.6, 0.2, 1, { t: '#e3c23a', l: '#c9a82a', r: '#a88a1e' }, 6);
  const up = [K.P2(X + 8.1, Y + 1.95), K.P2(X + 10.3, Y + 1.95)];
  for (const [x, y] of up) { K.rect(x - 1, y - 1, 3, 1, '#4a4d55'); K.rect(x, y - 17, 1, 17, '#d8d8d8'); }
  for (let i = 0; i < 6; i++) K.line(...K.onEdge(up[0], up[1], i / 6, 14), ...K.onEdge(up[0], up[1], (i + 1) / 6, 14), i % 2 ? '#ffffff' : '#e8412c');   // планка
  K.isoBox(X + W - 0.1, Y, 0.1, D, 2, kerb); K.isoBox(X, Y + D - 0.1, W, 0.1, 2, kerb);   // бровка (ближние стороны)
} });
L30.object('ch1_blocks', { solid: 0, draw: (o, K) => {                            // стартовые колодки + номер дорожки
  K.flat(o.x + 0.74, o.y + 0.02, 0.07, 0.96, '#ffffff');
  K.isoBox(o.x + 0.2, o.y + 0.46, 0.45, 0.08, 1, { t: '#9aa0aa', l: '#7d828c', r: '#6d727c' });
  K.isoBox(o.x + 0.28, o.y + 0.3, 0.08, 0.16, 3, { t: '#e8412c', l: '#c0392b', r: '#a52f24' });
  K.isoBox(o.x + 0.48, o.y + 0.54, 0.08, 0.16, 3, { t: '#e8412c', l: '#c0392b', r: '#a52f24' });
  const [x, y] = K.P2(o.x + 0.95, o.y + 0.5); K.pixText(String(o.lane || 1), x - 1, y - 2, '#ffffff');
} });
L30.object('ch1_finish', { w: 1, d: 2, solid: 0, draw: (o, K) => {               // финишная черта поперёк обеих дорожек
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) K.flat(o.x + 0.35 + j * 0.15, o.y + i * o.d / 8, 0.15, o.d / 8, (i + j) % 2 ? '#111111' : '#ffffff');
} });
L30.object('ch1_hurdle', { draw: (o, K) => {                                      // пара барьеров у стены
  for (let k = 0; k < 2; k++) {
    const yy = o.y + 0.3 + k * 0.4, l = K.P2(o.x + 0.15, yy), r = K.P2(o.x + 0.85, yy);
    for (const [x, y] of [l, r]) { K.rect(x - 1, y, 3, 1, '#4a4d55'); K.rect(x, y - 10, 1, 10, '#d8d8d8'); }
    for (let t = 0; t < 4; t++) K.faceUp(K.onEdge(l, r, t / 4, 9), K.onEdge(l, r, (t + 1) / 4, 9), 3, t % 2 ? '#111111' : '#f4f4f4');
  }
} });
L30.object('lego_house', { w: 2, d: 2, draw: (o, K) => {        // домик из кубиков
  const cols = ['#e8412c', '#ffd23f', '#2e86de', '#27ae60', '#f39c12'], c = cols[o.seed % cols.length], c2 = cols[(o.seed + 2) % cols.length];
  for (let i = 0; i < 4; i++) K.isoBox(o.x + 0.2, o.y + 0.2, 1.6, 1.6, 6, { t: i % 2 ? c : c2, l: K.shade(i % 2 ? c : c2, -0.05), r: K.shade(i % 2 ? c : c2, -0.25) }, i * 6);
  K.isoBox(o.x + 0.1, o.y + 0.1, 1.8, 1.8, 3, { t: '#e8412c', l: '#c0392b', r: '#a52f24' }, 24);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const [x, y] = K.P2(o.x + 0.45 + i * 0.55, o.y + 0.45 + j * 0.55, 27); K.rect(x - 1, y - 2, 3, 2, '#ff6a5a'); }
  const b = K.isoBox(o.x + 0.2, o.y + 0.2, 1.6, 1.6, 0, { t: c, l: c, r: c }); K.faceUp(K.onEdge(b.D, b.C, 0.4, 0), K.onEdge(b.D, b.C, 0.6, 0), 9, '#3a2618');
} });
L30.object('lego_tree', { draw: (o, K) => {
  K.isoBox(o.x + 0.42, o.y + 0.42, 0.16, 0.16, 8, { t: '#8a5a2e', l: '#8a5a2e', r: '#6b4423' });
  for (let i = 0; i < 3; i++) K.isoBox(o.x + 0.2 + i * 0.08, o.y + 0.2 + i * 0.08, 0.6 - i * 0.16, 0.6 - i * 0.16, 6, { t: '#3fbf4a', l: '#2e9a3a', r: '#237a2e' }, 8 + i * 6);
} });
L30.object('lego_arch', { w: 2, d: 1, solid: 0, tall: 1, draw: (o, K) => {   // входная арка LEGOLAND
  for (const px of [0.1, 1.7]) K.isoBox(o.x + px, o.y + 0.3, 0.2, 0.4, 26, { t: '#ffd23f', l: '#f5b800', r: '#d49a00' });
  const b = K.isoBox(o.x, o.y + 0.3, 2, 0.4, 7, { t: '#e8412c', l: '#d0302a', r: '#a52f24' }, 26);
  const [x, y] = K.onEdge(b.D, b.C, 0.5, 2); K.rect(x - 10, y - 4, 20, 4, '#fff'); for (let i = 0; i < 6; i++) K.rect(x - 9 + i * 3, y - 3, 2, 2, '#e8412c');
} });
L30.ground('Z', { c: '#3fae4a', side: ['#2e7a36', '#256a2e'], speck: '#5fce6a' });            // зелёная пластина LEGO

// ---- внешность второстепенных персонажей главы (заглушки)
CHARS.coach = { t: 'man', pal: { H: '#3a3a3a', S: '#efc6a5', E: '#1a1020', M: '#b87a6a', T: '#2e5fa8', J: '#2e5fa8', F: '#eeeeee' } };

L30.chapter({
  id: 'ch1',
  years: '1996–2011',
  title: 'Детство на Дыбенко',
  intro: 'Двор, братья, блинчики и Леголенд',
  look: 'kid',
  start: 'yard',
  cast: { coach: 'Тренер' },

  objectives: [
    { talk: 'roma', text: 'Найди братьев во дворе — начни с Ромы',
      say: ['Женя, ну наконец-то! Макс где-то у песочницы.', 'Втроём во дворе не соскучишься: то футбол у гаражей, то догонялки до самого метро.'] },
    { talk: 'max', text: 'Найди Макса у песочницы',
      say: ['Спорим, я быстрее пробегу круг?', 'Айда в манеж!'] },
    { visit: 'stadium', text: 'Иди в манеж (калитка справа во дворе)' },
    { talk: 'coach', text: 'Поговори с тренером',
      say: ['Ты что, Женя? Лёгкая атлетика — это тебе не во дворе бегать.', 'Ноги у тебя быстрые. Посмотрим, хватит ли дыхания на целый круг.', 'Давай: круг по дорожке манежа, через вираж — до финишной черты!'] },
    { use: 'finish', text: 'Пробеги круг по дорожке манежа до финиша',
      say: ['Финиш! Макс где-то сзади пыхтит.', '(Женя занимался лёгкой атлетикой — бегом)'] },
    { visit: 'flat', text: 'Беги домой — пора обедать' },
    { collect: 3, kind: 'grocery', text: 'Найди на кухне яйца, муку и молоко' },
    { use: 'stove', text: 'Испеки блинчики на плите',
      say: ['Шшш… Первый блин — комом.', 'Зато второй идеальный! Женя научился печь блинчики.', 'С тех пор блинчики — фирменное блюдо Жени.'] },
    { talk: 'papa', text: 'Папа хочет что-то сказать',
      say: ['Блинчики — огонь! А у нас новость: летим в Данию, в Леголенд!', 'Такси уже ждёт у метро.'] },
    { visit: 'legoland', text: 'Езжай в Леголенд — жёлтое такси у метро' },
    { collect: 3, kind: 'lego', text: 'Собери 3 кубика LEGO в Леголенде' },
    { talk: 'mama', text: 'Найди маму у входа в парк',
      say: ['Ну что, собрал? Вот это поездка!', 'Будет что рассказать во дворе!'] },
  ],
  done: 'Детство позади. Впереди — проспект Славы —',

  scenes: {
    // ---------------------------------------------------------------- двор
    yard: {
      title: 'Двор на Дыбенко',
      light: 'day',
      ground: [
        '....................',
        '....................',
        '####################',
        '...=......=.........',
        '...=......=....,....',
        '...=====..=.........',
        '..,....=..=========.',
        '....,,.=..::::....=.',
        '....,,.=..::::....=.',
        '.......=..::::....=.',
        '..=====...........=.',
        '..=.......,.......=.',
        '..=...............=.',
        '####################',
        '--------------------',
        '--------------------',
        '####################',
        '....................',
      ],
      objects: [
        'K.......K.......gggg',
        '...............T....',
        '...D.a.....L....P...',
        'T.........1.....o...',
        '..L..........?......',
        'T.....B............T',
        '....w.........T.....',
        '.T........s.....2...',
        '...............B...T',
        'T....o.........S....',
        '........T.....T.....',
        '.P......o.........T.',
        'T..L.........L...bZ.',
        '..M...q.....L.......',
        '......X.....c.......',
        '...............c....',
        '.L.......L.......L..',
        'T...T..E....T...T...',
      ],
      legend: {
        K: { obj: 'panel', w: 7, d: 2, h: 88, color: '#e6e2d8' },
        D: { door: 'flat', at: 'a', label: 'Квартира' },
        Z: { door: 'stadium', at: 'a', label: 'Манеж' },
        M: { obj: 'metro', w: 2, d: 1 },
        X: { obj: 'car', w: 2, d: 1, color: '#f4c20d', door: 'legoland', at: 'a', label: 'Такси в аэропорт — Леголенд' },
        a: { spawn: true }, b: { spawn: true }, q: { spawn: true },
      },
      npcs: [
        { who: 'roma', lines: ['Макс у песочницы!'] },
        { who: 'max', lines: ['Ещё забег?'] },
      ],
      memories: [
        { text: 'Детство на Дыбенко. Панельки, гаражи, метро «Улица Дыбенко» и два брата — Рома и Макс. Двор, где все друг друга знают.' },
      ],
    },

    // ---------------------------------------------------------------- квартира
    flat: {
      title: 'Квартира на Дыбенко',
      light: 'indoor',
      wall: { t: '#b8a98c', l: '#e2d9b8', r: '#cbbf9c', e: '#efe6c8' },
      ground: [
        'wwwwwwkkkk',
        'wwwwwwkkkk',
        'wwwwwwkkkk',
        'wwwwwwkkkk',
        'wwwwwwwwww',
        'wwwwwwwwww',
        'wwwwwwwwww',
        'wwwwwwwwww',
      ],
      objects: [
        'WWnWWWWnWW',
        'W.b.....OF',
        'n.......*.',
        'W..R....*.',
        'da....A...',
        'W..1...*..',
        'W....?....',
        'W........V',
      ],
      legend: {
        W: 'wall', n: 'wall_win', V: 'tv', F: 'fridge',
        b: { obj: 'bunkbed' },
        O: { obj: 'stove', spot: 'stove', label: 'Плита', say: ['Плита. Для блинчиков нужны яйца, мука и молоко.'] },
        A: { obj: 'table', cloth: '#f0e6d0' },
        R: { obj: 'rug', w: 3, d: 2, color: '#a33a3a' },
        d: { obj: 'wall_door', door: 'yard', at: 'a', label: 'Во двор' },
        a: { spawn: true },
      },
      item: { kind: 'grocery', name: 'продукты' },
      npcs: [
        { who: 'papa', lines: ['Чем это пахнет? Блинчиками?'] },
      ],
      memories: [
        { text: ['Женя научился печь блинчики!', 'Первый блин, конечно, комом. Зато потом — стопка до потолка.'] },
      ],
    },

    // ---------------------------------------------------------------- манеж (Зимний стадион)
    stadium: {
      title: 'Манеж · Зимний стадион',
      light: 'indoor',
      wall: { t: '#9a8f80', l: '#efe6d2', r: '#d9cfb9', e: '#fbf5e6' },
      ground: [
        'mmmmmmmmmmmmmmmmmm',
        'mmmmmmmmmmmmmmmmmm',
        'mmmmRRRRRRRRRRRmmm',
        'mmmRRRRRRRRRRRRRmm',
        'mmmRCCCCCCCCCCCRmm',
        'mmmRCCCCCCCCCCCRmm',
        'mmmRCCCCCCCCCCCRmm',
        'mmmRCCCCCCCCCCCRmm',
        'mmmRRRRRRRRRRRRRmm',
        'mmmmRRRRRRRRRRRmmm',
        'mmmmmmmmmmmmmmmmmm',
        'mmmmmmmmmmmmmmmmmm',
      ],
      objects: [
        'WnWnWnWnB.nWnWnWnW',
        'n.A.....J..A......',
        'W.b......f.....k..',
        'n.................',
        'W...G.............',
        'n?................',
        'W.................',
        'n.................',
        'W.....s...........',
        'n.....u...........',
        'd.a..1......?..hh.',
        'W.................',
      ],
      legend: {
        W: 'ch1_mwall', n: 'ch1_mwall_win',
        B: { obj: 'ch1_mwall_board', w: 2, d: 1 },
        A: { obj: 'ch1_stands', w: 6, d: 1 },
        J: 'ch1_judges',
        b: { obj: 'ch1_bank', w: 2, d: 8, side: 'l' },
        k: { obj: 'ch1_bank', w: 2, d: 8, side: 'r' },
        G: { obj: 'ch1_infield', w: 11, d: 4 },
        s: { obj: 'ch1_blocks', lane: 1 }, u: { obj: 'ch1_blocks', lane: 2 },
        h: 'ch1_hurdle',
        f: { obj: 'ch1_finish', w: 1, d: 2, spot: 'finish', auto: true, label: 'Финиш' },
        d: { obj: 'ch1_mwall_door', tall: 1, door: 'yard', at: 'b', label: 'Во двор' },   // tall: рисовать по глубине, а не как коврик
        a: { spawn: true },
      },
      npcs: [
        { who: 'coach', lines: ['Не стой — беги! На вираже не сбавляй.', 'Зимой — манеж, летом — стадион. Бегать надо круглый год!'] },
      ],
      memories: [
        { text: ['Лёгкая атлетика — бег. Зимой тренировались под крышей манежа: круг 200 метров, виражи с наклоном, стартовые колодки.', 'Тренер повторял: «Не стой — беги!» Женя запомнил это надолго.'] },
        { text: ['Зимний стадион — бывший Михайловский манеж на Манежной площади: длинный классический фасад Росси, а внутри — высокие арочные окна и фермы под потолком.', 'Под крышей манежа зима не страшна: круг за кругом, пока не прозвучит свисток.'] },
      ],
    },

    // ---------------------------------------------------------------- Леголенд
    legoland: {
      title: 'Леголенд, Дания',
      light: 'day',
      ground: [
        'ZZZZZZZZZZZZZZZZZZ',
        'ZZZZZZZZZZZZZZZZZZ',
        'ZZ##############ZZ',
        'ZZ#ZZZZZZZZZZZZ#ZZ',
        'ZZ#ZZZZZZZZZZZZ#ZZ',
        'ZZ#ZZZZ~~~~ZZZZ#ZZ',
        'ZZ#ZZZZ~~~~ZZZZ#ZZ',
        'ZZ#ZZZZZZZZZZZZ#ZZ',
        'ZZ#ZZZZZZZZZZZZ#ZZ',
        'ZZ##############ZZ',
        'ZZZZZZZZ##ZZZZZZZZ',
        'ZZZZZZZZ##ZZZZZZZZ',
        'ZZZZZZZZ##ZZZZZZZZ',
        'ZZZZZZZZ##ZZZZZZZZ',
      ],
      objects: [
        'h...h...h...h...h.',
        '..................',
        '..L.....1......L..',
        '...*..........?...',
        '..........k.......',
        '.....k............',
        '............*.....',
        '...k...2..........',
        '..............k...',
        '..B..........B....',
        '.*......A.........',
        '....k......k......',
        '........a.........',
        '........d.........',
      ],
      legend: {
        h: { obj: 'lego_house', w: 2, d: 2 },
        k: 'lego_tree',
        A: { obj: 'lego_arch', w: 2, d: 1 },
        d: { door: 'yard', at: 'q', label: 'Домой, на Дыбенко' },
        a: { spawn: true },
      },
      item: { kind: 'lego', name: 'кубик LEGO' },
      npcs: [
        { who: 'mama', lines: ['Смотри, какой Миниленд!'] },
        { who: 'papa', lines: ['Ещё один кубик — и домой!'] },
      ],
      memories: [
        { text: 'Леголенд в Дании! Целый город из кубиков. Дома из кубиков, машинки из кубиков — даже люди из кубиков!' },
      ],
    },
  },
});
