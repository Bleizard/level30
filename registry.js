// =====================================================================
//  Реестр контента. Файлы глав (chapters/*.js) и библиотека объектов
//  (objects.js) регистрируют сюда главы, объекты и типы земли.
//  Формат описан в ENGINE.md.
// =====================================================================
window.L30 = {
  chapters: [],
  objects: {},
  grounds: {},
  chapter(c) { this.chapters.push(c); },
  object(id, def) { this.objects[id] = def; },
  ground(ch, def) { this.grounds[ch] = def; },
};
