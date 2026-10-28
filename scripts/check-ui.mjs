#!/usr/bin/env node
// Comprueba que las vistas de las apps respetan el UI Kit (packages/ui/DESIGN.md, «Profundidad»,
// «Roles de color» y «Navegación»): sin pasos de paleta, hex, sombras o anillos de Tailwind, tamaños
// sueltos, SVG en línea, enlaces de vuelta ni diálogos del navegador. El color y el relieve salen de
// roles, data-tone y los Ui*; las confirmaciones, de UiConfirmDialog/UiDialog.
//
// Revisa .vue y .ts bajo apps/*/app. El CSS de cada app queda fuera: es donde se componen tokens.
// Excepción legítima: un comentario `ui-allow: <motivo>` en la misma línea o en la anterior.
//
// Uso: node scripts/check-ui.mjs   (sale con 1 si encuentra algo)

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const APPS = ['admin', 'player', 'educators']
const PALETTE = '(?:lime|sun|sky|coral|grape|rose|night|mint|white|black)'
const B = '(?<![\\w-])'
const E = '(?![\\w-])'

const RULES = [
  { name: 'paso de paleta (usa un rol o data-tone)', re: new RegExp(`${B}(?:[a-z-]+:)*!?(?:bg|text|border(?:-[trblxy])?|ring|fill|stroke|divide|outline|from|to|via|accent|decoration|caret|placeholder)-${PALETTE}(?:-\\d+)?(?:/\\d+)?${E}`, 'g') },
  { name: 'color hex (usa un token)', re: /\[#[0-9a-fA-F]{3,8}\]|(?:color|background|border-color):\s*#[0-9a-fA-F]{3,8}/g },
  { name: 'sombra de Tailwind (usa la profundidad del kit)', re: new RegExp(`${B}(?:[a-z-]+:)*!?shadow(?:-(?:sm|md|lg|xl|2xl|inner))?${E}`, 'g') },
  { name: 'anillo de Tailwind (usa borde o la base del kit)', re: new RegExp(`${B}(?:[a-z-]+:)*!?ring(?:-\\d+|-\\[[^\\]]+\\]|-inset|-offset(?:-\\d+)?|-${PALETTE}(?:-\\d+)?)?${E}`, 'g') },
  { name: 'tamaño de texto suelto (usa la escala del kit)', re: new RegExp(`${B}(?:[a-z-]+:)*!?text-\\[\\d[^\\]]*\\]`, 'g') },
  { name: 'radio suelto (usa los radios del kit)', re: new RegExp(`${B}(?:[a-z-]+:)*!?rounded(?:-[a-z]{1,2})?-\\[\\d[^\\]]*\\]`, 'g') },
  { name: 'SVG en línea (usa UiIcon)', re: /<svg\b/g },
  // «← Storyboards» encima del título: se vuelve con la navegación de la app (DESIGN.md, «Navegación»).
  // Un icono de flecha atrás dentro de texto o en algo que navega es un enlace de vuelta; los botones de
  // anterior/siguiente sin destino (escena, semana) no navegan y pasan.
  // confirm/alert/prompt del navegador rompen el sistema de diseño. Una función propia que abre un
  // diálogo del kit con un objeto (`confirm({ … })`, el runner de Player) no es nativa y pasa.
  { name: 'diálogo del navegador (usa UiConfirmDialog o UiDialog)', re: /(?<![\w.$])(?<!function )(?:window\.)?(?:confirm|alert|prompt)\((?!\{)/g },
  { name: 'enlace de vuelta (usa la navegación de la app)', re: /<UiIcon\s+name="arrow-left"|(?:\sto=|\shref=|<NuxtLink|<a\s)[^\n]*(?:icon|name)="arrow-left"|(?:icon|name)="arrow-left"[^\n]*(?:\sto=|\shref=)/g },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(vue|ts)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(path)
  }
  return out
}

const findings = []
for (const app of APPS) {
  const dir = join(ROOT, 'apps', app, 'app')
  for (const file of walk(dir)) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (line.includes('ui-allow') || lines[i - 1]?.includes('ui-allow')) return
      for (const rule of RULES) {
        for (const m of line.matchAll(rule.re)) {
          findings.push(`${relative(ROOT, file)}:${i + 1}  ${rule.name}: ${m[0]}`)
        }
      }
    })
  }
}

if (findings.length) {
  console.log(`✗ UI Kit: ${findings.length} usos fuera del sistema`)
  for (const f of findings) console.log(`  ${f}`)
  process.exit(1)
}
console.log('✓ UI Kit: las vistas usan roles, tonos y componentes del kit')
