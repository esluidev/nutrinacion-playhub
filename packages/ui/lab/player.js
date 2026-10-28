/* PlayHub · player: el taller.
   Una escena = plantilla + contenido (plantillas.js, datos-huevo.js). El modo cambia el marco, nunca la escena:
   - educator: la pantalla del taller. Conduce: avanza, pausa, reinicia, abre la guía y ve quién está conectado;
               puede pausar, reiniciar o quitar un dispositivo.
   - device:   el dispositivo de un participante en el taller. No navega: la sesión le manda escena, pausa y
               reinicios; la actividad y su feedback se resuelven ahí y no salen de ahí.
   - home:     uso autónomo en casa. La persona avanza.
   ?edicion=infantil|preadolescencia|adolescencia elige el perfil de la audiencia (en device lo manda la sesión).
   La consola vive en la barra y el pie. Sobre el tablero, su consigna: qué hacer, fija en la escena.
   Lo único que cambia con cada acción es el feedback, que sube sobre el pie. El juego no le habla al educador:
   lo que él pregunta o explica está en la guía; para conversar, pausa (y los dispositivos se congelan).
   La sesión del taller se simula entre pestañas del mismo navegador (BroadcastChannel). Del dispositivo solo
   vuelve su presencia (icono, escena y si está en pausa), nunca respuestas, intentos ni si terminó. */
'use strict';
hydrateIcons();
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const MODES = ['educator', 'device', 'home'];
const mode = MODES.includes(params.get('mode')) ? params.get('mode') : 'educator';
if (params.get('mode') && params.get('mode') !== mode) console.warn(`Modo «${params.get('mode')}» no existe; se usa «${mode}».`);
const { PERFILES, crear } = window.PLAYHUB_PLANTILLAS;
const EDITION_ALIAS = { pre: 'preadolescencia', ado: 'adolescencia' };
const requestedEdition = EDITION_ALIAS[params.get('edicion')] || params.get('edicion');
let edicion = PERFILES[requestedEdition] ? requestedEdition : 'infantil';
const storyboard = window.PLAYHUB_STORYBOARD;
const FRAME = { width: 1280, height: 800 };
const award = 10; // per completed game, once per session, for the whole group
// A content value is a text or one text per edition.
const texto = value => value && typeof value === 'object' ? (value[edicion] ?? value.infantil) : value;

$('player').dataset.mode = mode;
document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas').trim();

const scenes = storyboard.escenas.map(escena => ({
  ...escena, instance: null, section: null, fraction: 0, completed: false, credited: false, ready: false,
  message: null, prompt: '', elapsed: 0, generation: 0, reward: 0,
}));
let current = 0, guideOpen = false, railOpen = false, devicesOpen = false, muted = false, sequence = 0, lastTick = performance.now();
let dialogOrigin = null, confirmAction = null;
const pauseReasons = new Set();
const active = () => scenes[current];
const isTemplate = scene => scene.plantilla !== 'anuncio';
// What the device knows of the workshop: only the session's orders.
// held: the educator paused this device alone; removed: the educator took it out of the workshop.
const session = { open: false, closed: false, removed: false, scene: null, paused: false, held: false, points: 0 };

// ---- Design space 1280×800, zoomed to the screen's safe area (same rules as player.js).
const UI_FLOOR = { tablet: 1, phone: 44 / 48, mouse: 40 / 48 }, UI_MIN_WIDTH = 720, SCENE = { width: 1280, height: 600 };
const EDGE = { phone: 12, large: 20 }, PHONE_MAX = 600, GUTTER = 32;
// HUD controls plus their 4 px base (plantillas.css · HUD): one size, 44, the touch minimum. Phones draw the UI at
// 44/48 (UI_FLOOR), so there the control is 48 to stay at 44 real px.
const CONTROL = { large: 44 + 4, phone: 48 + 4 };
const CONSIGNA = { large: 56, phone: 48 };   // the consigna row above the board, in design px
// The bands hug the controls with one rule: edge + control (bar) and gap + control + edge (footer): 68 · 92.
const BARS = {
  normal: () => ({ bar: EDGE.large + CONTROL.large, footer: 24 + CONTROL.large + EDGE.large, edge: EDGE.large }),
  compact: (phone, scale) => {
    const edge = (phone ? EDGE.phone : EDGE.large) / scale, gap = phone ? 16 : 24, control = phone ? CONTROL.phone : CONTROL.large;
    return { bar: edge + control, footer: gap + control + edge, edge };
  },
};
const probe = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'safe-probe' }));
probe.setAttribute('aria-hidden', 'true');
const coarse = matchMedia('(pointer: coarse)');
function fitFrame() {
  const box = probe.getBoundingClientRect(), style = getComputedStyle(probe);
  const [top, right, bottom, left] = ['Top', 'Right', 'Bottom', 'Left'].map(side => parseFloat(style[`padding${side}`]) || 0);
  const side = Math.max(left, right);
  const width = box.width - 2 * side, height = box.height - top - bottom;
  const fit = Math.min(width / FRAME.width, height / FRAME.height);
  const phone = Math.min(box.width, box.height) < PHONE_MAX;
  const floor = !coarse.matches ? UI_FLOOR.mouse : phone ? UI_FLOOR.phone : UI_FLOOR.tablet;
  const scale = Math.max(fit, Math.min(floor, width / UI_MIN_WIDTH), 0.1);
  const normal = BARS.normal();
  const compact = coarse.matches || height / scale - normal.bar - normal.footer < SCENE.height * 0.9;
  const bars = compact ? BARS.compact(phone, scale) : normal;
  const pad = (inset, margin) => Math.max(inset / scale - margin, 0);
  const padTop = pad(top, bars.edge), padBottom = pad(bottom, bars.edge), padSide = pad(side, GUTTER);
  const frameWidth = box.width / scale, frameHeight = box.height / scale;
  const consigna = phone && compact ? CONSIGNA.phone : CONSIGNA.large;
  // The consigna and the board travel together, centred between the bar and the footer: the consigna always sits
  // right on top of the board, also on screens taller than 16:10.
  const room = frameHeight - padTop - padBottom - bars.bar - bars.footer;
  const stageWidth = frameWidth - 2 * padSide, sceneFit = Math.min(stageWidth / SCENE.width, (room - consigna) / SCENE.height, 1);
  const spare = Math.max(room - consigna - SCENE.height * sceneFit, 0) / 2;
  const root = document.documentElement.style, px = value => `${value.toFixed(3)}px`;
  root.setProperty('--player-scale', scale.toFixed(5));
  root.setProperty('--frame-w', px(frameWidth)); root.setProperty('--frame-h', px(frameHeight));
  root.setProperty('--safe-t', px(padTop)); root.setProperty('--safe-b', px(padBottom));
  root.setProperty('--safe-l', px(padSide)); root.setProperty('--safe-r', px(padSide));
  root.setProperty('--consigna-h', px(consigna));
  root.setProperty('--consigna-top', px(spare));
  root.setProperty('--scene-h', px(SCENE.height * sceneFit));
  root.setProperty('--scene-fit', sceneFit.toFixed(5));
  $('player').style.setProperty('--scene-top', px(spare + consigna));
  $('player').toggleAttribute('data-compact', compact);
  $('player').style.setProperty('--edge', px(bars.edge));
  document.body.toggleAttribute('data-phone', compact && phone);
  requestAnimationFrame(() => active()?.instance?.fit());
}

function formatClock(ms) {
  const total = Math.floor(ms / 1000), minutes = Math.floor(total / 60), seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
function announce(text) { $('status').textContent = text; }

// ---- Bar
const totalPoints = () => mode === 'device' ? session.points : scenes.filter(scene => scene.credited).length * award;
function renderBar() {
  const percent = Math.round(scenes.reduce((sum, scene) => sum + scene.fraction, 0) / scenes.length * 100);
  $('scene-count').textContent = `${current + 1}/${scenes.length}`;
  $('scene-chip').setAttribute('aria-valuenow', String(percent));
  $('scene-chip').setAttribute('aria-valuetext', `Escena ${current + 1} de ${scenes.length} · ${percent} %`);
  $('scene-ring').style.strokeDashoffset = String(100 - percent);
  $('points').textContent = totalPoints();
  renderPoints();
  $('points-counter').setAttribute('aria-label', `Ver puntos: ${totalPoints()}`);
  $('ready-badge').hidden = !(mode === 'device' && active().ready);
}
// Points window: the group's total over what the workshop's games can add.
function renderPoints() {
  $('points-total').textContent = totalPoints();
  $('points-possible').textContent = `de ${scenes.filter(isTemplate).length * award}`;
}
function pulsePoints() { const counter = $('points-counter'); counter.classList.remove('is-rewarded'); void counter.offsetWidth; counter.classList.add('is-rewarded'); }

// ---- Plantilla Anuncio (Situar): drawn from data, the same in every mode.
function renderWelcome() {
  const scene = scenes.find(item => item.plantilla === 'anuncio');
  if (!scene) return;
  $('welcome').dataset.area = storyboard.area;
  $('welcome-area').textContent = storyboard.areaLabel;
  $('welcome-area').dataset.area = storyboard.area;
  $('welcome-edition').textContent = PERFILES[edicion].nombre;
  $('welcome-topic').textContent = scene.tema;
  $('welcome-image').src = scene.imagen;
}

// ---- Template scenes: one board per scene, created on its first visit and kept until reset.
function ensureInstance(scene) {
  if (scene.instance || !isTemplate(scene)) return;
  const section = Object.assign(document.createElement('section'), { className: 'tb-scene', hidden: true });
  section.setAttribute('aria-label', scene.nombre);
  const board = Object.assign(document.createElement('div'), { className: 'tb-board' });
  board.dataset.plantilla = scene.plantilla;
  section.append(board);
  $('stage').insertBefore(section, $('guide'));
  scene.section = section;
  scene.instance = crear(scene.plantilla, {
    board, escena: scene, perfil: PERFILES[edicion], texto,
    bloqueado: () => scene !== active() || isBlocked(),
    emit: (type, payload) => onEvent(scene, type, payload),
  });
}
function dropInstances() {
  scenes.forEach(scene => { scene.instance?.destroy(); scene.section?.remove(); scene.instance = scene.section = null; });
}
// Events from a template. The template never knows the mode; the frame decides what each event means here.
function onEvent(scene, type, payload) {
  const here = scene === active();
  if (type === 'consigna') { scene.prompt = payload; if (here) renderConsigna(); }
  else if (type === 'progreso') { scene.fraction = scene.completed ? 1 : payload; renderBar(); }
  else if (type === 'completo') {
    scene.completed = true; scene.fraction = 1;
    if (mode === 'device') scene.ready = true;            // local only: nobody is told
    else if (!scene.credited) { scene.credited = true; scene.reward = award; if (here) pulsePoints(); }
    renderBar(); publish();
  } else if (type === 'feedback') {
    scene.message = { ...payload, type: typeOf(payload.kind), reward: scene.reward, sequence: ++sequence };
    scene.reward = 0;
    if (here) renderFeedback();
  }
}

// ---- Consigna: what to do in this scene. It does not change with the child's actions.
// A side panel (guide or devices) covers part of it while the scene is paused, so it steps aside until the panel closes.
function renderConsigna() {
  const text = mode === 'device' && !session.open ? '' : active().prompt;
  $('consigna-text').textContent = text || '';
  $('consigna').dataset.empty = String(!text);
  $('consigna').hidden = guideOpen || devicesOpen;
}

// ---- Footer: a feedback rises over it in the tone of its type, with its own listen and close buttons;
// the controls step aside until it is closed. No timers: it waits for the reader.
const LOOKS = { success: { tone: 'lime', icon: 'check-circle' }, info: { tone: 'sky', icon: 'info' }, warning: { tone: 'sun', icon: 'warning' } };
const typeOf = kind => ({ success: 'success', complete: 'success', retry: 'warning', selection: 'info', info: 'info' })[kind] || 'info';
function renderFeedback() {
  const message = mode === 'device' && !session.open ? null : active().message, element = $('feedback');
  element.dataset.visible = String(Boolean(message));
  $('player').dataset.feedback = message ? message.type : 'none';
  if (!message) { delete element.dataset.message; return; }
  const signature = `${current}|${message.sequence}`;
  if (element.dataset.message === signature) return;
  element.dataset.message = signature;
  const look = LOOKS[message.type];
  element.dataset.tone = look.tone;
  $('feedback-close').dataset.tone = look.tone;
  $('feedback-icon').innerHTML = icon(look.icon);
  $('feedback-title').textContent = message.title;
  $('feedback-text').textContent = message.body || ''; $('feedback-text').hidden = !message.body;
  $('feedback-reward').hidden = !message.reward;
  $('feedback-reward').innerHTML = message.reward ? `${icon('ruby-solid')} +${message.reward}` : '';
  announce([message.title, message.body].filter(Boolean).join('. '));
  element.classList.remove('is-entering'); void element.offsetWidth; element.classList.add('is-entering');
}
function closeFeedback({ focus = true } = {}) {
  active().message = null;
  renderFeedback();
  if (focus) (mode === 'device' ? $('stage') : $('next-button')).focus({ preventScroll: true });
}

// ---- Blocking: a pause or an open panel freeze the board; on a device, also the session's pause.
function isBlocked() {
  if (pauseReasons.size) return true;
  return mode === 'device' && (!session.open || session.paused || session.held);
}
function overlayKind() {
  if (mode === 'device') return session.removed ? 'removed' : session.closed ? 'closed' : !session.open ? 'waiting' : session.paused || session.held ? 'paused' : null;
  return pauseReasons.has('manual') && !guideOpen && !devicesOpen && !document.querySelector('dialog[open]') ? 'paused' : null;
}
const sceneCaption = () => `Escena ${current + 1} de ${scenes.length} · ${active().nombre}`;
const workshopCaption = () => `Taller · ${storyboard.titulo}`;
const OVERLAYS = {
  paused: { icon: 'pause', tone: 'sky', title: 'En pausa', caption: sceneCaption, text: () => mode === 'device' ? 'Escucha al educador. El juego sigue donde quedó.' : 'Conversen con calma. Todo sigue donde quedó.', action: mode === 'educator' },
  waiting: { icon: 'devices', tone: 'sky', title: 'Esperando al educador', caption: workshopCaption, text: () => 'El taller empieza cuando el educador lo abra. En esta demostración, abre player.html en otra pestaña de este navegador.' },
  closed: { icon: 'check', tone: 'lime', title: 'El taller terminó', caption: workshopCaption, text: () => 'Gracias por jugar. Lo que hiciste se quedó en este dispositivo.' },
  removed: { icon: 'devices', tone: 'sky', title: 'Ya no estás en el taller', caption: workshopCaption, text: () => 'Para volver a entrar, pide el código al educador. En esta demostración, recarga esta pestaña.' },
};
function syncBlock() {
  scenes.forEach(scene => scene.section?.querySelector('.tb-board').toggleAttribute('data-blocked', scene !== active() || isBlocked()));
  const kind = overlayKind(), look = OVERLAYS[kind], hadFocus = $('scene-overlay').contains(document.activeElement);
  $('scene-overlay').hidden = !look;
  if (look) {
    $('overlay-icon').dataset.tone = look.tone; $('overlay-icon').innerHTML = icon(look.icon);
    $('overlay-caption').textContent = look.caption(); $('overlay-title').textContent = look.title; $('overlay-description').textContent = look.text();
    $('overlay-close').hidden = $('overlay-actions').hidden = !look.action;
    $('pause-stats').hidden = !look.action;     // the educator's pause: the scene's time, stopped
    $('pause-scene-time').textContent = formatClock(active().elapsed);
  }
  // Like a dialog: the rest of the frame is inert behind the window, and the educator's pause takes the focus.
  document.querySelectorAll('#player > :not(#scene-overlay, #status)').forEach(element => { element.inert = Boolean(look); });
  if (look?.action && !$('scene-overlay').contains(document.activeElement)) $('overlay-action').focus({ preventScroll: true });
  else if (!look && hadFocus && !guideOpen && !devicesOpen) $('time-counter').focus({ preventScroll: true });   // resumed: back to the timer
  syncControls();
}
function syncControls() {
  const scene = active(), manual = pauseReasons.has('manual');
  $('time-counter').disabled = !isTemplate(scene);
  $('time-counter').setAttribute('aria-pressed', String(manual));
  $('time-counter').setAttribute('aria-label', manual ? 'Reanudar escena' : 'Pausar escena');
  $('time-counter').title = manual ? 'Reanudar (P)' : 'Pausar (P)';
  $('time-art').innerHTML = icon(manual ? 'pause' : 'clock-solid');   // paused: the clock gives way to the pause sign
  $('elapsed').textContent = formatClock(scene.elapsed);
  $('previous-button').disabled = current === 0;
  const last = current === scenes.length - 1;
  $('next-label').textContent = last ? 'Terminar' : mode === 'home' ? 'Continuar' : 'Siguiente';
  $('next-button').setAttribute('aria-label', last ? 'Terminar el taller' : $('next-label').textContent);
}
function setPause(reason, value) {
  value ? pauseReasons.add(reason) : pauseReasons.delete(reason);
  lastTick = performance.now();
  syncBlock();
  if (reason === 'manual') publish();
}

// ---- Navigation (educator and home). A device only follows the session.
function goTo(index, { focus = true } = {}) {
  if (index < 0 || index >= scenes.length) return;
  current = index; pauseReasons.delete('manual'); lastTick = performance.now();
  const scene = active();
  ensureInstance(scene);
  $('welcome').hidden = isTemplate(scene);
  scenes.forEach(item => { if (item.section) item.section.hidden = item !== scene; });
  document.title = `${scene.nombre} · ${storyboard.titulo} · PlayHub`;
  renderBar(); renderConsigna(); renderFeedback(); syncBlock();
  if (guideOpen) renderGuide();
  requestAnimationFrame(() => scene.instance?.fit());
  announce(`Escena ${scene.numero}: ${scene.nombre}`);
  if (focus && mode !== 'device') $('stage').focus({ preventScroll: true });
  publish();
}
function next() {
  const scene = active();
  if (!isTemplate(scene)) scene.fraction = 1;       // the Anuncio is done once it has been presented
  if (current < scenes.length - 1) { goTo(current + 1); return; }
  confirm({ title: '¿Terminamos el taller?', description: mode === 'home' ? 'Puedes volver a jugarlo cuando quieras.' : 'El taller se cierra en esta pantalla y en los dispositivos conectados.', label: 'Terminar', symbol: 'check', tone: 'lime', action: leave }, $('next-button'));
}
function previous() { goTo(current - 1); }
function leave() { post({ tipo: 'cierre' }); location.href = './index.html'; }
function restartScene(scene) {
  Object.assign(scene, { message: null, completed: false, ready: false, fraction: 0, elapsed: 0 });
  scene.instance?.reset();
  if (scene === active()) { renderConsigna(); renderFeedback(); syncBlock(); }
  renderBar();
}

// ---- Session between tabs (demo of the workshop service).
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('playhub-taller-demo') : null;
const post = message => channel?.postMessage(message);
// Educator → devices: scene, pause, restarts, points and edition. Nothing else.
function publish() {
  if (mode !== 'educator') return;
  const scene = active();
  post({
    tipo: 'estado', edicion, escena: scene.id,
    pausa: pauseReasons.has('manual'), puntos: totalPoints(),
    reinicios: Object.fromEntries(scenes.map(item => [item.id, item.generation])),
  });
}
// ---- Devices panel (educator): who is connected and in which scene, never what they answered or whether they finished.
// The educator can act on one device: pause or free it, restart its scene, or take it out of the workshop.
// Seven test devices: they follow the session and obey here, so the panel can be tried
// without opening tabs. A tab opened with ?mode=device joins them for real and goes first in the list.
const TEST_DEVICES = [['Zorro', 'coral'], ['Búho', 'grape'], ['Abeja', 'sun'], ['Pez', 'sky'], ['Rana', 'lime'], ['Conejo', 'rose'], ['Tortuga', 'lime']]
  .map(([nombre, tono], index) => ({ id: `prueba-${index + 1}`, nombre, tono, prueba: true, pausado: false, note: '' }));
const devices = new Map(mode === 'educator' ? TEST_DEVICES.map(device => [device.id, device]) : []);
let selectedDevice = null, listSignature = '';
const sceneOf = device => device.prueba ? active() : scenes.find(scene => scene.id === device.escena);
function renderDevices() {
  const list = [...devices.values()].sort((a, b) => Number(Boolean(a.prueba)) - Number(Boolean(b.prueba)));
  // Presence arrives every 2 s: the list is rebuilt only when it changes, so a tap or the keyboard focus is never lost.
  const signature = JSON.stringify(list.map(device => [device.id, device.tono, device.pausado, device.escena, device.id === selectedDevice]));
  if (signature !== listSignature) {
    listSignature = signature;
    const focused = document.activeElement?.dataset?.device;
    $('device-list').innerHTML = list.map(device => `<li><button class="device-avatar" data-device="${device.id}" aria-pressed="${device.id === selectedDevice}" aria-label="${device.nombre}${device.pausado ? ', en pausa' : ''}"><span class="ui-symbol" data-tone="${device.tono}">${icon('user')}</span>${device.pausado ? `<span class="ui-dot" data-tone="night">${icon('pause')}</span>` : ''}</button></li>`).join('');
    if (focused) document.querySelector(`[data-device="${focused}"]`)?.focus({ preventScroll: true });
  }
  $('devices-count').textContent = $('devices-dot').textContent = list.length;
  $('devices-dot').hidden = !list.length;
  $('devices-button').setAttribute('aria-label', `Dispositivos conectados: ${list.length}`);
  const device = devices.get(selectedDevice), where = device && sceneOf(device);
  $('device-card').dataset.selected = String(Boolean(device));
  $('device-card-symbol').dataset.tone = device ? device.tono : 'neutral';
  $('device-card-name').textContent = device ? device.nombre : 'Ningún dispositivo';
  $('device-card-status').textContent = device
    ? device.note || (device.pausado ? 'En pausa' : where ? `Conectado · Escena ${where.numero} · ${where.nombre}` : 'Conectado · esperando')
    : list.length ? 'Toca uno para ver sus opciones' : 'Todavía no se ha unido nadie';
  $('device-pause').innerHTML = `${icon(device?.pausado ? 'play' : 'pause')}<span>${device?.pausado ? 'Liberar' : 'Pausar'}</span>`;
  ['device-pause', 'device-restart', 'device-remove'].forEach(id => { $(id).disabled = !device; });
  syncFade($('device-list'));
}
let noteTimeout = null;
function noteDevice(device, text) {
  clearTimeout(noteTimeout); device.note = text; renderDevices();
  noteTimeout = setTimeout(() => { device.note = ''; renderDevices(); }, 2000);
}
// Educator → one device. The device obeys; nothing comes back but its presence. A test device obeys right here.
const order = (device, accion) => { if (!device.prueba) post({ tipo: 'orden', id: device.id, accion }); };
function applyState(state) {
  if (session.removed) return;
  session.closed = false;
  if (state.edicion !== edicion && PERFILES[state.edicion]) { edicion = state.edicion; dropInstances(); renderWelcome(); }
  session.open = true; session.paused = state.pausa; session.points = state.puntos;
  scenes.forEach(scene => {
    const generation = state.reinicios?.[scene.id] ?? 0;
    if (generation !== scene.generation) { scene.generation = generation; restartScene(scene); }
  });
  const index = scenes.findIndex(scene => scene.id === state.escena);
  if (index >= 0 && (index !== current || !session.scene)) { session.scene = state.escena; goTo(index, { focus: false }); }
  else { renderBar(); renderConsigna(); renderFeedback(); syncBlock(); }
}
// A device's identity: an animal icon for this tab only. Other animals than the test devices', so a real tab is never confused with one.
const ANIMALS = [['Gato', 'coral'], ['Oso', 'grape'], ['León', 'sun'], ['Ballena', 'sky'], ['Koala', 'rose'], ['Ardilla', 'sun']];
function deviceIdentity() {
  try { const saved = JSON.parse(sessionStorage.getItem('playhub-dispositivo')); if (saved?.id) return saved; } catch { /* no storage */ }
  const [nombre, tono] = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const identity = { id: Math.random().toString(36).slice(2, 10), nombre, tono };
  try { sessionStorage.setItem('playhub-dispositivo', JSON.stringify(identity)); } catch { /* no storage */ }
  return identity;
}
const me = mode === 'device' ? deviceIdentity() : null;
let presenceTimer = 0;
const presence = () => post({ tipo: 'presencia', id: me.id, nombre: me.nombre, tono: me.tono, escena: session.open ? active().id : null, pausado: session.held });
// Device: an order from the educator for this device only.
function obey(accion) {
  if (session.removed) return;
  if (accion === 'pausa' || accion === 'libera') session.held = accion === 'pausa';
  else if (accion === 'reinicio') { if (session.open) restartScene(active()); }
  else if (accion === 'quitar') {
    Object.assign(session, { removed: true, open: false, held: false });
    clearInterval(presenceTimer); post({ tipo: 'adios', id: me.id });
    renderBar(); renderConsigna(); renderFeedback(); syncBlock();
    return;
  }
  syncBlock(); presence();
}
if (channel) channel.onmessage = ({ data }) => {
  if (mode === 'educator') {
    if (data.tipo === 'hola') publish();
    else if (data.tipo === 'presencia') { devices.set(data.id, { ...devices.get(data.id), ...data, seen: Date.now() }); renderDevices(); }
    else if (data.tipo === 'adios') { devices.delete(data.id); if (selectedDevice === data.id) selectedDevice = null; renderDevices(); }
  } else if (mode === 'device') {
    if (data.tipo === 'estado') applyState(data);
    else if (data.tipo === 'orden' && data.id === me.id) obey(data.accion);
    else if (data.tipo === 'cierre' && !session.removed) { session.open = false; session.closed = true; renderConsigna(); renderFeedback(); syncBlock(); }
  }
};
if (mode === 'educator') setInterval(() => {
  const now = Date.now(); let changed = false;
  devices.forEach((device, id) => { if (!device.prueba && now - device.seen > 6000) { devices.delete(id); if (selectedDevice === id) selectedDevice = null; changed = true; } });
  if (changed) renderDevices();
}, 2000);
if (mode === 'device') {
  $('participant-name').textContent = me.nombre;
  $('participant-symbol').dataset.tone = me.tono;
  presenceTimer = setInterval(presence, 2000);
  addEventListener('pagehide', () => { if (!session.removed) post({ tipo: 'adios', id: me.id }); });
  post({ tipo: 'hola' }); presence();
}

// ---- Guide (educator): the guide of the current scene, in four tabs.
// Empty or "no requiere" fields are left out; Mecánica shows "Pendiente" until the guide fills it. Material lives outside the player.
const GUIDE_PENDING = 'Pendiente';
const guideSections = {
  escena: guide => [
    { label: 'Objetivo', icon: 'compass', text: guide.objective, callout: true },
    { label: 'Descripción', icon: 'book', text: guide.description },
    { label: 'Mecánica', icon: 'grid', text: guide.mechanic || GUIDE_PENDING },
  ],
  conducir: guide => [{ label: 'Pedagogía', icon: 'chat', text: guide.pedagogy }],
  preguntas: guide => [{ label: 'Preguntas e interacciones', icon: 'chat', text: guide.questions, questions: true }, { label: 'Psicología', icon: 'heart', text: guide.psychology }],
  consejos: guide => [
    { label: 'Consejos', icon: 'sparkles', text: guide.tips },
    { label: 'Lo que esta escena no hace', icon: 'warning', text: guide.notDoing },
    { label: 'Científico', icon: 'info', text: guide.science },
  ],
};
let guideTab = 'escena';
const make = (tag, className, text) => Object.assign(document.createElement(tag), { className, ...(text !== undefined && { textContent: text }) });
function splitQuestions(text) {
  const questions = [...text.matchAll(/“([^”]*\?)”/g)].map(match => match[1]);
  const rest = text.split(/(?<=[.…])\s+(?=[A-ZÁÉÍÓÚÑ])/).filter(sentence => !questions.some(question => sentence.includes(question))).join(' ');
  return { questions, rest };
}
function guideBlock({ label, icon: name, text, callout, questions }) {
  const block = make('section', callout ? 'guide-block guide-callout' : 'guide-block');
  const heading = make('h3', 'guide-label');
  heading.innerHTML = icon(name); heading.append(label);
  block.append(heading);
  if (questions) {
    const { questions: list, rest } = splitQuestions(text);
    if (list.length) { const ul = make('ul', 'guide-questions'); list.forEach(question => ul.append(make('li', '', question))); block.append(ul); }
    if (rest || !list.length) block.append(make('p', '', list.length ? rest : text));
  } else block.append(make('p', text === GUIDE_PENDING ? 'is-pending' : '', text));
  return block;
}
// Long text scrolls without a visible scrollbar; a soft fade tells there is more below.
function syncFade(element) {
  element.dataset.more = String(element.scrollTop + element.clientHeight < element.scrollHeight - 2);
}
function renderGuide() {
  const scene = active(), guide = scene.guia;
  $('guide').dataset.area = storyboard.area;
  $('guide-area').textContent = storyboard.areaLabel; $('guide-area').dataset.area = storyboard.area;
  $('guide-verb').textContent = scene.verbo;
  $('guide-scene').textContent = `Escena ${scene.numero} de ${storyboard.totalEscenas}`;
  $('guide-title').textContent = scene.nombre;
  $('guide-subtitle').textContent = guide.subtitle;
  document.querySelectorAll('#guide [role=tab]').forEach(tab => {
    const selected = tab.dataset.section === guideTab;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
  });
  $('guide-body').setAttribute('aria-labelledby', `guide-tab-${guideTab}`);
  const isEmpty = text => !text || /^no requiere/i.test(text);
  const blocks = guideSections[guideTab](guide).filter(item => !isEmpty(item.text)).map(guideBlock);
  if (edicion !== 'infantil') blocks.unshift(guideBlock({ label: 'Guía pendiente', icon: 'info', text: `La guía de ${PERFILES[edicion].nombre} todavía no existe; se muestra la de Infantil.`, callout: true }));
  $('guide-body').replaceChildren(...blocks);
  $('guide-body').scrollTop = 0;
  syncFade($('guide-body'));
}
function setGuide(open) {
  guideOpen = open;
  if (open && devicesOpen) setDevices(false, { restoreFocus: false });
  $('guide').hidden = !open;
  $('guide-button').setAttribute('aria-expanded', String(open));
  setPause('guide', open);
  renderConsigna();
  if (open) { renderGuide(); $('guide-close').focus({ preventScroll: true }); } else $('guide-button').focus({ preventScroll: true });
}

// ---- Quick settings rail and devices panel (educator)
function setRail(open, { restoreFocus = true } = {}) {
  railOpen = open;
  if (!open && devicesOpen) setDevices(false, { restoreFocus: false });
  $('quick-rail').hidden = !open;
  $('settings-button').setAttribute('aria-expanded', String(open));
  $('settings-button').setAttribute('aria-label', open ? 'Cerrar ajustes rápidos' : 'Ajustes rápidos');
  $('settings-button').innerHTML = icon(open ? 'close' : 'settings');   // the rail has no close button of its own
  setPause('rail', open);
  if (open) $('sound-button').focus({ preventScroll: true });
  else if (restoreFocus) $('settings-button').focus({ preventScroll: true });
}
function setDevices(open, { restoreFocus = true } = {}) {
  devicesOpen = open;
  if (open && guideOpen) setGuide(false);
  $('devices-panel').hidden = !open;
  if (!open) selectedDevice = null;
  renderDevices();
  $('devices-button').setAttribute('aria-expanded', String(open));
  $('devices-button').dataset.tone = open ? 'sky' : 'neutral';
  setPause('devices', open);
  renderConsigna();
  if (open) $('devices-close').focus({ preventScroll: true });
  else if (restoreFocus && railOpen) $('devices-button').focus({ preventScroll: true });
}
function setMuted(value) {
  muted = value;
  $('sound-button').setAttribute('aria-pressed', String(muted));
  $('sound-button').setAttribute('aria-label', muted ? 'Activar sonido (M)' : 'Silenciar (M)');
  $('sound-button').title = muted ? 'Activar sonido (M)' : 'Silenciar (M)';
  $('sound-button').innerHTML = icon(muted ? 'muted' : 'sound');
}
async function toggleFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { announce('Este navegador no permite pantalla completa.'); }
}
document.addEventListener('fullscreenchange', () => {
  const on = Boolean(document.fullscreenElement), label = on ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)';
  $('fullscreen-button').innerHTML = icon(on ? 'compress' : 'expand');
  $('fullscreen-button').setAttribute('aria-pressed', String(on));
  $('fullscreen-button').setAttribute('aria-label', label); $('fullscreen-button').title = label;
});
// Interface motion follows the system preference (styles.css honours data-motion=off).
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const syncMotion = () => { document.documentElement.dataset.motion = reducedMotion.matches ? 'off' : 'on'; };
reducedMotion.addEventListener('change', syncMotion);

// ---- Dialogs
function openDialog(id, origin) { dialogOrigin = origin || document.activeElement; setPause('dialog', true); $(id).showModal(); }
// A confirmation window: what it is about (caption), the question, what happens, and, when it helps, a summary.
function confirm({ title, description, label, symbol, action, tone = 'lime', caption = workshopCaption(), stats = [] }, origin) {
  $('confirm-action').dataset.tone = tone; $('confirm-icon').dataset.tone = tone;
  $('confirm-caption').textContent = caption;
  $('confirm-title').textContent = title; $('confirm-description').textContent = description;
  $('confirm-stats').hidden = !stats.length;
  $('confirm-stats').replaceChildren(...stats.map(([name, value]) => {
    const box = document.createElement('div'), label = document.createElement('p'), figure = document.createElement('p');
    box.className = 'window-box'; label.className = 'panel-label'; figure.className = 'window-figure';
    label.textContent = name; figure.textContent = value;
    box.append(label, figure);
    return box;
  }));
  $('confirm-action').textContent = label; $('confirm-icon').innerHTML = icon(symbol); confirmAction = action;
  openDialog('confirm-dialog', origin);
}
document.querySelectorAll('[data-dismiss]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => {
  setPause('dialog', false);
  if (dialogOrigin?.isConnected) dialogOrigin.focus({ preventScroll: true });
  dialogOrigin = null;
}));
$('confirm-action').addEventListener('click', () => {
  const action = confirmAction; confirmAction = null;
  $('confirm-dialog').addEventListener('close', () => action?.(), { once: true });
  $('confirm-dialog').close();
});

// ---- Wiring
$('exit').addEventListener('click', event => confirm({ title: '¿Salimos del taller?', description: mode === 'educator' ? 'El taller se cierra en esta pantalla y en los dispositivos conectados.' : 'Puedes volver a empezar cuando quieras.', label: 'Salir', symbol: 'exit', tone: 'coral', stats: [['Escena', `${current + 1} de ${scenes.length}`]], action: leave }, event.currentTarget));
$('points-counter').addEventListener('click', event => openDialog('points-dialog', event.currentTarget));
$('settings-button').addEventListener('click', () => setRail(!railOpen));
$('sound-button').addEventListener('click', () => setMuted(!muted));
$('fullscreen-button').addEventListener('click', toggleFullscreen);
$('devices-button').addEventListener('click', () => setDevices(!devicesOpen));
$('devices-close').addEventListener('click', () => setDevices(false));
$('device-list').addEventListener('click', event => {
  const id = event.target.closest('[data-device]')?.dataset.device;
  if (!id) return;
  selectedDevice = selectedDevice === id ? null : id; renderDevices();
});
$('device-pause').addEventListener('click', () => {
  const device = devices.get(selectedDevice); if (!device) return;
  device.pausado = !device.pausado; order(device, device.pausado ? 'pausa' : 'libera');
  noteDevice(device, device.pausado ? 'En pausa' : 'Liberado');
});
$('device-restart').addEventListener('click', () => {
  const device = devices.get(selectedDevice); if (!device) return;
  order(device, 'reinicio');
  const where = sceneOf(device);
  noteDevice(device, where ? `Escena ${where.numero} reiniciada en este dispositivo` : 'Reiniciado');
});
$('device-remove').addEventListener('click', event => {
  const device = devices.get(selectedDevice); if (!device) return;
  confirm({ title: `¿Quitamos a ${device.nombre}?`, description: 'El dispositivo sale del taller. Puede volver a entrar con el código.', label: 'Quitar', symbol: 'close', tone: 'coral', caption: 'Dispositivos', action: () => {
    order(device, 'quitar'); devices.delete(device.id); selectedDevice = null; renderDevices();
  } }, event.currentTarget);
});
$('device-list').addEventListener('scroll', () => syncFade($('device-list')));
$('guide-button').addEventListener('click', () => setGuide(!guideOpen));
$('guide-close').addEventListener('click', () => setGuide(false));
document.querySelectorAll('#guide [role=tab]').forEach(tab => tab.addEventListener('click', () => { guideTab = tab.dataset.section; renderGuide(); }));
// Arrows move between the guide's tabs (and never change the scene while a tab has the focus).
$('guide-tabs').addEventListener('keydown', event => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  event.preventDefault(); event.stopPropagation();
  const tabs = [...document.querySelectorAll('#guide [role=tab]')], index = tabs.findIndex(tab => tab.dataset.section === guideTab);
  guideTab = tabs[(index + step + tabs.length) % tabs.length].dataset.section; renderGuide();
  $(`guide-tab-${guideTab}`).focus();
});
$('guide-body').addEventListener('scroll', () => syncFade($('guide-body')));
$('time-counter').addEventListener('click', () => setPause('manual', !pauseReasons.has('manual')));
const resume = () => setPause('manual', false);
$('overlay-action').addEventListener('click', resume);
$('overlay-close').addEventListener('click', resume);
$('feedback-close').addEventListener('click', () => closeFeedback());
$('feedback-listen').addEventListener('click', () => announce($('feedback-title').textContent));     // audio pending
$('consigna-listen').addEventListener('click', () => announce($('consigna-text').textContent));     // audio pending
$('restart-button').addEventListener('click', event => {
  const scene = active();
  confirm({ title: '¿Reiniciamos esta escena?', description: 'El juego vuelve a empezar. Los puntos ya ganados se conservan.', label: 'Reiniciar', symbol: 'retry', tone: 'sun', caption: sceneCaption(), action: () => {
    scene.generation += 1; restartScene(scene); publish();
  } }, event.currentTarget);
});
$('previous-button').addEventListener('click', previous);
$('next-button').addEventListener('click', next);
document.addEventListener('pointerdown', event => {
  if (!railOpen || devicesOpen || event.target.closest('#quick-rail, #settings-button')) return;
  setRail(false);
});
// Keyboard: presenter clickers send PageDown / PageUp. A device has no keys of its own.
document.addEventListener('keydown', event => {
  if (mode === 'device' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (document.querySelector('dialog[open]')) return;
  const key = event.key;
  const sheetOpen = Boolean(active().message) && !guideOpen && !devicesOpen && !railOpen;
  if (key === 'Escape') {
    if (devicesOpen) setDevices(false); else if (railOpen) setRail(false); else if (guideOpen) setGuide(false); else if (sheetOpen) closeFeedback();
    else if (overlayKind() === 'paused') resume();
    return;
  }
  // The other keys are left to the guide's tabs and to any field that has the focus.
  if (event.target.closest?.('input, select, textarea, [contenteditable], [role=tablist]')) return;
  // With the feedback open, the presenter's next/previous close it and move on in one step.
  if (sheetOpen && ['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp'].includes(key)) closeFeedback({ focus: false });
  const actions = {
    ArrowRight: next, PageDown: next, ArrowLeft: mode === 'educator' ? previous : null, PageUp: mode === 'educator' ? previous : null,
    p: mode === 'educator' ? () => setPause('manual', !pauseReasons.has('manual')) : null,
    g: mode === 'educator' ? () => setGuide(!guideOpen) : null, m: () => setMuted(!muted), f: toggleFullscreen,
  };
  const action = actions[key.length === 1 ? key.toLowerCase() : key];
  if (action) { event.preventDefault(); action(); }
});

// ---- Scene time (educator): it stops while the board is blocked.
setInterval(() => {
  const now = performance.now(), delta = now - lastTick, scene = active();
  lastTick = now;
  if (mode !== 'educator' || !isTemplate(scene) || isBlocked() || scene.completed) return;
  scene.elapsed += delta; $('elapsed').textContent = formatClock(scene.elapsed);
}, 200);

// ---- Touch and zoom blockers (the CSS half lives on .player-page)
const block = event => event.preventDefault();
['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'dragstart', 'dblclick'].forEach(type => document.addEventListener(type, block));
addEventListener('wheel', event => { if (event.ctrlKey) event.preventDefault(); }, { passive: false });
new ResizeObserver(() => fitFrame()).observe(probe);
coarse.addEventListener('change', fitFrame);
document.addEventListener('visibilitychange', () => { if (mode !== 'device') setPause('hidden', document.hidden); });

fitFrame(); renderWelcome(); setMuted(false); syncMotion();
if (mode === 'educator') renderDevices();
if (mode === 'device') { renderBar(); renderConsigna(); syncBlock(); $('welcome').hidden = false; }
else goTo(Math.max(0, scenes.findIndex(scene => scene.id === params.get('escena'))), { focus: false });
