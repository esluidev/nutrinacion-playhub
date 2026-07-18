import { tr } from '~/types/i18n'
import type { StoryboardDef } from '~/types/scene'
import type { Storyboard, PublicationStatus, Propiedad, TipoStoryboard, SceneGuide } from '~/types/storyboard'

// ─────────────────────────────────────────────────────────────────────────────
// Capa de datos de storyboards. DOS fuentes, nunca duplicadas:
//
//  1. BUILD (fuente de verdad compilada): los storyboard.json de content/ vía
//     glob. TODO lo build-owned (idiomas, escenas, categoría, audiencia, clave,
//     título base) se deriva EN VIVO de aquí — si el json cambia, la UI cambia.
//  2. CATÁLOGO (representación de la fila `storyboards` de Supabase): estado,
//     propiedad, duración, países, portada, textos editados y guías por escena
//     + el SNAPSHOT registrado de lo build-owned (para detectar drift). Mock en
//     memoria hoy; al conectar Supabase este es el único punto a cambiar.
//
// Las páginas consumen la VISTA (build vivo + fila de catálogo unidos por
// `clave`). Regla 6 de CLAUDE.md: todo acceso a datos pasa por este composable.
// ─────────────────────────────────────────────────────────────────────────────

const buildModules = import.meta.glob<{ default: StoryboardDef }>(
  '../../content/storyboards/*/*/storyboard.json',
  { eager: true },
)

const BUILDS = Object.values(buildModules).map((m) => {
  const def = m.default
  return { def, tipo: def.type.toLowerCase().replace(/_/g, '-') as TipoStoryboard }
})

// Filas de catálogo sembradas (espejo de Supabase). SOLO catálogo-owned +
// snapshot registrado; lo que se vea distinto al build es drift real.
const CATALOG_SEED: Storyboard[] = [
  {
    id: 'los-frijoles',
    clave: '739230af-d56d-4bc4-a39a-8245157ac928',
    title: 'Los Frijoles',
    description: 'Los ninos descubren que son los frijoles, sus diferentes colores y formas, y por que son importantes para su cuerpo. A traves de juegos interactivos y experiencias guiadas por el educador, aprenden como los frijoles ayudan a tener energia, fortalecer el cuerpo y crecer saludables.',
    tipo: 'alimentacion',
    categoria: 'prevencion',
    audience: 'KIDS',
    duration: '30 min',
    languages: ['es'],
    status: 'publicado',
    propiedad: 'estandar',
    paises: [],
    coverColor: 'bg-emerald-500',
    sceneCount: 7,
    scenes: [
      { folder: 'bienvenida', title: 'Bienvenida' },
      { folder: 'descubrimiento', title: 'La Ruleta de los Frijoles' },
      { folder: 'propiedades', title: 'Los Super Poderes' },
      { folder: 'pausa-hidratacion', title: 'Pausa de Agua' },
      { folder: 'preparacion', title: 'A Cocinar' },
      { folder: 'retroalimentacion', title: 'Cuanto Aprendimos' },
      { folder: 'despedida', title: 'Hasta Pronto' },
    ],
  },
  {
    id: 'el-huevo',
    clave: '6f375f8d-0467-4dd2-958a-91d6d6d1c060',
    title: 'El Huevo',
    description: 'Los ninos exploran que es un huevo, que nutrientes contiene y por que es un alimento valioso para su crecimiento y bienestar. A traves de actividades gamificadas descubren como el huevo aporta energia, ayuda al desarrollo de musculos, apoya la vista y contribuye a estar sanos y activos.',
    tipo: 'alimentacion',
    categoria: 'prevencion',
    audience: 'KIDS',
    duration: '30 min',
    languages: ['es'],
    status: 'publicado',
    propiedad: 'estandar',
    paises: [],
    coverColor: 'bg-amber-500',
    sceneCount: 7,
    scenes: [
      { folder: 'bienvenida', title: 'Bienvenida' },
      { folder: 'descubrimiento', title: 'La Ruleta de los Huevos' },
      { folder: 'propiedades', title: 'Las Partes del Huevo' },
      { folder: 'pausa-hidratacion', title: 'Pausa de Agua' },
      { folder: 'preparacion', title: 'A Cocinar' },
      { folder: 'retroalimentacion', title: 'Cuanto Aprendimos' },
      { folder: 'despedida', title: 'Hasta Pronto' },
    ],
  },
  {
    id: 'piernas-fuertes',
    clave: '1a0b6d7a-77ba-4b75-86ad-c283e6e8510e',
    title: 'Piernas Fuertes',
    description: 'Los ninos desarrollan fuerza y estabilidad en las piernas con movimientos guiados, dinamicos y seguros: activacion suave, rondas de energia al ritmo, secuencias de coordinacion y una recuperacion con respiracion guiada, con pausas de hidratacion que evitan el sobreesfuerzo.',
    tipo: 'actividad-fisica',
    categoria: 'prevencion',
    audience: 'KIDS',
    duration: '30 min',
    languages: ['es', 'en'],
    status: 'en_revision',
    propiedad: 'estandar',
    paises: [],
    coverColor: 'bg-sky-500',
    sceneCount: 7,
    scenes: [
      { folder: 'bienvenida', title: 'Bienvenida' },
      { folder: 'motricidad', title: 'Despertar el Cuerpo' },
      { folder: 'resistencia', title: 'Rondas de Energia' },
      { folder: 'pausa-hidratacion', title: 'Pausa de Agua' },
      { folder: 'coordinacion', title: 'La Coreografia' },
      { folder: 'recuperacion', title: 'Calma el Cuerpo' },
      { folder: 'despedida', title: 'Hasta Pronto' },
    ],
  },
  {
    id: 'buena-postura',
    clave: 'a06e4000-42b3-4a7b-bdff-29200e2f4ebb',
    title: 'Creciendo con Buena Postura',
    description: 'Los ninos aprenden a mantener una postura correcta al sentarse, caminar y moverse mediante actividades guiadas, dinamicas y seguras: activacion lenta con equilibrio, rondas dinamicas con la espalda firme, coreografias veloces de coordinacion y una recuperacion que suelta la espalda, con pausa de hidratacion.',
    tipo: 'actividad-fisica',
    categoria: 'prevencion',
    audience: 'KIDS',
    duration: '30 min',
    languages: ['es', 'en'],
    status: 'en_revision',
    propiedad: 'estandar',
    paises: [],
    coverColor: 'bg-teal-500',
    sceneCount: 7,
    scenes: [
      { folder: 'bienvenida', title: 'Bienvenida' },
      { folder: 'motricidad', title: 'Quedate Asi' },
      { folder: 'resistencia', title: 'El Semaforo' },
      { folder: 'pausa-hidratacion', title: 'Pausa de Agua' },
      { folder: 'coordinacion', title: 'Sigue al Lider' },
      { folder: 'recuperacion', title: 'Crece como un Arbol' },
      { folder: 'despedida', title: 'Hasta Pronto' },
    ],
  },
  {
    id: 'la-sopa-de-verduras',
    clave: '0335380e-c7be-4915-a810-a7f81e938598',
    title: 'La Sopa de Verduras',
    description: 'Los niños reconocen que el color, olor, textura o sabor de la sopa pueden provocar curiosidad, sorpresa, desagrado o enojo. Practican una pausa de hidratación, la secuencia alto-respira-habla y un plan personal para expresar lo que sienten con respeto, sin presión ni juicios.',
    tipo: 'salud-emocional',
    categoria: 'bienestar',
    audience: 'KIDS',
    duration: '30 min',
    languages: ['es', 'en'],
    status: 'en_revision',
    propiedad: 'estandar',
    paises: [],
    coverColor: 'bg-rose-500',
    sceneCount: 6,
    scenes: [
      { folder: 'bienvenida', title: 'Bienvenida' },
      { folder: 'emociones', title: 'Que sientes tu' },
      { folder: 'pausa-hidratacion', title: 'Pausa de Agua' },
      { folder: 'autocontrol', title: 'Alto, Respira y Habla' },
      { folder: 'reflexion', title: 'Mi Plan Tranquilo' },
      { folder: 'despedida', title: 'Hasta Pronto' },
    ],
  },
  {
    id: 'la-insulina',
    clave: 'fe638261-c023-40e8-8099-d66fa0697957',
    title: 'La Insulina: Energia con Cuidado',
    description: 'Los ninos descubren de forma sencilla que es la insulina y como ayuda al cuerpo a usar la energia de los alimentos: la llave de la energia, una pausa activa, un dia completo de buenos cuidados (horarios, adulto, agua, refri) y un repaso por estrellas, con tono tranquilo y cercano.',
    tipo: 'cuidado-personal',
    categoria: 'diabetes',
    audience: 'KIDS',
    duration: '25 min',
    languages: ['es', 'en'],
    status: 'en_revision',
    propiedad: 'estandar',
    paises: [],
    coverColor: 'bg-indigo-500',
    sceneCount: 6,
    scenes: [
      { folder: 'bienvenida', title: 'Bienvenida' },
      { folder: 'descubrimiento', title: 'La Llave de la Energia' },
      { folder: 'pausa-activa', title: 'Pausa en Movimiento' },
      { folder: 'autocuidado', title: 'Un Dia con la Insulina' },
      { folder: 'retroalimentacion', title: 'Las Estrellas del Cuidado' },
      { folder: 'despedida', title: 'Hasta Pronto' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Label / badge helpers
// ─────────────────────────────────────────────────────────────────────────────

// Must match the UiBadge variant prop union
export type BadgeVariant = 'green' | 'blue' | 'red' | 'gray' | 'coral' | 'purple' | 'yellow' | 'teal'

const STATUS_LABELS: Record<PublicationStatus, string> = {
  borrador: 'Borrador',
  en_revision: 'En Revision',
  publicado: 'Publicado',
  archivado: 'Archivado',
}

const STATUS_BADGE_VARIANTS: Record<PublicationStatus, BadgeVariant> = {
  borrador: 'gray',
  en_revision: 'yellow',
  publicado: 'green',
  archivado: 'coral',
}

const PROPIEDAD_LABELS: Record<Propiedad, string> = {
  estandar: 'Estándar',
  personalizado: 'Personalizado',
}

const PROPIEDAD_BADGE_VARIANTS: Record<Propiedad, BadgeVariant> = {
  estandar: 'blue',
  personalizado: 'teal',
}

const TIPO_LABELS: Record<TipoStoryboard, string> = {
  'alimentacion': 'Alimentación',
  'actividad-fisica': 'Actividad física',
  'cuidado-personal': 'Cuidado personal',
  'salud-emocional': 'Salud emocional',
}

const AUDIENCE_LABELS: Record<string, string> = {
  KIDS: 'Niños',
  PREADOLESCENTES: 'Preadolescentes',
  ADOLESCENTES: 'Adolescentes',
  ADULTOS: 'Adultos',
}

// Categorías bajo cada tipo (categorias_storyboard): el build declara el codigo
// estable; el label real vendrá del catálogo al conectar Supabase.
const CATEGORIA_LABELS: Record<string, string> = {
  PREVENCION: 'Prevención',
  DIABETES: 'Diabetes',
  BIENESTAR: 'Bienestar',
}

// El build usa codigos MAYUSCULA_GUION_BAJO; el catálogo mock, minuscula-guion.
const toCode = (s?: string) => (s ?? '').toUpperCase().replace(/-/g, '_')

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────

// VISTA = build vivo + fila de catálogo. Lo build-owned sale SIEMPRE del json;
// del catálogo salen los campos de gestión y las guías por escena.
function toView(def: StoryboardDef, tipo: TipoStoryboard, row: Storyboard | undefined): Storyboard {
  return {
    id: def.slug,
    clave: def.key,
    title: row?.title || tr(def.title, 'es'),
    description: row?.description ?? '',
    tipo,
    categoria: def.category ? def.category.toLowerCase().replace(/_/g, '-') : undefined,
    audience: def.audience,
    duration: row?.duration ?? '',
    languages: [...(def.languages ?? ['es'])],
    status: row?.status ?? 'borrador', // sin fila = compilado, sin registrar
    propiedad: row?.propiedad ?? 'estandar',
    organizacion: row?.organizacion,
    paises: [...(row?.paises ?? [])],
    objetivo: row?.objetivo,
    bibliografia: row?.bibliografia,
    coverColor: row?.coverColor ?? 'bg-emerald-500',
    sceneCount: def.scenes.length,
    scenes: def.scenes.map(s => ({
      folder: s.folder,
      title: tr(s.title ?? s.folder, 'es'),
      guia: row?.scenes.find(rs => rs.folder === s.folder)?.guia,
    })),
  }
}

export function useStoryboards() {
  const catalogRows = useState<Storyboard[]>('storyboards-catalog', () => JSON.parse(JSON.stringify(CATALOG_SEED)))

  const storyboards = computed<Storyboard[]>(() =>
    BUILDS.map(b => toView(b.def, b.tipo, rowByClave(b.def.key))))

  function rowByClave(clave: string): Storyboard | undefined {
    return catalogRows.value.find(r => r.clave === clave)
  }

  function getStoryboard(id: string): Storyboard | undefined {
    return storyboards.value.find(sb => sb.id === id)
  }

  // Fila CRUDA del catálogo (snapshot + gestión) — para sembrar formularios y
  // calcular drift. Puede no existir (build compilado sin registro).
  function getCatalogRow(id: string): Storyboard | undefined {
    const b = BUILDS.find(x => x.def.slug === id)
    return b ? rowByClave(b.def.key) : undefined
  }

  // Crea la fila si no existe (primer guardado = registro, sembrado del build).
  function ensureCatalogRow(id: string): Storyboard | undefined {
    const b = BUILDS.find(x => x.def.slug === id)
    if (!b) return undefined
    let row = rowByClave(b.def.key)
    if (!row) {
      row = {
        id: b.def.slug,
        clave: b.def.key,
        title: tr(b.def.title, 'es'),
        description: '',
        tipo: b.tipo,
        categoria: b.def.category ? b.def.category.toLowerCase().replace(/_/g, '-') : undefined,
        audience: b.def.audience,
        duration: '',
        languages: [...(b.def.languages ?? ['es'])],
        status: 'borrador',
        propiedad: 'estandar',
        paises: [],
        coverColor: 'bg-emerald-500',
        sceneCount: b.def.scenes.length,
        scenes: b.def.scenes.map(s => ({ folder: s.folder, title: tr(s.title ?? s.folder, 'es') })),
      }
      catalogRows.value.push(row)
    }
    return row
  }

  function getStoryboardsByTipo(tipo: TipoStoryboard): Storyboard[] {
    return storyboards.value.filter(sb => sb.tipo === tipo)
  }

  // Guarda los campos de catálogo del storyboard (fila `storyboards`). Crea la
  // fila si no existe (registro). Hoy muta el store en memoria; al conectar
  // Supabase, este es el punto de escritura.
  function updateCatalog(storyboardId: string, patch: Partial<Storyboard>) {
    const row = ensureCatalogRow(storyboardId)
    if (row) Object.assign(row, JSON.parse(JSON.stringify(patch)))
  }

  // Reconciliación build ↔ catálogo (003): compara el build VIVO contra el
  // SNAPSHOT registrado en la fila. Guardar en la página de edición sobrescribe
  // el snapshot con el build. Sin fila = sin registro = nada que reconciliar.
  function storyboardDrift(storyboardId: string) {
    const items: { kind: string, label: string }[] = []
    const b = BUILDS.find(x => x.def.slug === storyboardId)
    const row = b ? rowByClave(b.def.key) : undefined
    if (!b || !row) return { has: false, items }
    const def = b.def
    const buildLangs = def.languages ?? ['es']
    const cLangs = row.languages ?? []
    for (const l of buildLangs) if (!cLangs.includes(l)) items.push({ kind: 'lang-add', label: `Idioma +${l.toUpperCase()}` })
    for (const l of cLangs) if (!buildLangs.includes(l)) items.push({ kind: 'lang-remove', label: `Idioma −${l.toUpperCase()}` })
    if (def.scenes.length !== row.sceneCount) items.push({ kind: 'scenes', label: `Escenas ${row.sceneCount} → ${def.scenes.length}` })
    if (def.category && toCode(def.category) !== toCode(row.categoria))
      items.push({ kind: 'categoria', label: `Categoría → ${categoriaLabel(def.category)}` })
    if (def.audience && def.audience !== row.audience)
      items.push({ kind: 'audiencia', label: `Audiencia → ${audienceLabel(def.audience)}` })
    return { has: items.length > 0, items }
  }

  function audienceLabel(audience?: string): string {
    return audience ? (AUDIENCE_LABELS[audience] ?? audience) : '—'
  }

  function categoriaLabel(categoria?: string): string {
    const c = toCode(categoria)
    return c ? (CATEGORIA_LABELS[c] ?? c) : '—'
  }

  // Guarda la guía pedagógica de una escena (storyboard_escenas: descripcion/
  // objetivo/pedagogia/psicologia/cientifico/consejos/mecanica, jsonb Localized).
  // La guía es catálogo-owned: vive en la FILA, no en el build. Hoy muta el
  // store en memoria; al conectar Supabase, este es el punto de escritura.
  function updateSceneGuide(storyboardId: string, folder: string, guia: SceneGuide) {
    const row = ensureCatalogRow(storyboardId)
    if (!row) return
    let scene = row.scenes.find(s => s.folder === folder)
    if (!scene) {
      scene = { folder, title: folder }
      row.scenes.push(scene)
    }
    scene.guia = JSON.parse(JSON.stringify(guia))
  }

  // Completitud de la guía de una escena en un idioma: cuántas de las 7 secciones
  // tienen contenido. `mecanica` cuenta pero no bloquea "completa" (se llena cuando
  // el juego está listo) → completa = las 6 secciones editoriales.
  const GUIDE_SECTIONS: (keyof SceneGuide)[] = ['descripcion', 'objetivo', 'pedagogia', 'psicologia', 'cientifico', 'consejos', 'mecanica']
  function sceneGuideProgress(guia: SceneGuide | undefined, lang: string) {
    const filled = GUIDE_SECTIONS.filter(k => guia?.[k]?.[lang]?.trim()).length
    const editorial = GUIDE_SECTIONS.filter(k => k !== 'mecanica' && guia?.[k]?.[lang]?.trim()).length
    return { filled, total: GUIDE_SECTIONS.length, complete: editorial >= GUIDE_SECTIONS.length - 1 }
  }

  function statusLabel(status: PublicationStatus): string {
    return STATUS_LABELS[status] ?? status
  }

  function statusBadgeVariant(status: PublicationStatus): BadgeVariant {
    return STATUS_BADGE_VARIANTS[status] ?? 'gray'
  }

  function propiedadLabel(propiedad: Propiedad): string {
    return PROPIEDAD_LABELS[propiedad] ?? propiedad
  }

  function propiedadBadgeVariant(propiedad: Propiedad): BadgeVariant {
    return PROPIEDAD_BADGE_VARIANTS[propiedad] ?? 'gray'
  }

  function tipoLabel(tipo: TipoStoryboard): string {
    return TIPO_LABELS[tipo] ?? tipo
  }

  return {
    storyboards,
    getStoryboard,
    getCatalogRow,
    getStoryboardsByTipo,
    updateCatalog,
    storyboardDrift,
    updateSceneGuide,
    sceneGuideProgress,
    audienceLabel,
    categoriaLabel,
    statusLabel,
    statusBadgeVariant,
    propiedadLabel,
    propiedadBadgeVariant,
    tipoLabel,
  }
}
