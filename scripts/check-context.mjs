#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, readlinkSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const required = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'docs/README.md',
  'docs/testing/strategy.md',
  'apps/admin/README.md',
  'apps/admin/AGENTS.md',
  'apps/admin/CLAUDE.md',
  'apps/studio/README.md',
  'apps/studio/AGENTS.md',
  'apps/studio/CLAUDE.md',
  'apps/educators/README.md',
  'apps/educators/AGENTS.md',
  'apps/educators/CLAUDE.md',
]

const failures = []

if (existsSync(join(root, 'qa'))) {
  failures.push('qa/ no debe existir: estrategia en docs/testing y ejecución en la tarea activa')
}

for (const relative of required) {
  if (!existsSync(join(root, relative))) failures.push(`falta ${relative}`)
}

const expectedLinks = new Map([
  ['CLAUDE.md', 'AGENTS.md'],
  ['apps/admin/CLAUDE.md', 'AGENTS.md'],
  ['apps/studio/CLAUDE.md', 'AGENTS.md'],
  ['apps/educators/CLAUDE.md', 'AGENTS.md'],
])

for (const [relative, target] of expectedLinks) {
  const path = join(root, relative)
  if (!existsSync(path)) continue
  if (!lstatSync(path).isSymbolicLink() || readlinkSync(path) !== target) {
    failures.push(`${relative} debe ser symlink a ${target}`)
  }
}

function markdownFiles(relative) {
  const path = join(root, relative)
  if (!existsSync(path)) return []
  if (lstatSync(path).isFile()) return path.endsWith('.md') ? [path] : []
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) return []
    const child = join(relative, entry.name)
    return entry.isDirectory() ? markdownFiles(child) : entry.name.endsWith('.md') ? [join(root, child)] : []
  })
}

const markdownRoots = [
  'README.md',
  'AGENTS.md',
  'docs',
  'apps/admin/README.md',
  'apps/admin/AGENTS.md',
  'apps/studio/README.md',
  'apps/studio/AGENTS.md',
  'apps/studio/scripts/README.md',
  'apps/educators/README.md',
  'apps/educators/AGENTS.md',
]

const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g
for (const file of markdownRoots.flatMap(markdownFiles)) {
  const content = readFileSync(file, 'utf8')
  for (const match of content.matchAll(linkPattern)) {
    const target = match[1].trim().replace(/^<|>$/g, '')
    if (!target || /^(https?:|mailto:|#)/.test(target)) continue
    const decoded = decodeURIComponent(target.split('#', 1)[0])
    if (!decoded) continue
    const resolved = resolve(dirname(file), decoded)
    if (!existsSync(resolved)) failures.push(`enlace roto ${file.slice(root.length + 1)} → ${target}`)
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'))
  process.exit(1)
}

console.log('✓ contexto: archivos, symlinks y enlaces locales')
