// =====================================================================
//  Библиотека объектов и типов земли (общая для всех глав).
//  Каждый объект: L30.object(id, { w, d, solid, light, draw(o, K) }).
//    w, d   — площадь в клетках (по умолчанию 1×1); legend может переопределить
//    solid  — 0, если сквозь объект можно ходить (ковёр, коврик у двери)
//    light  — 1, если ночью он светит (фонарь)
//    draw   — рисует объект; o = { x, y, w, d, seed, ...параметры из legend },
//             K — набор инструментов рисования (см. ENGINE.md).
//  Главы могут регистрировать свои объекты так же, в своих файлах.
// =====================================================================

// ---------------------------------------------------------------- ground types
L30.ground('.', { c: '#6fa64a', side: ['#6b4a2e', '#553a22'], tuft: '#5b9240' });
L30.ground(',', { c: '#6fa64a', side: ['#6b4a2e', '#553a22'], tuft: '#5b9240', flowers: ['#f4e04d', '#e86a8a', '#ffffff'] });
L30.ground('=', { c: '#b89062', side: ['#6b4a2e', '#553a22'], speck: '#a07a50' });
L30.ground('~', { c: '#3d8fd1', side: ['#2f6d9e', '#285a83'], speck: '#4ea2e6', water: 1 });
L30.ground('_', { c: '#5a5d6a', side: ['#3d3f48', '#33353d'], speck: '#4f525d' });
L30.ground('-', { c: '#5a5d6a', side: ['#3d3f48', '#33353d'], stripe: '#e8e8e8' });           // дорога с разметкой
L30.ground('#', { c: '#b7b2a6', side: ['#7d786e', '#6b675e'], grid: '#9e998e' });
L30.ground(':', { c: '#e6cf8f', side: ['#b89b5e', '#a0854f'], speck: '#d4bb78' });
L30.ground('F', { c: '#ffffff', side: ['#3d3f48', '#33353d'], checker: ['#141414', '#f2f2f2'] });
L30.ground('*', { c: '#f4f6fa', side: ['#9aa6b8', '#8592a6'], speck: '#dfe6f0' });            // снег
L30.ground('y', { c: '#c9b45a', side: ['#6b4a2e', '#553a22'], tuft: '#b39d44', speck: '#d9c76c' }); // высокая сухая трава
L30.ground('R', { c: '#b8473a', side: ['#6e2a22', '#5a221c'], grid: '#f0e6e0' });             // беговая дорожка
// interiors
L30.ground('w', { c: '#b98a5a', side: ['#6b4a2e', '#553a22'], planks: '#a37548' });             // паркет
L30.ground('k', { c: '#e8e4dc', side: ['#8a857a', '#77726a'], checker: ['#e8e4dc', '#c9c2b4'] }); // плитка кухни
l30Carpet('c', '#8a3a3a');                                                                       // ковролин
l30Carpet('b', '#3a5a8a');
L30.ground('l', { c: '#cfc9b8', side: ['#8a857a', '#77726a'], speck: '#bdb7a6' });              // линолеум
L30.ground('m', { c: '#d8d4cc', side: ['#8a857a', '#77726a'], grid: '#bfbab0' });              // светлая плитка/мрамор
function l30Carpet(ch, c) { L30.ground(ch, { c, side: ['#4a3a30', '#3a2e26'], speck: c }); }

// ---------------------------------------------------------------- exteriors
const WOOD = { t: '#a8743f', l: '#8a5a2e', r: '#734a25' };
L30.object('tree', { draw: (o, K) => { const [x, y] = K.base(o); K.rect(x - 1, y - 12, 3, 12, '#5a3a22'); K.disc(x, y - 21, 9, o.c || '#2f6b34'); K.disc(x - 2, y - 23, 7, o.c2 || '#3f8a3f'); K.disc(x - 3, y - 25, 3, '#58a64f'); } });
L30.object('pine', { draw: (o, K) => { const [x, y] = K.base(o); K.rect(x - 1, y - 6, 3, 6, '#5a3a22'); K.tri(x, y - 30, 10, 6, '#2a5e34'); K.tri(x, y - 23, 11, 8, '#2f6b3a'); K.tri(x, y - 15, 11, 10, '#357a40');
  if (K.scene.snow) { K.tri(x, y - 30, 4, 3, '#f4f6fa'); K.rect(x - 7, y - 16, 14, 1, '#f4f6fa'); } } });
L30.object('bush', { draw: (o, K) => { const [x, y] = K.base(o); K.disc(x, y - 4, 6, '#3a7f3c'); K.disc(x - 2, y - 6, 3, '#58a64f'); } });
L30.object('rock', { draw: (o, K) => { const [x, y] = K.base(o); K.disc(x, y - 3, 5, '#8a8d94'); K.disc(x - 1, y - 5, 3, '#a7aab1'); } });
L30.object('lamp', { light: 1, draw: (o, K) => { const [x, y] = K.base(o); K.rect(x, y - 24, 1, 24, '#2a2a33'); K.rect(x - 1, y - 26, 3, 2, K.night ? '#fff4c0' : '#d8d2b0'); K.rect(x - 2, y - 27, 5, 1, '#2a2a33'); } });
L30.object('bench', { draw: (o, K) => { K.isoBox(o.x + 0.15, o.y + 0.45, 0.7, 0.25, 4, WOOD); K.isoBox(o.x + 0.15, o.y + 0.38, 0.7, 0.07, 9, WOOD); } });
L30.object('palm', { draw: (o, K) => { const [x, y] = K.base(o); K.palm(x - 1, y, 14 + o.seed % 4); } });
L30.object('garage', { draw: (o, K) => { const doors = ['#5a7a5a', '#7a5a4a', '#4a5f7a', '#8a8f99'], dc = doors[o.seed % 4];
  const b = K.isoBox(o.x, o.y, 1, 1, 13, { t: '#7d828c', l: '#9aa0aa', r: '#6d727c', e: '#b0b5be' });
  K.faceUp(K.onEdge(b.D, b.C, 0.15, 0), K.onEdge(b.D, b.C, 0.85, 0), 10, dc); } });
L30.object('sandbox', { w: 2, d: 2, draw: (o, K) => { const b = K.isoBox(o.x + 0.1, o.y + 0.1, 1.8, 1.8, 3, { t: '#e6cf8f', l: '#a0643c', r: '#8a5530' });
  K.line(b.A[0], b.A[1] - 3, b.B[0], b.B[1] - 3, '#a0643c'); K.line(b.A[0], b.A[1] - 3, b.D[0], b.D[1] - 3, '#a0643c'); } });
L30.object('swing', { draw: (o, K) => { const l = K.P2(o.x + 0.2, o.y + 0.5), r = K.P2(o.x + 0.8, o.y + 0.5), sw = Math.round(Math.sin(K.tick / 25) * 3);
  K.rect(l[0], l[1] - 20, 1, 20, '#c0392b'); K.rect(r[0], r[1] - 20, 1, 20, '#c0392b'); K.line(l[0], l[1] - 20, r[0], r[1] - 20, '#8e2a20');
  const m1 = [l[0] + 4, l[1] - 20], m2 = [r[0] - 4, r[1] - 20];
  K.line(m1[0], m1[1], m1[0] + sw, m1[1] + 12, '#333'); K.line(m2[0], m2[1], m2[0] + sw, m2[1] + 12, '#333'); K.line(m1[0] + sw, m1[1] + 12, m2[0] + sw, m2[1] + 12, '#6b4423'); } });
L30.object('car', { w: 2, d: 1, draw: (o, K) => { const cols = ['#c0392b', '#2e86de', '#f5f5f5', '#27ae60', '#f39c12', '#34495e'], c = o.color || cols[o.seed % cols.length];
  const b = K.isoBox(o.x + 0.1, o.y + 0.25, 1.8, 0.55, 6, { t: c, l: K.shade(c, -0.1), r: K.shade(c, -0.3) }, 2);
  K.isoBox(o.x + 0.55, o.y + 0.3, 0.85, 0.45, 5, { t: K.shade(c, -0.05), l: '#9fc6e8', r: '#7ea6c8' }, 8);
  for (const [wx, wy] of [[0.4, 0.8], [1.6, 0.8]]) { const [x, y] = K.P2(o.x + wx, o.y + wy); K.rect(x - 2, y - 3, 4, 3, '#1a1a1a'); }
  if (K.night) { const [x, y] = K.onEdge(b.C, b.B, 0.5, 5); K.rect(x, y - 1, 2, 2, '#fff4c0'); } } });
L30.object('tires', { draw: (o, K) => { const [x, y] = K.base(o); for (let i = 0; i < 3; i++) { K.rect(x - 5, y - 4 - i * 4, 11, 4, '#1e1e22'); K.rect(x - 3, y - 3 - i * 4, 7, 1, '#3a3a42'); } } });
L30.object('crate', { draw: (o, K) => { K.isoBox(o.x + 0.15, o.y + 0.15, 0.7, 0.7, 11, { t: '#c8955a', l: '#a8743f', r: '#8a5a2e', e: '#d8a86a' }); } });
L30.object('house', { w: 2, d: 2, draw: (o, K) => { const wall = o.color || ['#e9d8a6', '#f4a261', '#e5989b', '#c9d6df'][o.seed % 4];
  const b = K.isoBox(o.x + 0.15, o.y + 0.15, o.w - 0.3, o.d - 0.3, o.h || 22, { t: wall, l: wall, r: K.shade(wall, -0.18), e: K.shade(wall, 0.2) });
  K.windows(b.D, b.C, 3, 2, 6, 9, K.night, o.seed); K.windows(b.C, b.B, 3, 2, 6, 9, K.night, o.seed + 1);
  K.isoBox(o.x, o.y, o.w, o.d, 4, { t: o.roof || '#7a3b2a', l: K.shade(o.roof || '#7a3b2a', 0.1), r: K.shade(o.roof || '#7a3b2a', -0.15) }, o.h || 22); } });
// панельный дом: legend может задать w, d, h (этажность ≈ h/9), color
L30.object('panel', { w: 8, d: 2, draw: (o, K) => { const h = o.h || 50, c = o.color || '#d8d2c4';
  const b = K.isoBox(o.x, o.y + 0.1, o.w, o.d - 0.2, h, { t: '#bdb7aa', l: c, r: K.shade(c, -0.15), e: K.shade(c, 0.15) });
  const fl = Math.floor((h - 8) / 9);
  K.windows(b.D, b.C, o.w * 2, fl, 9, 9, K.night, o.seed); K.windows(b.C, b.B, o.d * 2, fl, 9, 9, K.night, o.seed + 7);
  for (const t of (o.doors || [0.25, 0.62])) { const [x, y] = K.onEdge(b.D, b.C, t, 0); K.rect(x - 3, y - 9, 6, 9, '#4a3a2a'); K.rect(x - 5, y - 11, 10, 2, '#7d786e'); } } });
L30.object('uni', { w: 6, d: 2, draw: (o, K) => { const b = K.isoBox(o.x, o.y + 0.1, o.w, o.d - 0.2, 38, { t: '#a89a86', l: '#e4d6bc', r: '#c9bba2', e: '#f2e6cf' });
  K.windows(b.D, b.C, 10, 3, 14, 9, false, o.seed); K.windows(b.C, b.B, 3, 3, 14, 9, false, o.seed + 3); } });
L30.object('pit', { w: 3, d: 2, draw: (o, K) => { const b = K.isoBox(o.x, o.y + 0.1, o.w, o.d - 0.2, 20, { t: '#dcdcdc', l: '#f0f0f0', r: '#c8c8c8', e: '#ffffff' });
  for (let i = 0; i < 3; i++) K.faceUp(K.onEdge(b.D, b.C, i / 3 + 0.04, 0), K.onEdge(b.D, b.C, (i + 1) / 3 - 0.04, 0), 12, '#26262c');
  K.faceUp(K.onEdge(b.D, b.C, 0, 17), K.onEdge(b.D, b.C, 1, 17), 3, '#ff7a00'); } });
L30.object('palace', { w: 8, d: 2, draw: (o, K) => { const b = K.isoBox(o.x, o.y + 0.1, o.w, o.d - 0.2, 34, { t: '#e8e2d0', l: '#8fc0e3', r: '#6fa3c9', e: '#b8dcf2' });
  for (let i = 0; i < 24; i++) { const [x, y] = K.onEdge(b.D, b.C, (i + 0.5) / 24, 0); K.rect(x, y - 30, 1, 30, '#ffffff'); }
  K.windows(b.D, b.C, 12, 2, 8, 13, false, o.seed);
  for (const t of [0.15, 0.5, 0.85]) { const [x, y] = K.P2(o.x + t * o.w, o.y + 1, 34); K.disc(x, y - 4, 4, '#e8c04a'); K.rect(x, y - 11, 1, 4, '#e8c04a'); } } });
L30.object('bicycle', { draw: (o, K) => { const [x, y] = K.base(o), c = o.color || '#c0392b';
  for (const wx of [-5, 5]) { K.disc(x + wx, y - 4, 3, '#1a1a1a'); K.disc(x + wx, y - 4, 1, '#8d939b'); }
  K.line(x - 5, y - 4, x, y - 4, c); K.line(x - 5, y - 4, x - 1, y - 9, c); K.line(x - 1, y - 9, x + 4, y - 9, c); K.line(x + 4, y - 9, x + 5, y - 4, c); K.line(x - 1, y - 9, x, y - 4, c);
  K.rect(x - 2, y - 10, 3, 1, '#222'); K.rect(x + 3, y - 11, 3, 1, '#222'); } });
L30.object('umbrella', { solid: 0, draw: (o, K) => { const [x, y] = K.base(o); K.rect(x, y - 18, 1, 18, '#ddd');
  for (let r = 0; r < 6; r++) { const w = 2 + r * 2; for (let i = -w; i <= w; i++) K.rect(x + i, y - 24 + r, 1, 1, ((i + 40) >> 2) % 2 ? (o.color || '#e8412c') : '#fff'); } } });
L30.object('fence', { draw: (o, K) => { const a = K.P2(o.x, o.y + 0.5), b = K.P2(o.x + 1, o.y + 0.5);
  K.line(a[0], a[1] - 6, b[0], b[1] - 6, '#9aa0a8'); K.line(a[0], a[1] - 2, b[0], b[1] - 2, '#9aa0a8'); K.rect(a[0], a[1] - 7, 1, 7, '#7d828c'); } });
L30.object('flowerbed', { solid: 0, draw: (o, K) => { K.flat(o.x + 0.1, o.y + 0.1, o.w - 0.2, o.d - 0.2, '#5a3a22');
  const R = K.rng(o.seed); for (let i = 0; i < 8 * o.w * o.d; i++) { const [x, y] = K.P2(o.x + 0.2 + R() * (o.w - 0.4), o.y + 0.2 + R() * (o.d - 0.4)); K.rect(x, y - 2, 1, 2, '#3f8a3f'); K.rect(x, y - 3, 1, 1, ['#e86a8a', '#f4e04d', '#ffffff'][i % 3]); } } });

// ---------------------------------------------------------------- interiors
// Стены интерьера ставятся по ДАЛЬНИМ краям комнаты (верхний ряд и левый столбец карты),
// ближние края оставляем открытыми — получается «срез», как в The Sims / Don't Starve.
const wallCol = K => K.scene.wall || { t: '#cfc6b6', l: '#ece4d4', r: '#d6ccba', e: '#f6efe2' };
function l30Wall(o, K, extra) {
  const c = wallCol(K), h = o.h || 30, b = K.isoBox(o.x, o.y, 1, 1, h, c);
  K.faceUp(b.D, b.C, 2, K.shade(c.l, -0.25)); K.faceUp(b.C, b.B, 2, K.shade(c.r, -0.25));
  if (extra) extra(b, h, c); return b;
}
L30.object('wall', { draw: (o, K) => l30Wall(o, K) });
L30.object('wall_win', { draw: (o, K) => l30Wall(o, K, (b, h) => {
  for (const [a, c] of [[b.D, b.C], [b.C, b.B]]) { K.faceUp(K.onEdge(a, c, 0.2, 10), K.onEdge(a, c, 0.8, 10), 13, '#e8e2d4'); K.faceUp(K.onEdge(a, c, 0.26, 11), K.onEdge(a, c, 0.74, 11), 11, K.night ? '#1d2550' : '#9fd0f0'); } }) });
L30.object('wall_carpet', { draw: (o, K) => l30Wall(o, K, (b) => {
  for (const [a, c] of [[b.D, b.C], [b.C, b.B]]) { K.faceUp(K.onEdge(a, c, 0.05, 6), K.onEdge(a, c, 0.95, 6), 20, '#7a1f24');
    for (let i = 0; i < 4; i++) { const [x, y] = K.onEdge(a, c, 0.2 + i * 0.2, 14); K.rect(x - 1, y - 2, 3, 3, '#d9b46a'); } } }) });
L30.object('wall_poster', { draw: (o, K) => l30Wall(o, K, (b) => {
  for (const [a, c] of [[b.D, b.C], [b.C, b.B]]) { K.faceUp(K.onEdge(a, c, 0.3, 12), K.onEdge(a, c, 0.7, 12), 12, o.color || '#e8412c'); } }) });
L30.object('wall_door', { solid: 0, draw: (o, K) => l30Wall(o, K, (b) => {
  for (const [a, c] of [[b.D, b.C], [b.C, b.B]]) { K.faceUp(K.onEdge(a, c, 0.2, 0), K.onEdge(a, c, 0.8, 0), 22, '#6b4a2e'); K.faceUp(K.onEdge(a, c, 0.25, 0), K.onEdge(a, c, 0.75, 0), 20, '#3a2618'); } }) });
L30.object('doormat', { solid: 0, draw: (o, K) => { K.flat(o.x + 0.15, o.y + 0.15, 0.7, 0.7, o.color || '#6b4a2e'); } });
L30.object('rug', { solid: 0, draw: (o, K) => { const c = o.color || '#a33a3a'; K.flat(o.x + 0.1, o.y + 0.1, o.w - 0.2, o.d - 0.2, K.shade(c, -0.2)); K.flat(o.x + 0.25, o.y + 0.25, o.w - 0.5, o.d - 0.5, c); } });
L30.object('bed', { w: 1, d: 2, draw: (o, K) => { const bl = o.color || '#4a7ab8';
  K.isoBox(o.x + 0.05, o.y + 0.05, o.w - 0.1, o.d - 0.1, 5, WOOD); K.isoBox(o.x + 0.1, o.y + 0.1, o.w - 0.2, o.d - 0.2, 3, { t: '#f4f4f0', l: '#e4e4e0', r: '#d0d0cc' }, 5);
  K.isoBox(o.x + 0.1, o.y + 0.7, o.w - 0.2, o.d - 0.8, 2, { t: bl, l: K.shade(bl, -0.1), r: K.shade(bl, -0.25) }, 8);
  K.isoBox(o.x + 0.05, o.y + 0.02, o.w - 0.1, 0.1, 12, WOOD); } });
L30.object('bunkbed', { w: 1, d: 2, draw: (o, K) => {
  for (const [z, bl] of [[0, '#4a7ab8'], [16, '#c0392b']]) { K.isoBox(o.x + 0.05, o.y + 0.05, 0.9, 1.9, 3, WOOD, z); K.isoBox(o.x + 0.1, o.y + 0.6, 0.8, 1.3, 2, { t: bl, l: K.shade(bl, -0.1), r: K.shade(bl, -0.25) }, z + 3); }
  for (const [px, py] of [[0.05, 0.05], [0.95, 0.05], [0.05, 1.95], [0.95, 1.95]]) { const [x, y] = K.P2(o.x + px, o.y + py); K.rect(x, y - 24, 1, 24, '#734a25'); } } });
L30.object('sofa', { w: 2, d: 1, draw: (o, K) => { const c = o.color || '#c9b89a';
  const col = { t: c, l: K.shade(c, -0.08), r: K.shade(c, -0.22) };
  K.isoBox(o.x + 0.05, o.y + 0.15, o.w - 0.1, o.d - 0.25, 6, col); K.isoBox(o.x + 0.05, o.y + 0.1, o.w - 0.1, 0.25, 13, col);
  K.isoBox(o.x + 0.05, o.y + 0.1, 0.18, o.d - 0.2, 9, col); K.isoBox(o.x + o.w - 0.23, o.y + 0.1, 0.18, o.d - 0.2, 9, col); } });
L30.object('table', { draw: (o, K) => { const c = o.color || '#8a5a2e';
  for (const [px, py] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) { const [x, y] = K.P2(o.x + px * o.w, o.y + py * o.d); K.rect(x, y - 9, 1, 9, K.shade(c, -0.3)); }
  K.isoBox(o.x + 0.08, o.y + 0.08, o.w - 0.16, o.d - 0.16, 2, { t: c, l: K.shade(c, -0.15), r: K.shade(c, -0.3) }, 9);
  if (o.cloth) K.flat(o.x + 0.15, o.y + 0.15, o.w - 0.3, o.d - 0.3, o.cloth, 11); } });
L30.object('chair', { draw: (o, K) => { K.isoBox(o.x + 0.3, o.y + 0.3, 0.4, 0.4, 2, WOOD, 6); K.isoBox(o.x + 0.3, o.y + 0.28, 0.4, 0.06, 8, WOOD, 6);
  const [x, y] = K.P2(o.x + 0.5, o.y + 0.5); K.rect(x, y - 6, 1, 6, '#5a3a22'); } });
L30.object('tv', { draw: (o, K) => { K.isoBox(o.x + 0.1, o.y + 0.3, 0.8, 0.4, 7, { t: '#3a3a42', l: '#2a2a30', r: '#1e1e24' });
  const b = K.isoBox(o.x + 0.15, o.y + 0.4, 0.7, 0.06, 12, { t: '#111', l: '#111', r: '#111' }, 7);
  K.faceUp(K.onEdge(b.D, b.C, 0.1, 8), K.onEdge(b.D, b.C, 0.9, 8), 9, (K.tick >> 5) % 2 ? '#3a8ad6' : '#e8412c'); } });
L30.object('stove', { draw: (o, K) => { const b = K.isoBox(o.x + 0.1, o.y + 0.1, 0.8, 0.8, 14, { t: '#2a2a2e', l: '#f0f0f0', r: '#d0d0d0' });
  for (const [px, py] of [[0.35, 0.35], [0.65, 0.35], [0.35, 0.65], [0.65, 0.65]]) { const [x, y] = K.P2(o.x + px, o.y + py, 14); K.rect(x - 1, y - 1, 3, 2, o.on ? '#ff6a2a' : '#555'); }
  K.faceUp(K.onEdge(b.D, b.C, 0.2, 3), K.onEdge(b.D, b.C, 0.8, 3), 6, '#222'); } });
L30.object('fridge', { draw: (o, K) => { const b = K.isoBox(o.x + 0.12, o.y + 0.12, 0.76, 0.76, 28, { t: '#e8eaee', l: '#f6f7f9', r: '#d8dbe0', e: '#ffffff' });
  K.line(K.onEdge(b.D, b.C, 0, 17)[0], K.onEdge(b.D, b.C, 0, 17)[1], K.onEdge(b.D, b.C, 1, 17)[0], K.onEdge(b.D, b.C, 1, 17)[1], '#b8bcc4');
  const [hx, hy] = K.onEdge(b.D, b.C, 0.85, 20); K.rect(hx, hy - 4, 1, 4, '#888'); } });
L30.object('counter', { draw: (o, K) => { K.isoBox(o.x + 0.05, o.y + 0.1, o.w - 0.1, o.d - 0.2, 14, { t: o.top || '#d8d0c0', l: o.color || '#a8743f', r: K.shade(o.color || '#a8743f', -0.2) }); } });
L30.object('sink', { draw: (o, K) => { K.isoBox(o.x + 0.05, o.y + 0.1, 0.9, 0.8, 14, { t: '#d8d0c0', l: '#a8743f', r: '#8a5a2e' }); K.flat(o.x + 0.25, o.y + 0.3, 0.5, 0.4, '#9aa6b4', 14); const [x, y] = K.P2(o.x + 0.5, o.y + 0.25, 14); K.rect(x, y - 4, 1, 4, '#bbb'); } });
L30.object('desk_pc', { w: 1, d: 1, draw: (o, K) => {
  K.isoBox(o.x + 0.05, o.y + 0.1, o.w - 0.1, o.d - 0.2, 2, WOOD, 10); for (const px of [0.1, 0.9]) { const [x, y] = K.P2(o.x + px * o.w, o.y + 0.85 * o.d); K.rect(x, y - 10, 1, 10, '#5a3a22'); }
  const b = K.isoBox(o.x + 0.3, o.y + 0.25, 0.4, 0.05, 9, { t: '#111', l: '#111', r: '#111' }, 13);
  K.faceUp(K.onEdge(b.D, b.C, 0.08, 7), K.onEdge(b.D, b.C, 0.92, 7), 7, o.screen || '#2a6ad6');
  const [sx, sy] = K.onEdge(b.D, b.C, 0.5, 10); K.rect(sx - 2, sy, 4, 1, '#e8412c'); } });
L30.object('shelf', { draw: (o, K) => { const b = K.isoBox(o.x + 0.1, o.y + 0.25, 0.8, 0.5, 28, WOOD);
  const R = K.rng(o.seed); for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) { const [x, y] = K.onEdge(b.D, b.C, 0.12 + i * 0.18, 3 + r * 7); K.rect(x, y - 5, 2, 5, ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#ecf0f1'][(R() * 5) | 0]); } } });
L30.object('wardrobe', { draw: (o, K) => { const b = K.isoBox(o.x + 0.08, o.y + 0.2, 0.84, 0.6, 30, { t: '#9a6a3c', l: '#b07a48', r: '#8a5a2e' });
  const [x, y] = K.onEdge(b.D, b.C, 0.5, 15); K.rect(x, y - 12, 1, 24, '#6b4423'); } });
L30.object('xmas', { draw: (o, K) => { const [x, y] = K.base(o); K.rect(x - 1, y - 4, 3, 4, '#6b4423');
  K.tri(x, y - 30, 9, 5, '#1e5a2e'); K.tri(x, y - 23, 10, 7, '#236834'); K.tri(x, y - 15, 11, 9, '#2a7a3c'); K.rect(x - 1, y - 32, 3, 3, '#ffd23f');
  const R = K.rng(o.seed + (K.tick >> 4)); for (let i = 0; i < 9; i++) K.rect(x - 7 + R() * 14, y - 26 + R() * 20, 1, 1, ['#ff4a4a', '#ffd23f', '#4ac0ff', '#fff'][i % 4]); } });
L30.object('billiard', { w: 2, d: 1, draw: (o, K) => { const b = K.isoBox(o.x + 0.05, o.y + 0.1, o.w - 0.1, o.d - 0.2, 10, { t: '#5a3a22', l: '#6b4423', r: '#4a2e18' });
  K.flat(o.x + 0.15, o.y + 0.2, o.w - 0.3, o.d - 0.4, '#1f7a3a', 10);
  for (const [px, py, c] of [[0.6, 0.5, '#fff'], [1.2, 0.45, '#e8412c'], [1.3, 0.6, '#ffd23f'], [1.4, 0.4, '#2e86de']]) { const [x, y] = K.P2(o.x + px, o.y + py, 11); K.rect(x, y - 1, 2, 2, c); } } });
L30.object('bar', { draw: (o, K) => { K.isoBox(o.x + 0.05, o.y + 0.2, o.w - 0.1, o.d - 0.4, 16, { t: '#3a2618', l: '#6b4423', r: '#4a2e18' }); } });
L30.object('hookah', { draw: (o, K) => { const [x, y] = K.base(o); K.disc(x, y - 4, 3, '#4a8ad6'); K.rect(x, y - 16, 1, 10, '#c0a060'); K.rect(x - 2, y - 18, 5, 2, '#8a5a2e');
  K.line(x, y - 9, x + 6, y - 2, '#333'); if ((K.tick >> 3) % 6 === 0) K.rect(x + Math.random() * 4 - 2, y - 22 - Math.random() * 6, 2, 2, '#ddd'); } });
L30.object('plant', { draw: (o, K) => { const [x, y] = K.base(o); K.rect(x - 3, y - 5, 7, 5, '#b85a3a'); K.disc(x, y - 10, 5, '#3a7f3c'); K.disc(x + 2, y - 13, 3, '#58a64f'); } });
L30.object('bath', { w: 1, d: 2, draw: (o, K) => { K.isoBox(o.x + 0.08, o.y + 0.08, o.w - 0.16, o.d - 0.16, 9, { t: '#ffffff', l: '#f2f4f6', r: '#dde2e8' }); K.flat(o.x + 0.2, o.y + 0.2, o.w - 0.4, o.d - 0.4, '#9fd0f0', 9); } });
L30.object('boxes', { draw: (o, K) => { K.isoBox(o.x + 0.1, o.y + 0.15, 0.55, 0.55, 8, { t: '#d9b07a', l: '#c49a66', r: '#a88050' }); K.isoBox(o.x + 0.4, o.y + 0.35, 0.5, 0.5, 7, { t: '#d9b07a', l: '#c49a66', r: '#a88050' }); K.isoBox(o.x + 0.2, o.y + 0.25, 0.4, 0.4, 6, { t: '#e2bd8a', l: '#c49a66', r: '#a88050' }, 8); } });
L30.object('gift', { draw: (o, K) => { const c = o.color || '#e8412c'; const b = K.isoBox(o.x + 0.3, o.y + 0.3, 0.4, 0.4, 7, { t: c, l: K.shade(c, -0.1), r: K.shade(c, -0.25) }); const [x, y] = K.P2(o.x + 0.5, o.y + 0.5, 7); K.rect(x - 1, y - 2, 3, 2, '#ffd23f'); } });
L30.object('mangal', { draw: (o, K) => { K.isoBox(o.x + 0.15, o.y + 0.35, 0.7, 0.3, 5, { t: '#2a2a2e', l: '#3a3a40', r: '#26262a' }, 6);
  for (const px of [0.2, 0.8]) { const [x, y] = K.P2(o.x + px, o.y + 0.6); K.rect(x, y - 6, 1, 6, '#333'); }
  const [x, y] = K.P2(o.x + 0.5, o.y + 0.5, 11); K.rect(x - 5, y - 1, 10, 1, (K.tick >> 3) % 2 ? '#ff6a2a' : '#ffaa3a');
  if ((K.tick >> 2) % 5 === 0) K.rect(x - 3 + Math.random() * 6, y - 6 - Math.random() * 10, 2, 2, '#ccc'); } });
L30.object('radiator', { draw: (o, K) => { const b = K.isoBox(o.x + 0.2, o.y + 0.4, 0.6, 0.2, 10, { t: '#f4f4f4', l: '#ffffff', r: '#dcdcdc' }); for (let i = 1; i < 5; i++) { const [x, y] = K.onEdge(b.D, b.C, i / 5, 0); K.rect(x, y - 10, 1, 10, '#cfcfcf'); } } });
