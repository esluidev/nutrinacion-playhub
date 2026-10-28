/* PlayHub UI Kit · interacciones de la biblioteca (demo, no controlador de producción). */
hydrateIcons();
// Browser chrome colour comes from the tokens, not from a hex in the HTML.
document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.documentElement).getPropertyValue('--color-night-900').trim();

const gallery = [['home','Inicio'],['arrow-left','Volver'],['close','Cerrar'],['pause','Pausa'],['play','Reproducir'],['sound','Sonido'],['settings','Ajustes'],['info','Información'],['plus','Sumar'],['retry','Reintentar'],['lock','Bloqueado'],['check','Confirmar']];
document.querySelector('#icon-gallery').innerHTML = gallery.map(([name, label]) => `<div class="icon-tile">${icon(name)}<span>${label}</span></div>`).join('');

let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  document.querySelector('#toast-message').textContent = message;
  document.querySelector('#toast').hidden = false;
  toastTimeout = setTimeout(() => { document.querySelector('#toast').hidden = true; }, 4500);
}
document.querySelector('#dismiss-toast').addEventListener('click', () => { document.querySelector('#toast').hidden = true; clearTimeout(toastTimeout); });

// Native dialogs provide modal focus containment and Escape support.
let dialogOrigin = null;
function openDialog(id, trigger) {
  const current = document.querySelector('dialog[open]');
  if (!current) dialogOrigin = trigger;
  else current.close('switch');
  document.querySelector(`#${id}`).showModal();
  document.body.style.overflow = 'hidden';
}
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'switch') { dialog.returnValue = ''; return; }
    document.body.style.overflow = '';
    if (dialogOrigin?.isConnected) dialogOrigin.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
document.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  if (target.hasAttribute('data-close-dialog')) target.closest('dialog')?.close();
  if (target.dataset.openDialog) openDialog(target.dataset.openDialog, target);
  if (target.dataset.toast) showToast(target.dataset.toast);
});

// Filtering is limited to the library; navigation always restores visibility.
let currentFilter = 'all';
const search = document.querySelector('#component-search');
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function filterSections() {
  const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
  let visible = 0;
  document.querySelectorAll('[data-category]').forEach(section => {
    const categoryMatches = currentFilter === 'all' || section.dataset.category === currentFilter;
    const haystack = normalize(`${section.dataset.search} ${section.querySelector('h2').textContent}`);
    section.hidden = !(categoryMatches && terms.every(term => haystack.includes(term)));
    if (!section.hidden) visible++;
  });
  document.querySelector('#empty-results').hidden = visible > 0;
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter)));
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { currentFilter = button.dataset.filter; filterSections(); }));
search.addEventListener('input', filterSections);
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  currentFilter = 'all'; search.value = ''; filterSections();
  document.querySelectorAll('.sidebar-link').forEach(item => {
    if (item.hash === link.hash) item.setAttribute('aria-current', 'location'); else item.removeAttribute('aria-current');
  });
}));
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, select, textarea, [contenteditable], dialog')) { event.preventDefault(); search.focus(); }
});

// Densidad: compacta (apps de gestión, por defecto) o táctil (runner y Educators).
const densitySwitch = document.querySelector('#density-switch');
densitySwitch.addEventListener('click', () => {
  const touch = densitySwitch.getAttribute('aria-checked') !== 'true';
  densitySwitch.setAttribute('aria-checked', String(touch));
  document.documentElement.dataset.density = touch ? 'touch' : 'compact';
});
const motionSwitch = document.querySelector('#motion-switch');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
motionSwitch.setAttribute('aria-checked', String(!reducedMotion));
document.documentElement.dataset.motion = reducedMotion ? 'off' : 'on';
motionSwitch.addEventListener('click', () => {
  const enabled = motionSwitch.getAttribute('aria-checked') !== 'true';
  motionSwitch.setAttribute('aria-checked', String(enabled));
  document.documentElement.dataset.motion = enabled ? 'on' : 'off';
});

let soundEnabled = true;
function setSound(enabled) {
  soundEnabled = enabled;
  document.querySelectorAll('[data-sound-switch]').forEach(button => button.setAttribute('aria-checked', String(enabled)));
  const button = document.querySelector('#sound-button');
  button.setAttribute('aria-pressed', String(enabled));
  button.setAttribute('aria-label', enabled ? 'Silenciar sonido' : 'Activar sonido');
  button.innerHTML = icon(enabled ? 'sound' : 'muted');
}
document.querySelectorAll('[data-sound-switch], #sound-button').forEach(button => button.addEventListener('click', () => { setSound(!soundEnabled); showToast(soundEnabled ? 'Sonido activado en la demo.' : 'Sonido desactivado en la demo.'); }));
// The UI preference is demonstrated without autoplaying or fetching audio.
setSound(true);
document.querySelector('#volume-control').addEventListener('input', event => { document.querySelector('#volume-label').value = `${event.target.value} %`; });

let points = 1250;
let lives = 3;
document.querySelector('#add-points').addEventListener('click', () => { points += 50; document.querySelector('#points-value').value = new Intl.NumberFormat('es-ES', { useGrouping: true }).format(points); });
function updateLives(delta) {
  lives = Math.min(5, Math.max(0, lives + delta));
  document.querySelector('#lives-value').value = lives;
  document.querySelector('#add-life').disabled = lives === 5;
  document.querySelector('#remove-life').disabled = lives === 0;
}
document.querySelector('#add-life').addEventListener('click', () => updateLives(1));
document.querySelector('#remove-life').addEventListener('click', () => updateLives(-1));

let timerRemaining = 150_000;
let timerDeadline = null;
let timerInterval = null;
const timerButton = document.querySelector('#timer-toggle');
function renderTimer() {
  const seconds = Math.ceil(timerRemaining / 1000);
  document.querySelector('#timer-value').value = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  timerButton.innerHTML = icon(timerInterval ? 'pause' : 'play');
  timerButton.setAttribute('aria-label', timerInterval ? 'Pausar temporizador' : 'Iniciar temporizador');
  timerButton.setAttribute('aria-pressed', String(Boolean(timerInterval)));
}
function stopTimer() {
  if (timerDeadline !== null) timerRemaining = Math.max(0, timerDeadline - performance.now());
  clearInterval(timerInterval); timerInterval = null; timerDeadline = null;
  renderTimer();
}
timerButton.addEventListener('click', () => {
  if (timerInterval) { stopTimer(); return; }
  if (timerRemaining === 0) timerRemaining = 150_000;
  timerDeadline = performance.now() + timerRemaining;
  timerInterval = setInterval(() => {
    timerRemaining = Math.max(0, timerDeadline - performance.now());
    if (timerRemaining === 0) { stopTimer(); showToast('El temporizador ha terminado.'); }
    else renderTimer();
  }, 200);
  renderTimer();
});
document.querySelector('#timer-reset').addEventListener('click', () => { stopTimer(); timerRemaining = 150_000; renderTimer(); });

const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const keyIndexes = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (event.key in keyIndexes) { event.preventDefault(); selectTab(tabs[keyIndexes[event.key]], true); }
  });
});
document.querySelectorAll('[data-menu]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-menu]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  showToast(`Menú seleccionado: ${button.dataset.menu}.`);
}));
let page = 1;
function changePage(delta) {
  page = Math.min(4, Math.max(1, page + delta));
  document.querySelector('#page-indicator').innerHTML = `${page} <span class="text-muted">de 4</span>`;
  document.querySelector('#previous-page').disabled = page === 1;
  document.querySelector('#next-page').disabled = page === 4;
}
document.querySelector('#previous-page').addEventListener('click', () => changePage(-1));
document.querySelector('#next-page').addEventListener('click', () => changePage(1));

document.querySelector('#progress-control').addEventListener('input', event => {
  const value = Number(event.target.value);
  const steps = Math.round(value / 100 * 8);
  document.querySelector('#progress-label').value = `${value} %`;
  document.querySelectorAll('#progreso .progress-track').forEach(track => {
    track.setAttribute('aria-valuenow', value);
    track.querySelector('.progress-fill').style.width = `${value}%`;
  });
  document.querySelector('#ring-progress').setAttribute('aria-valuenow', value);
  document.querySelector('.ring-fill').style.strokeDashoffset = 251.327 * (1 - value / 100);
  document.querySelector('#ring-label').innerHTML = `${value}<span class="text-xs">%</span>`;
  document.querySelector('#segmented-progress').setAttribute('aria-valuenow', steps);
  document.querySelector('#step-label').textContent = `${steps} de 8`;
  document.querySelectorAll('.progress-segments span').forEach((span, index) => span.classList.toggle('is-filled', index < steps));
});
document.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-card]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));

const form = document.querySelector('#demo-form');
const nameField = document.querySelector('#display-name');
const quantityField = document.querySelector('#quantity');
const nameHelp = document.querySelector('#name-help');
function clearNameError() {
  nameField.removeAttribute('aria-invalid'); nameHelp.textContent = 'Solo un ejemplo. No se guarda ningún dato.'; nameHelp.style.color = '';
}
nameField.addEventListener('input', clearNameError);
quantityField.addEventListener('input', () => { quantityField.removeAttribute('aria-invalid'); document.querySelector('#quantity-help').hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const validName = Boolean(nameField.value.trim());
  const validQuantity = quantityField.checkValidity();
  if (!validName) {
    nameField.setAttribute('aria-invalid', 'true'); nameHelp.textContent = 'Escribe un nombre para continuar.'; nameHelp.style.color = 'var(--color-danger)';
  }
  if (!validQuantity) { quantityField.setAttribute('aria-invalid', 'true'); document.querySelector('#quantity-help').hidden = false; }
  if (!validName || !validQuantity) { (validName ? quantityField : nameField).focus(); return; }
  showToast('¡Listo! Formulario validado. Los datos no se han guardado.');
});

// ---- Tokens: rendered from the live CSS variables, so the sheet never drifts from tokens.css.
const rootStyle = getComputedStyle(document.documentElement);
const readToken = name => rootStyle.getPropertyValue(name).trim();
const scales = {
  night: [25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950],
  lime: [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900],
  sun: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  coral: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  sky: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  grape: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  rose: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
};
document.querySelector('#palette-grid').innerHTML = Object.entries(scales).map(([hue, steps]) => `
  <div class="grid grid-cols-[64px_1fr] items-center gap-3">
    <span class="text-xs font-black capitalize">${hue}</span>
    <div class="grid gap-1.5" style="grid-template-columns:repeat(${steps.length},minmax(0,1fr))">${steps.map(step => {
      const name = `--color-${hue}-${step}`;
      const [r, g, b] = (readToken(name).match(/\w\w/g) || ['ff','ff','ff']).map(x => parseInt(x, 16) / 255);
      const lin = v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
      const dark = .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b) < .217; // whichever of white or ink contrasts more
      return `<span class="token-chip ${dark ? 'text-inverse' : 'text-ink'}" style="background:var(${name})" title="${name} · ${readToken(name)}">${step}</span>`;
    }).join('')}</div>
  </div>`).join('');

const roles = [['canvas', 'Fondo'], ['surface', 'Superficie'], ['sunken', 'Hundida'], ['line', 'Línea'], ['ink', 'Texto'], ['muted', 'Texto secundario'], ['subtle', 'Texto tenue'], ['focus', 'Foco']];
document.querySelector('#role-grid').innerHTML = roles.map(([role, label]) => `
  <div><span class="token-chip border border-line" style="background:var(--color-${role})"></span>
  <p class="mt-2 text-xs font-black">${label}</p><p class="text-[10px] font-semibold text-muted">--color-${role}</p></div>`).join('');

const tones = [['lime', 'Acción principal', 'check'], ['sun', 'Acento · celebrar', 'star'], ['coral', 'Salir · consecuencia', 'exit'], ['sky', 'Información · selección', 'info'], ['grape', 'Novedad', 'sparkles'], ['rose', 'Cuidado · vidas', 'heart'], ['night', 'Contraste', 'play'], ['neutral', 'Secundario', 'settings']];
document.querySelector('#tone-grid').innerHTML = tones.map(([tone, label, symbol]) => `
  <div class="rounded-2xl border border-line p-4" data-tone="${tone}">
    <div class="flex items-center gap-3"><span class="ui-symbol mx-0" style="width:44px;height:44px;border-radius:var(--radius-control)">${icon(symbol)}</span><div><p class="text-sm font-black">${tone}</p><p class="text-[10px] font-semibold text-muted">${label}</p></div></div>
    <div class="mt-4 flex items-center justify-between gap-2"><button class="ui-button ui-button-sm" data-tone="${tone}" data-toast="Tono ${tone}.">Botón</button><span class="badge" data-tone="${tone}">Etiqueta</span></div>
  </div>`).join('');
document.querySelector('#status-grid').innerHTML = [['success', 'Éxito'], ['info', 'Información'], ['warning', 'Advertencia'], ['danger', 'Error']]
  .map(([tone, label]) => `<span class="badge" data-tone="${tone}">${label} · ${tone}</span>`).join('');

// ---- Deep link for reviews: ?section=tokens shows a single family.
const pageParams = new URL(location.href).searchParams;
const onlySection = pageParams.get('section');
if (onlySection && document.getElementById(onlySection)) {
  document.querySelectorAll('[data-category]').forEach(section => { section.hidden = section.id !== onlySection; });
}
