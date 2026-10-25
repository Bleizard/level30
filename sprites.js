// =====================================================================
//  Общие утилиты и спрайты (скопированы из платформера ../index.html,
//  чтобы изометрическая версия была самодостаточной). Классический скрипт: всё, что
//  объявлено здесь на верхнем уровне, видно в game.js.
// =====================================================================
'use strict';
const S = window.STORY;
const W = 320, H = 180;                     // internal resolution
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const $ = id => document.getElementById(id);
const params = new URLSearchParams(window.L30_PUBLIC ? '' : location.search);   // public build: no debug URL params

// ---------------------------------------------------------------- utils
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = c => `rgb(${c.map(Math.round).join(',')})`;
const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function disc(cx, cy, r, c) { ctx.fillStyle = c; for (let dy = -r; dy <= r; dy++) {
  const hw = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1); } }

// tiny 3x5 pixel font (digits and a few symbols)
const FONT = { '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111',
  '4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111',
  '9':'111101111001111','?':'111001011000010','!':'010010010000010' };
function pixText(s, x, y, c, sc = 1) { ctx.fillStyle = c; [...String(s)].forEach((ch, i) => { const g = FONT[ch]; if (!g) return;
  for (let p = 0; p < 15; p++) if (g[p] === '1') ctx.fillRect(Math.round(x + i * 4 * sc + (p % 3) * sc), Math.round(y + (p / 3 | 0) * sc), sc, sc); }); }
const pixTextW = (s, sc = 1) => String(s).length * 4 * sc - sc;

// ---------------------------------------------------------------- sprites
const sprCache = new Map();
function sprite(rows, pal) {
  const key = rows.join('|') + JSON.stringify(pal);
  if (sprCache.has(key)) return sprCache.get(key);
  const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
  sprCache.set(key, c); return c;
}
function draw(c, x, y, flip) {
  x = Math.round(x); y = Math.round(y);
  if (!flip) return ctx.drawImage(c, x, y);
  ctx.save(); ctx.translate(x + c.width, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore();
}

// Hero looks, drawn from photos (facing right). Each look = body rows + legs per animation frame.
const LEGS_ADULT = {
  stand: ['...JJJJJJ...', '...JJ..JJ...', '...JJ..JJ...', '...FF..FFF..'],
  walk1: ['...JJJJJJ...', '..JJ....JJ..', '.JJ......JJ.', '.FF......FFF'],
  walk2: ['...JJJJJJ...', '....JJJJ....', '....JJ.J....', '....FFFFF...'],
  jump:  ['...JJJJJJ...', '..JJ...JJJ..', '..JJ.....JF.', '..FF......F.'],
};
const LOOKS = {
  // детство: пышная каштановая чёлка, красная куртка с белой полоской
  kid: {
    rows: ['..HHHHHH....', '.HHHHHHHHH..', 'HHHHHHHHHHH.', '.HHHHHHHHHHH', '.HHHSSSHHHS.', '..HHSSESSES.',
           '..HSSSSSSSS.', '...SSSSSMS..', '...RRDDDRR..', '..RRRDDDRRR.', '..RwRRDRRRR.', '..SRRRRRRRS.'],
    legs: { stand: ['...JJ..JJ...', '...FF..FFF..'], walk1: ['..JJ....JJ..', '.FF......FF.'],
            walk2: ['....JJJJ....', '....FFFFF...'], jump: ['..JJ...JJF..', '..FF........'] },
    pal: { H: '#5a3a24', S: '#f0c9a8', E: '#1a1020', M: '#c97a6a', R: '#b3232f', D: '#2a2a33', w: '#f0f0f0', J: '#2b3550', F: '#3a2a20' },
  },
  // подросток (~2012–2015): взъерошенные рыжевато-каштановые вихры, лёгкая щетина, толстый тёмный шарф,
  // пухлый серо-сиреневый пуховик со стёжкой, тёмные джинсы, кроссовки
  teen14: {
    rows: ['..H.HhH.H...', '..HHHHHHHH..', '.HHhHHHHhHH.', '..HHHHSHSSS.', '..HHSSSSSSS.', '..HSSSESSES.',
           '..HSSSSSSSS.', '...sSSSSSSS.', '...ssSSSMS..', '....KKKKK...', '...KKKKKKK..',
           '.DDDKKKKDDD.', '.DDDDDKDDDD.', '.dddddddddd.', '.DDDDDDDDDD.', '.SddddddddS.'],
    legs: LEGS_ADULT,
    pal: { H: '#8a4a2e', h: '#a8603a', S: '#efc6a5', E: '#1a1020', s: '#d8b090', M: '#c98a7a', K: '#1e1e24',
           D: '#9a92a8', d: '#7a7288', J: '#2a3048', F: '#d8d8d8' },
  },
  // первый курс (2015): аккуратный короткий кок назад, короткие виски, без очков, короткая борода по линии
  // челюсти, тёмная рубашка на пуговицах, тёмные брюки и туфли
  student: {
    rows: ['.....HHHH...', '....HHHHHH..', '...HHHHHHHH.', '..hHHHSSSSS.', '..hHSSSSSSS.', '..hSSSESSES.',
           '..BSSSSSSSS.', '...BSSSSSSS.', '...BBSSMMS..', '....BBBBB...', '.....SSS....',
           '...TTtStTT..', '..TTTTtTTTT.', '..TTTTtTTTT.', '..TTTTtTTTT.', '..STTTtTTTS.'],
    legs: LEGS_ADULT,
    pal: { H: '#2a1d17', h: '#4a3a30', S: '#efc6a5', E: '#1a1020', B: '#2e2018', M: '#c98a7a', T: '#1e2226', t: '#33393f',
           J: '#22252c', F: '#141416' },
  },
  // юность: лохматые тёмные волосы, щетина, клетчатая рубашка, бабочка, рыжий плащ, джинсы, бежевые кроссы
  teen: {
    rows: ['...H.HH.H...', '..HHHHHHHH..', '.HHHHHHHHHH.', '.HHHHHHHHHHH', '.HHHSSHSSSH.', '..HHSSESSES.',
           '..HHSSSSSSS.', '...HSSSSSSS.', '....bSSMMSb.', '.....bbbbb..', '.....SSS....',
           '..CCWXKXWCC.', '.CCCwWwWwCCC', '.CCCWwWwWCCC', '.CcCwWwWwCcC', '.SCCJJJJJCCS'],
    legs: LEGS_ADULT,
    pal: { H: '#2a1d17', S: '#efc6a5', E: '#1a1020', b: '#8a6a56', M: '#c98a7a', C: '#9c4636', c: '#7d3528',
           W: '#e8e8ee', w: '#8f93a3', X: '#111', K: '#3a3a3a', J: '#4f74a8', F: '#d2a46b' },
  },
  // почти лысый (май 2019, после неудачной стрижки на балконе): как «3 курс», но голова под машинку —
  // кожа черепа с редкой тёмной щетиной, видны уши
  buzz: {
    rows: ['............', '....zSzzS...', '...SzSzSzS..', '..SzSzSzSzS.', '..SzSSSSSSS.', '..zeSSESSES.',
           '..SeSSSSSSS.', '...zSSSSSSS.', '....bSSMMSb.', '.....bbbbb..', '.....SSS....',
           '..CCWXKXWCC.', '.CCCwWwWwCCC', '.CCCWwWwWCCC', '.CcCwWwWwCcC', '.SCCJJJJJCCS'],
    legs: LEGS_ADULT,
    pal: { z: '#5a4a40', e: '#d9a888', S: '#efc6a5', E: '#1a1020', b: '#8a6a56', M: '#c98a7a', C: '#9c4636', c: '#7d3528',
           W: '#e8e8ee', w: '#8f93a3', X: '#111', K: '#3a3a3a', J: '#4f74a8', F: '#d2a46b' },
  },
  // сейчас: длинные волосы в хвост, очки, борода, тёмная футболка, тату-роза на руке
  now: {
    rows: ['....HHHHH...', '...HHHHHHH..', '..HHHHHHHHH.', '.HHHHSSSSSS.', '.HHHSGGGGGG.', 'HHHHGLEGLEG.',
           '.HHHSGGSGGS.', '.HH.BSSBBBS.', '.HH.BBBMMBB.', '..H..BBBBB..', '.....SSS....',
           '...TTTTTTT..', '..TTTTTTTTT.', '..STTTTTTTS.', '..STtTTTTTR.', '..STTTTTTTS.'],
    legs: LEGS_ADULT,
    pal: { H: '#2b1e18', S: '#efc8aa', G: '#2d2d38', L: '#e4eef2', E: '#1a1020', B: '#4a3226', M: '#d4948a', T: '#4b4452', t: '#3b3542',
           R: '#2e2a3a', J: '#33405a', F: '#e6e1d6' },
  },
  // Новый год 2017: короткие тёмные волосы, красные блестящие очки-рожки оленя с веточкой остролиста,
  // лёгкая щетина, тёмно-серая футболка с принтом-астронавтом, тёмные брюки
  ny2017: {
    rows: ['..R.R..R.R..', '...RR.gRR...', '....HHHHH...', '...HHHHHHHH.', '..HHHHHHHHH.', '..hHHSSSSSS.',
           '..HSRRRRRRR.', '..HSRLERLER.', '..hSSRRSRRS.', '...sSSSSSSS.', '...ssssMMs..', '....sssss...',
           '.....SSS....', '...TTTTTTT..', '..TTTWWWTTT.', '..STTWvWTTS.', '..STTWWWTTS.', '..STTTTTTTS.'],
    legs: LEGS_ADULT,
    pal: { R: '#d42a2a', g: '#2a9a3a', H: '#2a1d17', h: '#4a3a30', S: '#efc6a5', L: '#e4eef2', E: '#1a1020', s: '#cfa486',
           M: '#c98a7a', T: '#4a4a50', W: '#e8e8ee', v: '#3a5a8a', J: '#2a2a33', F: '#1a1a1e' },
  },
  // свадьба: волосы в пучок с тонким чёрным ободком, круглые очки, короткая борода,
  // белая рубашка-стойка с длинным рукавом, чёрные брюки и туфли
  wedding: {
    rows: ['.HH.HHKHH...', 'HHHHHKHHHH..', '.HHHHKHHHHH.', '..HHKSSSSSS.', '..HHSGGSGGS.', '..HSGLEGLEG.',
           '..HSSGGSGGS.', '...SBSSBBBS.', '....BBBMMBB.', '.....BBBBB..', '.....wWw....',
           '...WWWWWWW..', '..WWWWwWWWW.', '..WWWWwWWWW.', '..wWWWwWWWw.', '..SWWWWWWWS.'],
    legs: LEGS_ADULT,
    pal: { H: '#2b1e18', K: '#050505', S: '#efc8aa', G: '#111114', L: '#e4eef2', E: '#1a1020', B: '#4a3226', M: '#d4948a',
           W: '#f6f6f2', w: '#d2d2cc', J: '#1a1a20', F: '#0c0c0e' },
  },
  // зима в деревне: меховая ушанка с опущенными ушами, волнистые волосы из-под неё, круглые очки,
  // широкая улыбка, чёрно-синий камуфляжный свитшот с белой полосой VICIOUS, чёрные штаны, валенки
  winter: {
    rows: ['...UUUUUU...', '..UUuUUUUU..', '.UUUUUUUUUU.', '.uUUUUUUUUu.', '.HHUSGGSGGS.', '.HHUGLEGLEG.',
           '.HHUSGGSGGS.', 'HHHuBSSBBBS.', '.HH.BMwwwMB.', 'HH...BBBBB..', '.H...SSS....',
           '...CcCCcCC..', '..cVKVVKVVC.', '..CcCCCcCcC.', '..cCcCCCcCc.', '..SCCcCCcCS.'],
    legs: {
      stand: ['...JJJJJJ...', '...JJ..JJ...', '...FF..FF...', '...FF..FFF..'],
      walk1: ['...JJJJJJ...', '..JJ....JJ..', '.FF......FF.', '.FF......FFF'],
      walk2: ['...JJJJJJ...', '....JJJJ....', '....FF.F....', '....FFFFF...'],
      jump:  ['...JJJJJJ...', '..JJ...JJJ..', '..FF.....FF.', '..FF......F.'],
    },
    pal: { U: '#7a5232', u: '#5a3a22', H: '#2b1e18', S: '#efc8aa', G: '#111114', L: '#e4eef2', E: '#1a1020', B: '#4a3226',
           M: '#8a3a3a', w: '#ffffff', C: '#1a1c22', c: '#3a5a9a', V: '#eeeeee', K: '#1a1a1a', J: '#141418', F: '#2e2e33' },
  },
  // Новый год: розовый пушистый ободок с глазками-рожками улитки, очки, борода, чёрный кожаный жилет
  // на молнии, голые руки, чёрный ошейник-бабочка с заклёпками, чёрные брюки, бокал пива в руке
  party: {
    rows: ['...WE....WE.', '...P.....P..', '....P...P...', '...pPPPPPp..', '...HHHHHHH..', '..HHHHHHHHH.',
           '.HHHHSSSSSS.', '.HHHSGGGGGG.', 'HHHHGLEGLEG.', '.HHHSGGSGGS.', '.HH.BSSBBBS.', '.HH.BBBMMBB.',
           '..H..BBBBB..', '.....ZKZ....', '...SVKZKVS..', '..SVVVZVVVSw', '..SVvVZVVVRA', '..SVVVZVVVSA',
           '..SVVVZVVVSA'],
    legs: LEGS_ADULT,
    pal: { W: '#ffffff', E: '#1a1020', P: '#f27ab0', p: '#ffb3d6', H: '#2b1e18', S: '#efc8aa', G: '#2d2d38', L: '#e4eef2',
           B: '#4a3226', M: '#d4948a', Z: '#c8ccd4', K: '#0a0a0a', V: '#26262c', v: '#4a4a56', R: '#2e2a3a',
           w: '#fff6dc', A: '#e0a020', J: '#1e1e24', F: '#141416' },
  },
};
const lookOf = r => r.look || (r.kid ? 'kid' : 'now');
const heroH = look => LOOKS[look].rows.length + LOOKS[look].legs.stand.length;
function heroSprite(look, frame) { const L = LOOKS[look] || LOOKS.now; return sprite([...L.rows, ...L.legs[frame]], L.pal); }

// Other characters: a body template + palette. People are placeholders until we get their photos.
const TEMPLATES = {
  woman: { rows: ['....HHHHH...', '...HHHHHHH..', '..HHHHHHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
                  '.HHHSSSSSSS.', '.HHHSSSSMSS.', '.HHH.SSSS...', '.HHH..SS....', '.HHTTTTTTT..',
                  '..TTTTTTTTT.', '..STTTTTTTS.', '..STTTTTTTS.', '..STTTTTTTS.', '..TTTTTTTTT.'], legs: LEGS_ADULT },
  man:   { rows: ['....HHHH....', '...HHHHHHH..', '..HHHHHHHHH.', '..HHHHHHHHH.', '..HHSSSSSSS.', '..HSSSESSES.',
                  '..HSSSSSSSS.', '...SSSSSMSS.', '....SSSSS...', '.....SSS....', '...TTTTTTT..',
                  '..TTTTTTTTT.', '..STTTTTTTS.', '..STTTTTTTS.', '..STTTTTTTS.', '..TTTTTTTTT.'], legs: LEGS_ADULT },
  child: { rows: LOOKS.kid.rows, legs: LOOKS.kid.legs },
  // dog from the photo: ginger with a white chest, muzzle and paws
  dog:   { rows: ['..........O..O', '..........OOOO', '.T........OWEO', '.T.......OWWWN', '..T......OWWW.',
                  '..OOOOOOOOWW..', '..OOOOOOOWWW..', '..OOOOOOOWW...'],
           legs: { stand: ['..W.W....W.W..', '..W.W....W.W..'], walk1: ['.W...W..W...W.', 'W.....W.W....W'],
                   walk2: ['...WW....WW...', '...WW....WW...'], jump: ['.W...W..W...W.', '..............'] } },
};
// Cast drawn from photos (approved): own rows + legs + palette, same 12×20 format as the hero.
const CAST_LEGS = {
  pants: {
    stand: ['...JJJJJJ...', '...JJ..JJ...', '...JJ..JJ...', '...FF..FFF..'],
    walk1: ['...JJJJJJ...', '..JJ....JJ..', '.JJ......JJ.', '.FF......FFF'],
    walk2: ['...JJJJJJ...', '....JJJJ....', '....JJ.J....', '....FFFFF...'],
    jump:  ['...JJJJJJ...', '..JJ...JJJ..', '..JJ.....JF.', '..FF......F.'],
  },
  // шорты: голени видны
  shorts: {
    stand: ['...JJJJJJ...', '...JJ..JJ...', '...SS..SS...', '...FF..FFF..'],
    walk1: ['...JJJJJJ...', '..JJ....JJ..', '.SS......SS.', '.FF......FFF'],
    walk2: ['...JJJJJJ...', '....JJJJ....', '....SS.S....', '....FFFFF...'],
    jump:  ['...JJJJJJ...', '..JJ...JJJ..', '..SS.....SF.', '..FF......F.'],
  },
  // длинное платье: ног не видно, шевелится подол
  dress: {
    stand: ['..DDDDDDDD..', '..DDDDDDDD..', '.DDDDDDDDDD.', '.dddddddddd.'],
    walk1: ['..DDDDDDDD..', '..DDDDDDDDD.', '.DDDDDDDDDD.', 'dddddddddd..'],
    walk2: ['..DDDDDDDD..', '.DDDDDDDDD..', '.DDDDDDDDDD.', '..dddddddddd'],
    jump:  ['..DDDDDDDD..', '..DDDDDDDD..', '.DDDDDDDDDD.', '.dddddddddd.'],
  },
};

const CAST_SPRITES = {
  // «Я»: тёмные волосы с андеркатом, чёрные очки, белая футболка с лого, горчичные шорты
  me: {
    label: 'Я (по фото)',
    rows: ['...HHHHH....', '..HHHHHHHH..', '..hHHHHHHHH.', '..hhSSSSSSS.', '..hSGGGGGGG.', '..hSGLEGLEG.',
           '..hSSGGSGGS.', '...SSSSSSSS.', '...SSSSMMS..', '....SSSSS...', '.....SSS....',
           '...WWWWWWW..', '..WWWWWWWWW.', '..SWWWKKWWS.', '..SWWWWWWWS.', '..SWWWWWWWS.'],
    legs: CAST_LEGS.shorts,
    pal: { H: '#3a2a20', h: '#6a5646', S: '#f0c4a0', G: '#161616', L: '#dfe9ee', E: '#2a2a2a', M: '#c98a7a',
           W: '#f4f4f0', K: '#2a2a2a', J: '#d9b45a', F: '#eeeeee' },
  },
  // Юля — знакомство 2015 (по фото): длинные прямые тёмно-каштановые волосы на прямой пробор, без чёлки,
  // приталенный лососево-розовый лонгслив, тёмные джинсы, тёмная обувь
  yulia_meet: {
    label: 'Юля · знакомство 2015',
    rows: ['....HHHHH...', '...HHHhHHH..', '..HHHHhHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSfSSSfS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '.HHHH..SS...', '.HhHPPPPPP..',
           '.HHPPPPPPPP.', '.HHPPPPPPPP.', '..HPPPPPPPP.', '..pPPPPPPPp.', '..SPPPPPPPS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#3b2418', h: '#5a3a28', S: '#f6d6c4', E: '#2a1a14', f: '#e0a890', M: '#d77a7a', P: '#e8a59a', p: '#d08a80',
           J: '#2a2e40', F: '#1a1a1e' },
  },
  // Юля — 2019 (по фото, со щенком): длинные рыжие волосы, веснушки, бежевый жилет-тренч, чёрный топ
  yulia_red: {
    label: 'Юля · 2019 (рыжая)',
    rows: ['....HHHHH...', '...HHhHHHH..', '..HHHHHHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSfSSSfS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '.HHHH..SS...', '.HHBBKKKBB..',
           '.HHBBKKKBBB.', '..SBBKKKBBS.', '..SBBKKKBBS.', '..SBBBBBBBS.', '..wBBBBBBBw.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#d9622b', h: '#f08a4e', S: '#f6d2bc', E: '#2a1a14', f: '#d9906a', M: '#d77a7a', B: '#c8a77e',
           K: '#1e1e24', w: '#d0d0d8', J: '#2a2a33', F: '#e8dcc8' },
  },
  // Юля — Новый год 2017 (по фото): длинные прямые светло-каштановые волосы, приталенное чёрное бархатное
  // мини-платье с длинным рукавом, голые ноги, чёрные туфли
  yulia_velvet: {
    label: 'Юля · Новый год 2017',
    rows: ['....HHHHH...', '...HHHhHHH..', '..HHHHhHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSSSSSSS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '.HHHH..SS...', '.HhHVVVVVV..',
           '.HHVVVVVVVV.', '.HHVVVvVVVV.', '..HVVVVVVVV.', '..VVVVvVVVV.', '..SVVVVVVVS.'],
    legs: {
      stand: ['...VVVVVV...', '...SS..SS...', '...SS..SS...', '...FF..FFF..'],
      walk1: ['...VVVVVV...', '..SS....SS..', '.SS......SS.', '.FF......FFF'],
      walk2: ['...VVVVVV...', '....SSSS....', '....SS.S....', '....FFFFF...'],
      jump:  ['...VVVVVV...', '..SS...SSS..', '..SS.....SF.', '..FF......F.'],
    },
    pal: { H: '#8a6446', h: '#a8805a', S: '#f6d6c4', E: '#2a1a14', M: '#d77a7a', V: '#1a1a22', v: '#2e2e3a', F: '#0e0e10' },
  },
  // Юля — свадьба (по фото): белое платье-рубашка с длинным рукавом, чёрные колготки и туфли,
  // распущенные волнистые тёмно-каштановые волосы, букет розовых и белых роз в розовой бумаге
  yulia_wedding: {
    label: 'Юля · свадьба (по фото)',
    rows: ['....HHHHH...', '...HHhHHHH..', '..HHHHHHhHH.', '.HHhHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HhHSfSSSfS.', '.HHHSSSSMSS.', '.HHhH.SSSS..', 'HHHHH..SS...', '.HhHDDDDDD..',
           'HHHDDDDDDRwR', '.HhDDDDDDPRP', '..DDDDDDSPP.', '..DDdDDDDP..', '..SDDDDDDD..'],
    legs: {
      stand: ['..DDDDDDDD..', '...JJ..JJ...', '...JJ..JJ...', '...FF..FFF..'],
      walk1: ['..DDDDDDDD..', '..JJ....JJ..', '.JJ......JJ.', '.FF......FFF'],
      walk2: ['..DDDDDDDD..', '....JJJJ....', '....JJ.J....', '....FFFFF...'],
      jump:  ['..DDDDDDDD..', '..JJ...JJJ..', '..JJ.....JF.', '..FF......F.'],
    },
    pal: { H: '#6e2e1c', h: '#8e4428', S: '#f6d2bc', E: '#2a1a14', f: '#d9906a', M: '#d77a7a',
           D: '#f4f4f6', d: '#d8dae2', R: '#e86a8a', w: '#fde8ee', P: '#f2a0b8', J: '#16161a', F: '#0e0e10' },
  },
  // Юля — сейчас (по фото): длинные прямые каштановые волосы на прямой пробор, веснушки, светло-розовая рубашка
  // в тонкую полоску с коротким рукавом, ремень сумки через грудь, светлые джинсы, белые кроссовки
  yulia_now: {
    label: 'Юля · сейчас (по фото)',
    rows: ['....HHHHH...', '...HHHhHHH..', '..HHHHhHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSfSSSfS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '.HHHH..SS...', '.HhHpPpPBc..',
           '.HHPpPpBcPP.', '.HSPpPBcpPS.', '..SPpBcPpPS.', '..SPBcpPpPS.', '..SBcPpPpPS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#6a4a34', h: '#8a6446', S: '#f6d6c4', E: '#2a1a14', f: '#d9906a', M: '#d77a7a', P: '#f2b8d0', p: '#e89ab8',
           B: '#8a2a2a', c: '#e8dcc8', J: '#8fb0d8', F: '#f4f4f4' },
  },
  // бонус: щенок со второго фото (собака в детстве)
  puppy: {
    label: 'Бонус: щенок (собака в детстве)',
    rows: ['......O.O.', '......OOOO', 'T.....OWEO', '.T...OWWWN', '.OOOOOWWW.', '.OOOOWWW..'],
    legs: { stand: ['.W.W..W.W.'], walk1: ['W...W.W..W'], walk2: ['..WW...WW.'], jump: ['W...W.W..W'] },
    pal: { O: '#a8743f', T: '#a8743f', W: '#f4efe6', E: '#1a1020', N: '#1a1020' },
  },
  // Даша — сейчас (по фото): прямое каре до плеч с боковым пробором, тёмно-синяя футболка с белой надписью
  // и крошечным котиком, светло-серые джоггеры до щиколоток, белые кроссовки, чёрные смарт-часы
  dasha: {
    label: 'Даша (по фото)',
    rows: ['....HHHHH...', '...HHHHhHH..', '..HHHHHHhHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSSSSSSS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '..HH...SS...', '...NNNNNNN..',
           '..NNNWWWWNN.', '..SNNNoWNNS.', '..SNNNNNNNS.', '..SNNNNNNNX.', '..SNNNNNNNS.'],
    legs: {
      stand: ['...JJJJJJ...', '...JJ..JJ...', '...jj..jj...', '...FF..FFF..'],
      walk1: ['...JJJJJJ...', '..JJ....JJ..', '.jj......jj.', '.FF......FFF'],
      walk2: ['...JJJJJJ...', '....JJJJ....', '....jj.j....', '....FFFFF...'],
      jump:  ['...JJJJJJ...', '..JJ...JJJ..', '..jj.....jF.', '..FF......F.'],
    },
    pal: { H: '#6b4a32', h: '#8a6446', S: '#f6d6c0', E: '#2a1a14', M: '#d0707a', N: '#2a3456', W: '#f4f4f4', o: '#f0a040',
           X: '#141416', J: '#b8b8bc', j: '#9a9aa0', F: '#f4f4f4' },
  },
  // Даша — студентка (по фото): длинные прямые каштановые волосы на прямой пробор, широкая улыбка,
  // серый свитшот с маленьким чёрным принтом-Микки, голубые джинсы, белые кроссовки, часы
  dasha_young: {
    label: 'Даша · студентка',
    rows: ['....HHHHH...', '...HHHhHHH..', '..HHHHhHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSSSSSSS.', '.HHHSSMwwMS.', '.HHHH.SSSS..', '.HHHH..SS...', '.HHHGGGGGG..',
           '.HHGKGGGKGG.', '.HGGGKKKGGG.', '..GGGGGGGGG.', '..gGGGGGGGK.', '..SgggggggS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#6b4a32', h: '#8a6446', S: '#f6d6c0', E: '#2a1a14', M: '#c8606a', w: '#ffffff', G: '#9a9a9a', g: '#828288',
           K: '#1a1a1a', J: '#5b82b8', F: '#f2f2f2' },
  },
  // Илья (по фото): короткие каштановые волосы зачёсаны вверх, гладко выбрит,
  // светло-розовая рубашка на пуговицах, тёмные брюки и туфли
  ilya: {
    label: 'Илья (по фото)',
    rows: ['.....HHHHh..', '...HHHHHHHH.', '..HHHHHHHHH.', '..HHHSSSSSS.', '..HHSSSSSSS.', '..HSSSESSES.',
           '...SSSSSSSS.', '...SSSSSMSS.', '....SSSSS...', '.....SSS....', '...PPWSWPP..',
           '..PPPPpPPPP.', '..qPPPpPPPq.', '..qPPPpPPPq.', '..qPPPpPPPq.', '..SPPPpPPPS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#5a3c28', h: '#7a5638', S: '#efc6a5', E: '#1a1020', M: '#c98a7a', P: '#f2b8c6', p: '#c98a9a',
           q: '#dc9fb0', W: '#fbe6ec', J: '#2b2b38', F: '#1a1a1e' },
  },
  // папа Жени (по фото): стройный, короткие каштановые волосы, усы,
  // чёрная спортивная куртка с белой молнией и кантом, тёмные брюки
  papa: {
    label: 'Папа Жени (по фото)',
    rows: ['....HHHH....', '...HHHHHHH..', '..HHHHHHHHH.', '..HHHHSSSSS.', '..HHSSSSSSS.', '..HSSSESSES.',
           '..HSSSSSSSS.', '...SSSSBBBS.', '....SSSMS...', '.....SSS....', '...KKKWKKK..',
           '..WKKKWKKKW.', '..KKKKWKKKK.', '..KKKKWKKKK.', '..KKKKWKKKK.', '..SKKKKKKKS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#5e4430', S: '#ecc3a2', E: '#1a1020', B: '#4a3426', M: '#b87a6a', K: '#1c1c22', W: '#e8e8ee',
           J: '#2a2a33', F: '#151518' },
  },
  // мама Жени (по фото): короткое тёмно-каштановое каре, чёрное пальто, яркий красный шарф с орнаментом
  mama: {
    label: 'Мама Жени (по фото)',
    rows: ['....HHHHH...', '...HHHHHHH..', '..HHHHHHHHH.', '.HHHHHHHHHH.', '.HHHHSSSSSH.', '.HHHSSESSES.',
           '.HHHSSSSSSS.', '.HHHSSSSMSS.', '..HH.SSSS...', '....RrRRR...', '...RYRrRYR..',
           '..KKKKRYKKK.', '..KKKKRrKKK.', '..KKKKKRKKK.', '..KKKKKKKKK.', '..SKKKKKKKS.'],
    legs: {
      stand: ['..KKKKKKKK..', '...JJ..JJ...', '...JJ..JJ...', '...FF..FFF..'],
      walk1: ['..KKKKKKKK..', '..JJ....JJ..', '.JJ......JJ.', '.FF......FFF'],
      walk2: ['..KKKKKKKK..', '....JJJJ....', '....JJ.J....', '....FFFFF...'],
      jump:  ['..KKKKKKKK..', '..JJ...JJJ..', '..JJ.....JF.', '..FF......F.'],
    },
    pal: { H: '#3a2418', S: '#efc8ac', E: '#1a1020', M: '#c96a6a', R: '#c0282e', r: '#7a1418', Y: '#e8b040',
           K: '#1e1e24', J: '#2a2a30', F: '#101012' },
  },
  // Кэсси — котёнок: маленькая бенгальская кошечка, золотисто-рыжая с тёмными пятнами, хвост в полоску
  kassie_kitten: {
    label: 'Кэсси · котёнок',
    rows: ['k......O..O', '.k.....OOOO', '.O.....OOGO', '.k.....OOWN', '.OOOOOOOWW.', '..OkOOkOOW.', '..OOkOOkOO.'],
    legs: { stand: ['..O.O..O.O.'], walk1: ['.O...O.O..O'], walk2: ['...OO...OO.'], jump: ['.O...O.O..O'] },
    pal: { O: '#d8933a', k: '#3a2414', W: '#f4e6cc', G: '#5ec04a', N: '#b06a5a' },
  },
  // Кэсси — взрослая (по фото): упитанная круглая бенгальская кошка, золотисто-рыжая с тёмными розетками,
  // хвост с тёмным кончиком, большие тёмные глаза, розовый нос, белая мордочка, высокие уши с розовым
  kassie: {
    label: 'Кэсси · взрослая (упитанная)',
    rows: ['k.........O..O', '.k........OppO', '.O.......OOOOO', '.k.......OOeEO', '.O..OOOOOOOWWN',
           '..OOOkOOkOOWW.', '.OOkOOOOkOOOW.', '.OOOkWWWWOkO..'],
    legs: { stand: ['...OO....OO...'], walk1: ['..O..O..O..O..'], walk2: ['....OO..OO....'], jump: ['.O...O..O...O.'] },
    pal: { O: '#d8933a', k: '#3a2414', W: '#f6ead4', p: '#e8a0a0', e: '#5a3a1a', E: '#141010', N: '#e07a8a' },
  },
  // Василиса (по фото): малышка ~2 лет — светлые золотистые волосы до плеч с чёлкой, голубые глаза,
  // розовая футболка с сиреневым бантиком, голубой джинсовый комбинезон, белые сандалии с розовыми ремешками
  baby: {
    label: 'Василиса (по фото)',
    rows: ['...hHHHH....', '..HHHhHHHH..', '.HHHHHHHHHH.', '.HHHHHSHHSH.', '.HHHSSeSSeS.', '.HHHSSSSScS.',
           '..HHSSSSMS..', '..HTOTbTOT..', '..TOOOOOOOT.', '..SOOOoOOOS.', '...OOOOOO...'],
    legs: { stand: ['...OO..OO...', '...fF..fFF..'], walk1: ['..OO....OO..', '.fF......fF.'],
            walk2: ['....OOOO....', '....fFfFF...'], jump: ['..OO...OOf..', '..fF........'] },
    pal: { H: '#e8c878', h: '#f6dea0', S: '#f8dcc8', e: '#3a7ad0', c: '#f0a0a0', M: '#d07a7a', T: '#f8c8d4',
           b: '#b090d8', O: '#a8c8e8', o: '#88a8cc', F: '#ffffff', f: '#f080a8' },
  },
  // мама Юли и Даши (по фото): короткое взъерошенное медно-каштановое каре, круглое приветливое лицо,
  // длинное тёмно-зелёное платье-рубашка в клетку, чёрные легинсы, серые кроссовки
  ymama: {
    label: 'Мама Юли и Даши (по фото)',
    rows: ['....HHhHH...', '...HhHHHHH..', '..HHHHHhHHH.', '.HHhHHHHHHH.', '.HHHHSHHSHH.', '.HHHSSESSES.',
           '.HhHSSSSSSS.', '.HHHSSSSMMS.', '..HH.SSSS...', '......SS....', '...GGNGGNG..',
           '..GGGNGGNGG.', '..NNNNNNNNN.', '..GGGNGGNGG.', '..GGGNGGNGG.', '..SNNNNNNNS.'],
    legs: {
      stand: ['..GGGNGGNG..', '...JJ..JJ...', '...JJ..JJ...', '...FF..FFF..'],
      walk1: ['..GGGNGGNG..', '..JJ....JJ..', '.JJ......JJ.', '.FF......FFF'],
      walk2: ['..GGGNGGNG..', '....JJJJ....', '....JJ.J....', '....FFFFF...'],
      jump:  ['..GGGNGGNG..', '..JJ...JJJ..', '..JJ.....JF.', '..FF......F.'],
    },
    pal: { H: '#b5562e', h: '#d0743e', S: '#f2cdb0', E: '#2a2a30', M: '#d07a7a', G: '#2f4a3a', N: '#2a3350',
           J: '#141418', F: '#9a9aa2' },
  },
  // Саша — 2022 (по фото): обесцвеченные платиновые взъерошенные волосы, чёрные прямоугольные очки,
  // тонкие усы и бородка, бордовая футболка, джинсы, кроссовки
  sasha_2022: {
    label: 'Саша · 2022',
    rows: ['...H.HH.H...', '..HHHhHHHH..', '..hHHHHHHHH.', '..hhSSSSSSS.', '..hSGGGGGGG.', '..hSGLEGLEG.',
           '..hSSGGSGGS.', '...SSSSBBBS.', '...SSSSMMS..', '....SSSBS...', '.....SSS....',
           '...TTTTTTT..', '..TTTTTTTTT.', '..STTTTTTTS.', '..STTTTTTTS.', '..STTTTTTTS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#e8d898', h: '#c8b468', S: '#f0c4a0', G: '#161616', L: '#dfe9ee', E: '#2a2a2a', B: '#9a7a52', M: '#c98a7a',
           T: '#8a2a3a', J: '#4f74a8', F: '#eeeeee' },
  },
  // Саша — Новый год в Пушкине (по фото): лицо/очки как у «Я», рубашка в крупную чёрно-белую вертикальную
  // полоску с закатанными рукавами, тёмно-синие брюки, чёрные туфли, чёрные смарт-часы
  sasha_ny: {
    label: 'Саша · Новый год',
    rows: ['...HHHHH....', '..HHHHHHHH..', '..hHHHHHHHH.', '..hhSSSSSSS.', '..hSGGGGGGG.', '..hSGLEGLEG.',
           '..hSSGGSGGS.', '...SSSSSSSS.', '...SSSSMMS..', '....SSSSS...', '.....SSS....',
           '...WKWKWKW..', '..KWKWKWKWK.', '..KWKWKWKWK.', '..SWKWKWKWX.', '..SWKWKWKWS.'],
    legs: CAST_LEGS.pants,
    pal: { H: '#3a2a20', h: '#6a5646', S: '#f0c4a0', G: '#161616', L: '#dfe9ee', E: '#2a2a2a', M: '#c98a7a',
           W: '#f4f4f4', K: '#161616', X: '#050505', J: '#232a44', F: '#121214' },
  },
  // Саша — сейчас (по фото): длинные пышные волнистые тёмно-каштановые волосы до плеч, чёрные очки,
  // усы с эспаньолкой, тёмно-серая оверсайз-футболка, пыльно-розовые шорты, смарт-часы
  sasha_now: {
    label: 'Саша · сейчас',
    rows: ['...HHhHHH...', '.HHHHHHHhHH.', 'HHhHHHHHHHHH', 'HHHHSSSSSSSH', 'HhHSGGGGGGG.', 'HHHSGLEGLEG.',
           'HHhSSGGSGGS.', '.HHHSSSBBBS.', 'HHhH.SSMMB..', '.HHH.SBBB...', '.HhH.SSS....',
           '..HTTTTTTTT.', '.TTTTTTTTTT.', '.STTTTTTTTS.', '.STTTTTTTTX.', '..TTTTTTTT..'],
    legs: CAST_LEGS.shorts,
    pal: { H: '#4a3424', h: '#6a4c36', S: '#f0c4a0', G: '#161616', L: '#dfe9ee', E: '#2a2a2a', B: '#3a2a1e', M: '#c98a7a',
           T: '#4a4a4e', X: '#0a0a0a', J: '#b89a9e', F: '#e8e8e8' },
  },
  // Даша — 2022 (по фото): прямые каштановые волосы до плеч,
  // лавандовая футболка с ярким мультяшным принтом, красные шорты, кроссовки
  dasha_2022: {
    label: 'Даша · 2022',
    rows: ['....HHHHH...', '...HHHhHHH..', '..HHHHhHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSSSSSSS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '.HHHH..SS...', '...LLLLLLL..',
           '..LLLLLLLLL.', '..SLLLpyLLS.', '..SLLLbpLLS.', '..SLLLLLLLS.', '..SLLLLLLLS.'],
    legs: CAST_LEGS.shorts,
    pal: { H: '#6b4a32', h: '#8a6446', S: '#f6d6c0', E: '#2a1a14', M: '#d0707a', L: '#b8b4e0', p: '#f070a0', y: '#f8d040',
           b: '#4a90e0', J: '#c8302a', F: '#eeeeee' },
  },
  // Даша — Новый год в Пушкине (по фото): каре, приталенное красное платье-поло выше колена
  // (воротничок, планка, короткий рукав), голые ноги, тёмные туфли, чёрные смарт-часы
  dasha_ny: {
    label: 'Даша · Новый год',
    rows: ['....HHHHH...', '...HHHhHHH..', '..HHHHhHHHH.', '.HHHHHHHHHH.', '.HHHSSSSSSH.', '.HHHSSESSES.',
           '.HHHSSSSSSS.', '.HHHSSSSMSS.', '.HHHH.SSSS..', '..HH...SS...', '...RRrSrRR..',
           '..RRRRrRRRR.', '..SRRRrRRRS.', '..SRRRrRRRS.', '..SRRRRRRRX.', '..SRRRRRRRS.'],
    legs: {
      stand: ['...RRRRRR...', '...SS..SS...', '...SS..SS...', '...FF..FFF..'],
      walk1: ['...RRRRRR...', '..SS....SS..', '.SS......SS.', '.FF......FFF'],
      walk2: ['...RRRRRR...', '....SSSS....', '....SS.S....', '....FFFFF...'],
      jump:  ['...RRRRRR...', '..SS...SSS..', '..SS.....SF.', '..FF......F.'],
    },
    pal: { H: '#6b4a32', h: '#8a6446', S: '#f6d6c0', E: '#2a1a14', M: '#d0707a', R: '#d0302a', r: '#a02420',
           X: '#141416', F: '#1a1a1e' },
  },
  // Ваня — друг Даши и Саши (по фото): высокий и стройный, короткие светло-русые волосы, колпак Деда Мороза,
  // белая рубашка на пуговицах, тёмные брюки
  vanya: {
    label: 'Ваня',
    rows: ['....RRRR....', '.WRRRRRRR...', '..WWWWWWWW..', '..HHHSSSSSS.', '..HHSSSSSSS.', '..HSSSESSES.',
           '...SSSSSSSS.', '...SSSSSMSS.', '....SSSSS...', '.....SSS....', '.....SSS....',
           '...WWwSwWW..', '..WWWWwWWWW.', '..WWWWwWWWW.', '..wWWWwWWWw.', '..wWWWwWWWw.', '..SWWWwWWWS.'],
    legs: {
      stand: ['...JJJJJJ...', '...JJ..JJ...', '...JJ..JJ...', '...JJ..JJ...', '...FF..FFF..'],
      walk1: ['...JJJJJJ...', '...JJ..JJ...', '..JJ....JJ..', '.JJ......JJ.', '.FF......FFF'],
      walk2: ['...JJJJJJ...', '...JJJJJ....', '....JJJJ....', '....JJ.J....', '....FFFFF...'],
      jump:  ['...JJJJJJ...', '...JJ..JJ...', '..JJ...JJJ..', '..JJ.....JF.', '..FF......F.'],
    },
    pal: { R: '#d0282e', W: '#f4f4f4', w: '#d6d6d0', H: '#a07a52', S: '#f0c8a8', E: '#1a1020', M: '#c98a7a',
           J: '#22222a', F: '#121214' },
  },
  // Кит — подруга Жени: очень короткий тёмный пикси с чёлкой, тонкие круглые очки, чёрная водолазка,
  // тёмный серо-зелёный джинсовый сарафан ниже колена, тёмные ботинки
  kit: {
    label: 'Кит',
    rows: ['....HHHHH...', '...HHHHHHH..', '..HHHHHHHHH.', '..HHHHHHHHH.', '..HHSGGSGGS.', '..HSGLEGLEG.',
           '..HSSGGSGGS.', '...SSSSMSS..', '....SSSSS...', '.....KKK....', '...KKKKKKK..',
           '..KKDKKKDKK.', '..KKDDDDDKK.', '..KDDDDDDDK.', '..KDDDDDDDK.', '..SDDDDDDDS.'],
    legs: {
      stand: ['..DDDDDDDD..', '..dddddddd..', '...FF..FF...', '...FF..FFF..'],
      walk1: ['..DDDDDDDD..', '..dddddddd..', '..FF....FF..', '.FF......FFF'],
      walk2: ['..DDDDDDDD..', '..dddddddd..', '....FF.F....', '....FFFFF...'],
      jump:  ['..DDDDDDDD..', '..dddddddd..', '..FF.....FF.', '..FF......F.'],
    },
    pal: { H: '#3a2a20', S: '#f2cdb0', G: '#1a1a1e', L: '#e4eef2', E: '#1a1020', M: '#c98a7a', K: '#141416',
           D: '#3a4238', d: '#2e352d', F: '#18181a' },
  },
  // Тася — подруга Жени: фигуристая (корпус на 1 px шире), пышные волнистые тёмные волосы, черепаховые очки,
  // оверсайз-рубашка в сине-белую полоску нараспашку поверх чёрного топа, цепочка, широкие джинсы, массивные кроссовки
  tasya: {
    label: 'Тася',
    rows: ['....HHHHH...', '...HHhHHHH..', '..HHHHHHhHH.', '.HHhHHHHHHH.', 'HHHHSSSSSSH.', 'HHHSTtTTTtT.',
           'HhHHSSSSSSS.', 'HHHHSSSSMSS.', '.HhHH.SSSS..', 'HHHHH..SS...', '.HHBWKnKWB..',
           'HHWBWKKKWBW.', 'HBWBWKKKWBW.', '.BWBWKKKWBW.', '.BWBWKKKWBW.', '.SWBWKKKWBS.'],
    legs: {
      stand: ['..JJJJJJJJ..', '..JJJ..JJJ..', '..JJJ..JJJ..', '..FFF.FFFF..'],
      walk1: ['..JJJJJJJJ..', '.JJJ....JJJ.', 'JJJ......JJJ', 'FFF......FFF'],
      walk2: ['..JJJJJJJJ..', '...JJJJJJ...', '...JJJ.JJ...', '...FFFFFFF..'],
      jump:  ['..JJJJJJJJ..', '.JJJ...JJJ..', '.JJJ....JJF.', '.FFF.....FF.'],
    },
    pal: { H: '#3a2418', h: '#5a3a28', S: '#f2cdb0', T: '#7a3a1e', t: '#4a2010', M: '#c96a6a', B: '#5a7ab8',
           W: '#e8ecf4', K: '#141416', n: '#d8b860', J: '#2a3a6a', F: '#f4f4f4' },
  },
  // папа Юли и Даши (по фото): тёмные волосы с проседью и залысинами, густые седые усы,
  // бледно-жёлтое поло, голубые джинсовые шорты, белые кроссовки, часы на руке
  ypapa: {
    label: 'Папа Юли и Даши (по фото)',
    rows: ['....HHhH....', '...HhHHHhH..', '..HHhHHSSSS.', '..HhHSSSSSS.', '..HHSSSSSSS.', '..HSSSESSES.',
           '..hSSSSSSSS.', '...SSSWWWWS.', '...SSSSMSS..', '....SSSSS...', '..YYYwSwYY..',
           '.YYYYYwYYYY.', '.SYYYYwYYYS.', '.SYYYYYYYYS.', '.SYYYYYYYYK.', '.SYYYYYYYYS.'],
    legs: CAST_LEGS.shorts,
    pal: { H: '#5a5048', h: '#b0aaa4', S: '#e8b898', E: '#1a1010', W: '#a8a4a0', M: '#a86a5a', Y: '#f2e27a',
           w: '#d8c860', K: '#1a1a1a', J: '#7fa6d0', F: '#f2f2f2' },
  },
};

const CHARS = {
  dog:   { t: 'dog',   pal: { O: '#c8743a', T: '#c8743a', W: '#f4efe6', E: '#1a1020', N: '#1a1020' } },
  dasha: CAST_SPRITES.dasha,
  dasha_2022: CAST_SPRITES.dasha_2022,
  dasha_ny: CAST_SPRITES.dasha_ny,
  dasha_young: CAST_SPRITES.dasha_young,   // студентка
  // Юля: версии по времени — yulia (2015), yulia_red (2019), yulia_wedding, yulia_now
  yulia: CAST_SPRITES.yulia_meet,
  yulia_velvet: CAST_SPRITES.yulia_velvet,
  yulia_red: CAST_SPRITES.yulia_red,
  yulia_wedding: CAST_SPRITES.yulia_wedding,
  yulia_now: CAST_SPRITES.yulia_now,
  me: CAST_SPRITES.me,
  sasha: CAST_SPRITES.me,
  sasha_2022: CAST_SPRITES.sasha_2022,
  sasha_ny: CAST_SPRITES.sasha_ny,
  sasha_now: CAST_SPRITES.sasha_now,
  kit: CAST_SPRITES.kit,                   // подруга Жени
  tasya: CAST_SPRITES.tasya,               // подруга Жени
  vanya: CAST_SPRITES.vanya,               // друг Даши и Саши
  kassie: CAST_SPRITES.kassie,             // бенгальская кошка, взрослая
  kassie_kitten: CAST_SPRITES.kassie_kitten,
  papa: CAST_SPRITES.papa,                 // папа Жени
  mama: CAST_SPRITES.mama,                 // мама Жени
  ilya: CAST_SPRITES.ilya,
  ymama: CAST_SPRITES.ymama,               // мама Юли и Даши
  ypapa: CAST_SPRITES.ypapa,               // папа Юли и Даши
  baby: CAST_SPRITES.baby,                 // Василиса
  dog_puppy: CAST_SPRITES.puppy,
  // заглушки до фото
  roma:  { t: 'child', pal: { H: '#4a3020', S: '#f0c9a8', E: '#1a1020', M: '#c97a6a', R: '#2e6fd8', D: '#1e3a6a', w: '#ffffff', J: '#2b3550', F: '#3a2a20' } },
  max:   { t: 'child', pal: { H: '#7a5236', S: '#f0c9a8', E: '#1a1020', M: '#c97a6a', R: '#3aa55a', D: '#1f5a30', w: '#ffffff', J: '#2b3550', F: '#3a2a20' } },
};
function charSprite(id, frame) {
  const c = CHARS[id] || CHARS.me;
  if (c.rows) return sprite([...c.rows, ...c.legs[frame]], c.pal);
  const t = TEMPLATES[c.t]; return sprite([...t.rows, ...t.legs[frame]], c.pal);
}
const charName = id => (S.cast && S.cast[id]) || id;

// race bike (facing right). Rider rows on top, then body rows. Wheels drawn in code.
const RIDER = [
  '...............HHHH...........',
  '............LLHHHHHV..........',
  '..........TTTTHHHHVV..........',
  '........TTTTTTTTHH............',
  '.......TTTTTTTTTTTGG..........',
  '........TTTTTTT...GG..........',
  '.........PPPPP................',
  '..........PPPP................',
];
const BIKE = [
  '....................WWW.......',
  '..................RRWWWW......',
  '..CCC.........RRRRRRRRRR......',
  '...CCCRRRRRRRRRRRRRRRRRRRR....',
  '....RRRRRRRRRRRRRRRRRRRRRRRR..',
  '.....DRRRRRRRRRRRRRRRRRRRRR...',
  '......DDDKKKKKKKKKDDDD........',
  '........KKKMMMMKK.............',
];
const BIKE_BLANK = RIDER.map(() => '');
function bikeSprite(color, helmet, suit, rider = true, hair) {
  const d = mix(hex(color), [0, 0, 0], 0.45);
  const pal = { R: color, D: css(d), C: '#222', W: '#bfe3ff', K: '#2a2a2a', M: '#9aa0a8',
    H: helmet, V: '#1a1a1a', T: suit, G: '#222', P: css(mix(hex(suit), [0, 0, 0], 0.4)) };
  if (hair) pal.L = hair;
  return sprite([...(rider ? RIDER : BIKE_BLANK), ...BIKE], pal);
}
function wheel(cx, cy, ang) {
  disc(cx, cy, 4, '#151515'); disc(cx, cy, 2, '#8d939b'); rect(cx, cy, 1, 1, '#151515');
  const sx = Math.round(Math.cos(ang) * 3), sy = Math.round(Math.sin(ang) * 3);
  rect(cx + sx, cy + sy, 1, 1, '#d0d4da'); rect(cx - sx, cy - sy, 1, 1, '#d0d4da');
}
// draws bike with wheels; (x, yb) = left edge and ground line under wheels
function drawBike(spr, x, yb, ang, num, tilt = 0) {
  const top = yb - 19; // wheel centre sits on sprite row 14
  ctx.save();
  if (tilt) { ctx.translate(Math.round(x + 6), Math.round(yb)); ctx.rotate(-tilt); ctx.translate(-Math.round(x + 6), -Math.round(yb)); }
  wheel(Math.round(x + 6), Math.round(yb - 5), ang); wheel(Math.round(x + 24), Math.round(yb - 5), ang);
  draw(spr, x, top);
  if (num != null) pixText(num, x + 10, top + 11, '#fff');
  ctx.restore();
}

