/* PlayHub · plantillas de juego del player.
   Una escena = plantilla + contenido. Cada plantilla dibuja su tablero de 1280 × 600 con las piezas de juego
   del kit (src/plantillas.css) y los objetos o personajes de Rive, y habla con el marco solo con eventos:
     consigna(texto) · feedback({ kind, title, body }) · progreso(0–1) · completo()
   La consigna y el feedback no se dibujan aquí: el marco pone la consigna sobre el tablero y el feedback en el pie.
   El juego no le habla al educador: lo que él pregunta o explica está en la guía.
   No sabe en qué modo corre ni para qué audiencia: la audiencia llega como un perfil de edición.
   Todo lo que se toca vive en la columna x 120–1160, y 40–580. */
'use strict';
(() => {
  // Perfiles de edición: lo único que cambia entre audiencias. La interfaz y las plantillas son las mismas.
  // etiquetas: las piezas muestran su nombre escrito (infantil es prelectora: imagen y voz).
  // andamiaje: guiado (se ilumina dónde actuar y la pista llega en el primer error),
  //            pista (la pista llega en el primer error), libre (la pista llega en el segundo error).
  const PERFILES = {
    infantil: { nombre: 'Infantil · 4–8', etiquetas: false, andamiaje: 'guiado' },
    preadolescencia: { nombre: 'Preadolescencia · 9–12', etiquetas: true, andamiaje: 'pista' },
    adolescencia: { nombre: 'Adolescencia · 13–17', etiquetas: true, andamiaje: 'libre' },
  };

  const M = './assets/mock/';
  const el = (tag, className, props = {}) => Object.assign(document.createElement(tag), { className }, props);
  const px = value => `${value}px`;
  const box = (node, x, y, w, h) => Object.assign(node.style, { left: px(x), top: px(y), width: px(w), height: px(h) });
  const replay = (node, className) => { node.classList.remove(className); void node.offsetWidth; node.classList.add(className); };
  const toBoard = (board, event) => {
    const rect = board.getBoundingClientRect(), k = rect.width / 1280;
    return { x: (event.clientX - rect.left) / k, y: (event.clientY - rect.top) / k };
  };
  // Timers owned by one template instance, cleared on reset.
  function clock() {
    const timers = new Set();
    return {
      later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); },
      every(fn, ms) { const id = setInterval(fn, ms); timers.add(id); },
      clear() { timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers.clear(); },
    };
  }

  // ---- Personajes: assets/aves.riv, un Rive con las tres aves. View Model «Aves»: enum ave
  // (gallina | pata | codorniz) y triggers aceptar, negar, volverIdle.
  let avesBuffer = null;
  const loadAves = () => avesBuffer || (avesBuffer = fetch('./assets/aves.riv').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }));
  function riveBird(canvas, ave) {
    const bird = { player: null, vm: null, queue: [] };
    bird.say = name => { if (!bird.vm) { bird.queue.push(name); return; } if (!bird.player.isPlaying) bird.player.play(); bird.vm.trigger(name).trigger(); };
    bird.fit = () => bird.player?.resizeDrawingSurfaceToCanvas();
    bird.cleanup = () => { bird.player?.cleanup(); bird.player = null; bird.vm = null; };
    if (!window.rive) return bird;
    loadAves().then(buffer => {
      if (!canvas.isConnected) return;
      rive.RuntimeLoader.setWasmUrl('./assets/rive-2.42.2/rive.wasm');
      rive.RuntimeLoader.setWasmFallbackUrl('./assets/rive-2.42.2/rive_fallback.wasm');
      bird.player = new rive.Rive({
        buffer, canvas, artboard: 'MainArtboard', stateMachines: 'MainStateMachine', autoBind: true, autoplay: true,
        layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.Center }),
        onLoad: () => {
          bird.fit();
          bird.vm = bird.player.viewModelInstance;
          bird.vm.enum('ave').value = ave;
          bird.queue.splice(0).forEach(bird.say);
        },
      });
    }).catch(error => console.warn('Aves no disponibles', error));
    return bird;
  }

  // ---- Arte de una pieza. Una imagen (con nido, si apoya en uno) a una escala dada: los tamaños relativos
  // son contenido, así que todas las piezas de una escena usan la misma escala.
  const NEST_RATIO = 660 / 1200;
  function eggOnNest(parent, art, { cx, baseline, scale, nest }) {
    const nestH = nest * NEST_RATIO, h = art.alto * scale, w = h * 164 / 192;
    const nestImg = el('img', 'tb-nido', { src: `${M}nido.svg`, alt: '' });
    box(nestImg, cx - nest / 2, baseline - nestH * 0.52, nest, nestH);
    const egg = el('img', 'tb-huevo', { src: `${M}${art.imagen}`, alt: '' });
    box(egg, cx - w / 2, baseline - h, w, h);
    parent.append(nestImg, egg);
  }

  /* ==== Destapar · Revelar, Contrastar ===================================================
     Plano fila. Cada elemento tiene lo que se ve (la pista) y lo que se descubre (tapado). Se observa lo que se ve,
     el grupo dice qué cree que hay debajo y un niño toca para destapar; lo descubierto reacciona. Datos: elementos[{ seVe: { imagen, alto, nido }, seDescubre: { ave, etiqueta } }]. */
  function destapar({ board, escena, perfil, texto, emit, bloqueado }) {
    const items = escena.elementos;
    const CARD = { w: 320, h: 500 }, GAP = 40, SCALE = 1.8;   // one scale for every egg: sizes are never evened out
    const WINDOW = { x: 40, y: 18, w: 240, h: 196 };          // where the hidden part is, above what is seen
    const left = i => 640 - (items.length * CARD.w + (items.length - 1) * GAP) / 2 + i * (CARD.w + GAP);
    const top = 300 - CARD.h / 2;
    const time = clock();
    let s = null;

    function build() {
      time.clear(); s?.cards.forEach(c => c.bird?.cleanup());
      board.replaceChildren();
      s = { open: 0, idleSince: performance.now(), cards: [] };
      items.forEach((item, i) => {
        const card = el('button', 'tb-pieza tb-carta', { type: 'button' });
        card.dataset.tone = item.tono; card.dataset.state = 'tapada';
        card.setAttribute('aria-label', texto(item.seVe.descripcion) || 'Destapar');
        box(card, left(i), top, CARD.w, CARD.h);
        const hidden = el('span', 'tb-tapa');
        box(hidden, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
        hidden.append(el('span', 'tb-marca', { textContent: '?' }));
        card.append(hidden);
        eggOnNest(card, item.seVe, { cx: CARD.w / 2, baseline: 440, scale: SCALE, nest: 170 });
        const entry = { item, card, hidden, bird: null, open: false };
        card.addEventListener('click', () => touch(entry));
        board.append(card);
        s.cards.push(entry);
      });
      emit('consigna', texto(escena.consigna));
      emit('progreso', 0);
      // Guided: after a quiet moment, one card still covered nods, so the child knows what can be touched.
      if (perfil.andamiaje === 'guiado') time.every(nudge, 1000);
    }
    function nudge() {
      if (bloqueado()) { s.idleSince = performance.now(); return; }
      if (performance.now() - s.idleSince < 6000) return;
      s.idleSince = performance.now();
      const covered = s.cards.find(c => !c.open);
      if (covered) replay(covered.card, 'is-nudging');
    }
    function reveal(entry) {
      const { item, card, hidden } = entry;
      entry.open = true;
      card.dataset.state = 'abierta';
      card.setAttribute('aria-label', texto(item.seDescubre.etiqueta));
      hidden.classList.add('is-opening');
      time.later(() => hidden.remove(), 320);
      const canvas = el('canvas', 'tb-ave');
      box(canvas, (CARD.w - 220) / 2, 4, 220, 220);
      card.prepend(canvas);
      if (perfil.etiquetas) {
        const label = el('span', 'tb-etiqueta', { textContent: texto(item.seDescubre.etiqueta) });
        label.style.top = px(WINDOW.y + WINDOW.h);
        card.append(label);
      }
      entry.bird = riveBird(canvas, item.seDescubre.ave);
      time.later(() => entry.bird.say('aceptar'), 380);
    }
    function touch(entry) {
      if (bloqueado()) return;
      s.idleSince = performance.now();
      if (entry.open) {                 // look again: the same discovery, nothing new to earn
        entry.bird?.say('aceptar');
        emit('feedback', { kind: 'info', title: texto(entry.item.feedback) });
        return;
      }
      reveal(entry);
      s.open += 1;
      const all = s.open === items.length;
      emit('progreso', s.open / items.length);
      if (all) emit('completo');
      emit('feedback', { kind: 'success', title: texto(entry.item.feedback), body: all ? texto(escena.sintesis) : '' });
    }

    build();
    return {
      reset: build,
      fit() { s.cards.forEach(c => c.bird?.fit()); },
      destroy() { time.clear(); s.cards.forEach(c => c.bird?.cleanup()); board.replaceChildren(); },
    };
  }

  /* ==== Colocar · Emparejar, Ordenar, Recorrido ==========================================
     Plano mesa: los destinos arriba, con su número encima; las fichas abajo. Tocar una ficha la lleva al siguiente
     destino libre y tocarla en su destino la devuelve; también se arrastra a un destino concreto. Sin «Comprobar»:
     al llenarse los destinos, el juego responde. Datos: fichas[{ id, etiqueta, imagen, nido?, alto?, icono?, tono }]. */
  function colocar({ board, escena, perfil, texto, emit, bloqueado }) {
    const pieces = escena.fichas, order = escena.orden, n = order.length;
    const SLOT = 240, TILE = 192, SLOT_GAP = n > 2 ? 72 : 120, TILE_GAP = 48, MAGNET = 60;
    const slotX = i => 640 - (n * SLOT + (n - 1) * SLOT_GAP) / 2 + i * (SLOT + SLOT_GAP);
    const NUMBER_Y = 40, SLOT_Y = 88;                                      // number y 40–80, slot y 88–328
    const homeOf = i => ({ x: 640 - (n * TILE + (n - 1) * TILE_GAP) / 2 + i * (TILE + TILE_GAP), y: 360 }); // y 360–552
    const tray = [...order.slice(1), order[0]];   // never starts in the right order
    const time = clock();
    let s = null;

    function tile(item) {
      const node = el('button', 'tb-pieza tb-ficha', { type: 'button' });
      node.dataset.tone = item.tono;
      node.setAttribute('aria-label', texto(item.etiqueta));
      const art = el('span', 'tb-ficha-arte');
      if (item.nido) eggOnNest(art, item, { cx: 70, baseline: 94, scale: 1.2, nest: 110 });
      else art.append(el('img', 'tb-ficha-img', { src: `${M}${item.imagen}`, alt: '' }));
      if (item.icono) {
        const badge = el('span', 'tb-insignia', { innerHTML: icon(item.icono) });
        art.append(badge);
      }
      node.append(art);
      if (perfil.etiquetas) node.append(el('span', 'tb-ficha-etiqueta', { textContent: texto(item.etiqueta) }));
      return node;
    }
    function build() {
      time.clear();
      board.replaceChildren();
      s = { slots: Array(n).fill(null), misses: 0, done: false, pieces: [] };
      s.slotNodes = order.map((_, i) => {
        const number = el('span', 'tb-numero', { textContent: String(i + 1) });
        box(number, slotX(i), NUMBER_Y, SLOT, 40);
        const slot = el('div', 'tb-ranura');
        box(slot, slotX(i), SLOT_Y, SLOT, SLOT);
        board.append(number, slot);
        if (i < n - 1) {
          const arrow = el('span', 'tb-flecha', { innerHTML: icon('chevron-right') });
          box(arrow, slotX(i) + SLOT + SLOT_GAP / 2 - 24, SLOT_Y + SLOT / 2 - 24, 48, 48);
          board.append(arrow);
        }
        return slot;
      });
      tray.forEach((id, i) => {
        const item = pieces.find(p => p.id === id), home = homeOf(i);
        const well = el('div', 'tb-pozo');
        box(well, home.x, home.y, TILE, TILE);
        board.append(well);
        const node = tile(item);
        const piece = { item, node, home, slot: -1 };
        box(node, home.x, home.y, TILE, TILE);
        bind(piece);
        board.append(node);
        s.pieces.push(piece);
      });
      emit('consigna', texto(escena.consigna));
      emit('progreso', 0);
      guide();
    }
    function moveTo(piece, x, y) { Object.assign(piece.node.style, { left: px(x), top: px(y) }); }
    function slotAt(point) {
      return s.slotNodes.findIndex((_, i) => point.x >= slotX(i) - MAGNET && point.x <= slotX(i) + SLOT + MAGNET && point.y >= SLOT_Y - MAGNET && point.y <= SLOT_Y + SLOT + MAGNET);
    }
    // Guided: the next free destination is lit, so the child knows where the piece goes.
    function guide() {
      const next = perfil.andamiaje === 'guiado' && !s.done ? s.slots.indexOf(null) : -1;
      s.slotNodes.forEach((slot, i) => slot.classList.toggle('is-next', i === next));
    }
    function place(piece, i) {
      const occupant = s.pieces.find(p => p.slot === i && p !== piece);
      if (occupant) back(occupant);
      if (piece.slot >= 0) s.slots[piece.slot] = null;
      s.slots[i] = piece.item.id; piece.slot = i;
      piece.node.dataset.state = 'colocada';
      moveTo(piece, slotX(i) + (SLOT - TILE) / 2, SLOT_Y + (SLOT - TILE) / 2);
      guide();
      emit('progreso', s.slots.filter(Boolean).length / n * 0.6);
      if (s.slots.every(Boolean)) time.later(check, 360);
    }
    function back(piece) {
      if (piece.slot >= 0) s.slots[piece.slot] = null;
      piece.slot = -1; delete piece.node.dataset.state;
      moveTo(piece, piece.home.x, piece.home.y);
      guide();
    }
    function tap(piece) {
      if (bloqueado() || s.done) return;
      if (piece.slot >= 0) { back(piece); return; }
      const free = s.slots.indexOf(null);
      if (free >= 0) place(piece, free);
    }
    function check() {
      if (!s.slots.every(Boolean)) return;
      if (s.slots.every((id, i) => id === order[i])) {
        s.done = true; guide();
        s.pieces.forEach((p, i) => { p.node.style.setProperty('--delay', `${i * 120}ms`); replay(p.node, 'is-celebrating'); p.node.disabled = true; });
        emit('progreso', 1);
        emit('completo');
        emit('feedback', { kind: 'success', title: texto(escena.completo.titulo), body: texto(escena.completo.texto) });
        return;
      }
      s.misses += 1;
      const hint = perfil.andamiaje === 'libre' && s.misses < 2 ? texto(escena.reintento) : texto(escena.pista);
      emit('feedback', { kind: 'retry', title: hint });
      s.slotNodes.forEach(slot => replay(slot, 'is-wrong'));
      time.later(() => s.pieces.forEach(back), 700);
    }
    // Drag, or tap then tap. A drag that ends on a destination places the piece there.
    function bind(piece) {
      const { node } = piece;
      let start = null, moved = false, dragged = false;
      node.addEventListener('pointerdown', event => {
        if (bloqueado() || s.done) return;
        start = toBoard(board, event); moved = false;
        try { node.setPointerCapture(event.pointerId); } catch { /* optional */ }
      });
      node.addEventListener('pointermove', event => {
        if (!start) return;
        const point = toBoard(board, event), dx = point.x - start.x, dy = point.y - start.y;
        if (!moved && Math.hypot(dx, dy) < 10) return;
        if (!moved) { moved = true; node.classList.add('is-dragging'); }
        node.style.translate = `${dx}px ${dy - 24}px`;      // rides above the finger
        const over = slotAt(point);
        s.slotNodes.forEach((slot, i) => slot.classList.toggle('is-over', i === over));
      });
      const end = event => {
        if (!start) return;
        const point = toBoard(board, event), wasMoved = moved;
        start = null; moved = false;
        node.classList.remove('is-dragging'); node.style.translate = '';
        s.slotNodes.forEach(slot => slot.classList.remove('is-over'));
        if (!wasMoved || event.type === 'pointercancel') return;
        dragged = true;
        const i = slotAt(point);
        if (i >= 0) place(piece, i); else if (piece.slot >= 0) back(piece);
      };
      node.addEventListener('pointerup', end);
      node.addEventListener('pointercancel', end);
      // Tap (and keyboard): the click after a drag is swallowed.
      node.addEventListener('click', () => { if (dragged) { dragged = false; return; } tap(piece); });
    }

    build();
    return { reset: build, fit() {}, destroy() { time.clear(); board.replaceChildren(); } };
  }

  const PLANTILLAS = { destapar, colocar };
  window.PLAYHUB_PLANTILLAS = {
    PERFILES,
    crear(nombre, context) {
      const plantilla = PLANTILLAS[nombre];
      if (!plantilla) throw new Error(`Plantilla desconocida: ${nombre}`);
      return plantilla(context);
    },
  };
})();
