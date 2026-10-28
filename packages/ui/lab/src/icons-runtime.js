/* Funciones de la iconografía del laboratorio. scripts/assets.mjs antepone los iconos de ../icons.json y escribe lab/icons.js. */
function icon(name, extra = '') {
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] || icons.info}</svg>`;
}
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    const classes = el.className;
    // Preserve wrappers when the icon is itself a selected-state marker.
    if (classes.includes('selected-mark')) { el.innerHTML = icon(name); el.removeAttribute('data-icon'); }
    else el.outerHTML = icon(name, classes);
  });
}
