// ─────────────────────────────────────────────────────────────────────────────
// Pose data for KidPoseSticker (app/sprites/KidPoseSticker.vue) — v3.
// Each pose is pure geometry over a body rig (head/torso fixed; limbs as
// rounded polylines; shoes placed per pose). Adding a pose = adding data —
// the sprite renders it without new drawing code.
//
// Two AGES share the same pose authoring:
//   'kid'  — infantil (4-8): cabeza grande, cuerpo corto, extremidades cortas
//            y regordetas. ES EL DEFAULT (la audiencia de la plataforma).
//   'teen' — proporción mayor (preadolescentes+), la versión estilizada.
// Las poses se AUTORAN una sola vez sobre el rig teen; las del rig kid se
// derivan escalando cada extremidad desde su anclaje (hombro/cadera), así
// ambas edades se mantienen sincronizadas sin duplicar datos.
//
// Two variants share every rig: 'boy' (shorts) and 'girl' (pigtails + skirt).
// Reusable across storyboards. The kid is the CHILD doing the exercise, not a
// character with personality: it demos movements, it never talks.
// ─────────────────────────────────────────────────────────────────────────────

export type KidPose =
  | 'stand' // de pie, brazos a los lados
  | 'march' // marcha en el lugar (rodilla media)
  | 'knee-up' // rodilla arriba (alta, brazos de corredor)
  | 'jump' // salto suave (en el aire, brazos en V, piernas abiertas)
  | 'side-step' // paso lateral (piernas abiertas, brazos en cruz)
  | 'squat' // doblar rodillas (sentadilla suave, brazos al frente)
  | 'arms-side' // brazos en T lateral (paso intermedio de la tijera al subir)
  | 'balance' // equilibrio: brazos en T + rodilla arriba sostenida (postura)
  | 'stretch-up' // estiramiento hacia arriba (puntas de pies)
  | 'breathe' // respiración (brazos abiertos en diagonal)

export type KidVariant = 'boy' | 'girl'
export type KidAge = 'kid' | 'teen'

export interface ShoePlacement {
  x: number
  y: number
  /** Rotation in degrees around (x, y) */
  r: number
}

export interface KidPoseDef {
  /** Vertical offset of the whole figure (jump lifts it, squat sinks it) */
  dy: number
  /** Horizontal offset of the whole figure (side steps DISPLACE the body:
      izquierda → centro → derecha; sin esto el paso lateral se lee como
      solo abrir las piernas en el sitio) */
  dx?: number
  /** Polyline points "x1,y1 x2,y2 x3,y3" — shoulder → elbow → hand */
  armL: string
  armR: string
  /** Polyline points — hip → knee → ankle */
  legL: string
  legR: string
  shoeL: ShoePlacement
  shoeR: ShoePlacement
}

export interface KidRig {
  viewBox: string
  /** Baja toda la figura para que los pies pisen la misma línea de piso */
  groundOffset: number
  /** Sombra de contacto en el piso (sigue dx; se encoge cuando dy despega) */
  shadow: { cy: number, rx: number, ry: number }
  head: { cx: number, cy: number, r: number }
  /** Peinados con silueta propia (v6): el pelo vive DENTRO de la silueta de la
      cabeza y termina a la altura de la mejilla — si envuelve los lados por
      fuera, el personaje se lee de espaldas. Boy: flequillo despeinado;
      girl: bob con chonguitos altos */
  boyHairPath: string
  girlHairPath: string
  girlBuns: { cx: number, cy: number, r: number }[]
  /** Cara expresiva: ojos grandes con catchlight, cejas, boca abierta + lengua */
  eyes: { cx: number, cy: number, rx: number, ry: number }[]
  brows: string[]
  mouthPath: string
  tongue: { cx: number, cy: number, rx: number, ry: number }
  blush: { cx: number, cy: number, r: number }[]
  /** Brillo de la camiseta (pastilla clara arriba-izquierda) */
  shirtShine: { x: number, y: number, w: number, h: number, rx: number }
  collarPath: string
  torso: { x: number, y: number, w: number, h: number, rx: number }
  /** Calzoneta: UNA pieza limpia con media abertura central abajo (sugiere
      las dos piernas) y esquinas inferiores exteriores poco redondeadas */
  shortsPath: string
  /** Falda con ruedo ondulado */
  skirtPath: string
  limbs: { legInk: number, legSkin: number, armInk: number, armSkin: number }
  shoe: { rx: number, ry: number }
}

/* ── Rigs ───────────────────────────────────────────────────────────────────── */

export const KID_RIGS: Record<KidAge, KidRig> = {
  // Proporción mayor (elementos de cabeza mapeados por afinidad desde el kid:
  // centro (110,64), escala 0.81)
  teen: {
    viewBox: '0 0 220 300',
    groundOffset: 0,
    shadow: { cy: 282, rx: 46, ry: 6.5 },
    head: { cx: 110, cy: 64, r: 34 },
    boyHairPath: 'M79.2,64 C74.4,34.8 92.2,23.5 110,23.5 C127.8,23.5 145.6,34.8 140.8,64 C140.8,51 136.7,46.2 131.1,44.6 C123,41.3 121.4,49.4 110.8,47.8 C99.5,46.2 101.1,38.1 92.2,42.1 C84.9,45.4 80.8,52.7 79.2,64 Z',
    girlHairPath: 'M77.6,70.5 C71.1,33.2 92.2,21.9 110,21.9 C127.8,21.9 148.9,33.2 142.4,70.5 C142.4,55.9 138.4,47.8 131.9,44.6 C134.3,54.3 131.1,58.3 125.4,55.1 C116.5,49.4 103.5,49.4 94.6,55.1 C88.9,58.3 85.7,54.3 88.1,44.6 C81.7,47.8 77.6,55.9 77.6,70.5 Z',
    girlBuns: [{ cx: 66.3, cy: 33.2, r: 12.2 }, { cx: 153.7, cy: 33.2, r: 12.2 }],
    eyes: [{ cx: 96.2, cy: 64.8, rx: 4.2, ry: 5.2 }, { cx: 123.8, cy: 64.8, rx: 4.2, ry: 5.2 }],
    brows: ['M89.8,53.5 Q95.4,49.4 101.1,51.9', 'M118.9,51.9 Q124.6,49.4 130.3,53.5'],
    mouthPath: 'M100.3,73.7 A9.7,8.1 0 0 0 119.7,73.7 Z',
    tongue: { cx: 110, cy: 77.8, rx: 4.9, ry: 2.8 },
    blush: [{ cx: 85.7, cy: 75.3, r: 5.3 }, { cx: 134.3, cy: 75.3, r: 5.3 }],
    shirtShine: { x: 88, y: 106, w: 10, h: 16, rx: 5 },
    collarPath: 'M102,101 Q110,107 118,101',
    torso: { x: 82, y: 100, w: 56, h: 58, rx: 14 },
    shortsPath: 'M92,152 L128,152 Q138,152 138,162 L138,184 Q138,188 134,188 L115,188 Q113,188 113,186 L113,180 Q113,175 110,175 Q107,175 107,180 L107,186 Q107,188 105,188 L86,188 Q82,188 82,184 L82,162 Q82,152 92,152 Z',
    skirtPath: 'M84,152 L136,152 L148,182 Q141,189 133,185 Q127,192 118,188 Q110,193 102,188 Q93,192 87,185 Q79,189 72,182 Z',
    limbs: { legInk: 22, legSkin: 13, armInk: 19, armSkin: 11 },
    shoe: { rx: 15, ry: 9.5 },
  },
  // Infantil (4-8): cabezón, cuerpito corto, extremidades cortas y regordetas
  kid: {
    viewBox: '0 0 220 300',
    groundOffset: 28,
    shadow: { cy: 284, rx: 44, ry: 6.5 },
    head: { cx: 110, cy: 78, r: 42 },
    boyHairPath: 'M72,78 C66,42 88,28 110,28 C132,28 154,42 148,78 C148,62 143,56 136,54 C126,50 124,60 111,58 C97,56 99,46 88,51 C79,55 74,64 72,78 Z',
    girlHairPath: 'M70,86 C62,40 88,26 110,26 C132,26 158,40 150,86 C150,68 145,58 137,54 C140,66 136,71 129,67 C118,60 102,60 91,67 C84,71 80,66 83,54 C75,58 70,68 70,86 Z',
    girlBuns: [{ cx: 56, cy: 40, r: 15 }, { cx: 164, cy: 40, r: 15 }],
    eyes: [{ cx: 93, cy: 79, rx: 5.2, ry: 6.4 }, { cx: 127, cy: 79, rx: 5.2, ry: 6.4 }],
    brows: ['M85,65 Q92,60 99,63', 'M121,63 Q128,60 135,65'],
    mouthPath: 'M98,90 A12,10 0 0 0 122,90 Z',
    tongue: { cx: 110, cy: 95, rx: 6, ry: 3.4 },
    blush: [{ cx: 80, cy: 92, r: 6.5 }, { cx: 140, cy: 92, r: 6.5 }],
    shirtShine: { x: 86, y: 121, w: 10, h: 14, rx: 5 },
    collarPath: 'M101,117 Q110,124 119,117',
    torso: { x: 80, y: 116, w: 60, h: 44, rx: 15 },
    shortsPath: 'M90,154 L130,154 Q140,154 140,164 L140,184 Q140,188 136,188 L116,188 Q114,188 114,186 L114,180 Q114,175 110,175 Q106,175 106,180 L106,186 Q106,188 104,188 L84,188 Q80,188 80,184 L80,164 Q80,154 90,154 Z',
    skirtPath: 'M82,154 L138,154 L150,182 Q143,190 134,185 Q128,193 118,188 Q110,194 102,188 Q92,193 86,185 Q77,190 70,182 Z',
    limbs: { legInk: 24, legSkin: 15, armInk: 21, armSkin: 12.5 },
    shoe: { rx: 16, ry: 10 },
  },
}

/* ── Poses (autoría única, sobre el rig teen) ──────────────────────────────── */

const TEEN_POSES: Record<KidPose, KidPoseDef> = {
  'stand': {
    dy: 0,
    armL: '84,110 80,138 78,164',
    armR: '136,110 140,138 142,164',
    legL: '96,180 96,224 96,264',
    legR: '124,180 124,224 124,264',
    shoeL: { x: 92, y: 272, r: 0 },
    shoeR: { x: 128, y: 272, r: 0 },
  },
  'march': {
    dy: 0,
    armL: '84,110 76,140 70,162',
    armR: '136,110 148,134 158,150',
    // Zancada clara: rodilla bien al frente y pie despegado (si es sutil, al
    // derivar el rig infantil la marcha se vuelve ilegible)
    legL: '96,180 76,206 84,240',
    legR: '124,180 124,224 124,264',
    shoeL: { x: 78, y: 248, r: -22 },
    shoeR: { x: 128, y: 272, r: 0 },
  },
  'knee-up': {
    dy: 0,
    armL: '84,110 70,132 62,110',
    armR: '136,110 150,134 162,120',
    legL: '96,180 78,192 90,228',
    legR: '124,180 124,224 124,264',
    shoeL: { x: 94, y: 236, r: -30 },
    shoeR: { x: 128, y: 272, r: 0 },
  },
  'jump': {
    dy: -20,
    armL: '84,110 70,84 58,58',
    armR: '136,110 150,84 162,58',
    legL: '96,180 88,216 82,248',
    legR: '124,180 132,216 138,248',
    shoeL: { x: 78, y: 256, r: -12 },
    shoeR: { x: 142, y: 256, r: 12 },
  },
  'side-step': {
    // El cuerpo se DESPLAZA hacia el paso (dx): pierna líder estirada al lado,
    // pierna de apoyo casi vertical, brazo líder extendido. El espejo da el
    // paso al otro lado; el tween centro→izquierda→centro→derecha se lee como
    // pasos laterales reales, no como abrir las piernas en el sitio.
    dx: -18,
    dy: 0,
    armL: '84,110 58,110 36,108',
    armR: '136,110 152,122 162,138',
    legL: '96,180 80,216 62,256',
    legR: '124,180 128,220 130,260',
    shoeL: { x: 56, y: 264, r: -14 },
    shoeR: { x: 134, y: 268, r: 6 },
  },
  'squat': {
    dy: 14,
    armL: '84,110 62,118 42,122',
    armR: '136,110 158,118 178,122',
    legL: '96,180 78,210 86,250',
    legR: '124,180 142,210 134,250',
    shoeL: { x: 82, y: 258, r: 0 },
    shoeR: { x: 138, y: 258, r: 0 },
  },
  // Brazos rectos a los lados (T): el fotograma intermedio que convierte
  // "subir los brazos" en una TIJERA lateral — sin él, el tween lleva las
  // manos en línea recta pegadas al cuerpo y se lee como levantar por atrás
  'arms-side': {
    dy: 0,
    armL: '84,110 60,106 36,102',
    armR: '136,110 160,106 184,102',
    legL: '96,180 96,224 96,264',
    legR: '124,180 124,224 124,264',
    shoeL: { x: 92, y: 272, r: 0 },
    shoeR: { x: 128, y: 272, r: 0 },
  },
  // Equilibrio: brazos de avión (T) + una rodilla arriba sostenida — la pose
  // de la postura estable (espalda recta, mirada al frente)
  'balance': {
    dy: 0,
    armL: '84,110 60,106 36,102',
    armR: '136,110 160,106 184,102',
    legL: '96,180 78,192 90,228',
    legR: '124,180 124,224 124,264',
    shoeL: { x: 94, y: 236, r: -30 },
    shoeR: { x: 128, y: 272, r: 0 },
  },
  'stretch-up': {
    dy: 0,
    armL: '84,110 74,72 66,36',
    armR: '136,110 146,72 154,36',
    legL: '96,180 96,222 96,260',
    legR: '124,180 124,222 124,260',
    shoeL: { x: 92, y: 268, r: -14 },
    shoeR: { x: 128, y: 268, r: 14 },
  },
  'breathe': {
    dy: 0,
    armL: '84,110 64,94 48,74',
    armR: '136,110 156,94 172,74',
    legL: '96,180 96,224 96,264',
    legR: '124,180 124,224 124,264',
    shoeL: { x: 92, y: 272, r: 0 },
    shoeR: { x: 128, y: 272, r: 0 },
  },
}

/* ── Derivación del rig infantil ────────────────────────────────────────────── */

// Anclajes de extremidades por edad: hombros (brazos) y caderas (piernas).
// Los puntos de cada extremidad se re-expresan como offsets desde su anclaje
// y se escalan (las extremidades infantiles son ~72% de largo). Los BRAZOS
// infantiles conservan más apertura horizontal (X 0.9): el torso kid es más
// ancho y con el desvío lateral encogido quedarían ocultos detrás de la
// camiseta (se veían como astillas en stand/march).
const LIMB_SCALES = {
  armL: [0.9, 0.72],
  armR: [0.9, 0.72],
  legL: [0.72, 0.72],
  legR: [0.72, 0.72],
} as const

const TEEN_ANCHORS = { armL: [84, 110], armR: [136, 110], legL: [96, 180], legR: [124, 180] } as const
const KID_ANCHORS = { armL: [82, 124], armR: [138, 124], legL: [98, 178], legR: [122, 178] } as const

type LimbKey = keyof typeof TEEN_ANCHORS

function scalePoints(points: string, limb: LimbKey): { scaled: string, ankle: [number, number], teenAnkle: [number, number] } {
  const [tax, tay] = TEEN_ANCHORS[limb]
  const [kax, kay] = KID_ANCHORS[limb]
  const [sx, sy] = LIMB_SCALES[limb]
  const pts = points.trim().split(/\s+/).map((pair) => {
    const [x, y] = pair.split(',').map(Number)
    return [x!, y!] as [number, number]
  })
  const scaled = pts.map(([x, y]) => [
    Math.round((kax + (x - tax) * sx) * 10) / 10,
    Math.round((kay + (y - tay) * sy) * 10) / 10,
  ] as [number, number])
  return {
    scaled: scaled.map(([x, y]) => `${x},${y}`).join(' '),
    ankle: scaled[scaled.length - 1]!,
    teenAnkle: pts[pts.length - 1]!,
  }
}

function toKidPose(def: KidPoseDef): KidPoseDef {
  const armL = scalePoints(def.armL, 'armL')
  const armR = scalePoints(def.armR, 'armR')
  const legL = scalePoints(def.legL, 'legL')
  const legR = scalePoints(def.legR, 'legR')

  const LEG_SCALE = LIMB_SCALES.legL[0]

  function shoeFrom(shoe: ShoePlacement, leg: ReturnType<typeof scalePoints>): ShoePlacement {
    return {
      x: Math.round((leg.ankle[0] + (shoe.x - leg.teenAnkle[0]) * LEG_SCALE) * 10) / 10,
      y: Math.round((leg.ankle[1] + (shoe.y - leg.teenAnkle[1]) * LEG_SCALE) * 10) / 10,
      r: shoe.r,
    }
  }

  return {
    dy: Math.round(def.dy * LEG_SCALE),
    dx: Math.round((def.dx ?? 0) * LEG_SCALE),
    armL: armL.scaled,
    armR: armR.scaled,
    legL: legL.scaled,
    legR: legR.scaled,
    shoeL: shoeFrom(def.shoeL, legL),
    shoeR: shoeFrom(def.shoeR, legR),
  }
}

// Ajustes autorados a mano sobre lo derivado, donde la anatomía infantil
// rompe la derivación:
// - jump / stretch-up: la cabeza gigante taparía las manos → brazos en V
//   diagonal (manos AL LADO de la cabeza, como en la ilustración infantil).
// - knee-up: la rodilla derivada quedaba escondida detrás de la falda/short →
//   rodilla más afuera y abajo del ruedo, bien visible.
const KID_POSE_OVERRIDES: Partial<Record<KidPose, Partial<KidPoseDef>>> = {
  'jump': {
    armL: '82,124 66,104 54,82',
    armR: '138,124 154,104 166,82',
  },
  'stretch-up': {
    armL: '82,124 68,96 58,66',
    armR: '138,124 152,96 162,66',
  },
  'knee-up': {
    legL: '98,178 78,196 94,214',
    shoeL: { x: 99, y: 222, r: -30 },
  },
}

const KID_POSES_KID = Object.fromEntries(
  (Object.entries(TEEN_POSES) as [KidPose, KidPoseDef][]).map(
    ([k, v]) => [k, { ...toKidPose(v), ...(KID_POSE_OVERRIDES[k] ?? {}) }],
  ),
) as Record<KidPose, KidPoseDef>

export const KID_POSES_BY_AGE: Record<KidAge, Record<KidPose, KidPoseDef>> = {
  teen: TEEN_POSES,
  kid: KID_POSES_KID,
}

/** Compat: el set de poses del rig por defecto ('kid') */
export const KID_POSES = KID_POSES_KID

/** Compat: el rig por defecto ('kid') */
export const KID_RIG = KID_RIGS.kid

/* ── Interpolación (animación fluida) ───────────────────────────────────────
   Como cada pose es geometría pura (3 puntos por extremidad + zapatos + dy),
   dos poses cualesquiera se pueden TUINEAR: PoseGuide interpola entre cuadros
   a 60fps y el movimiento se ve continuo, no a saltos. */

const VIEW_W = 220

function parsePts(points: string): [number, number][] {
  return points.trim().split(/\s+/).map((pair) => {
    const [x, y] = pair.split(',').map(Number)
    return [x!, y!] as [number, number]
  })
}

function formatPts(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join(' ')
}

/** Espeja una pose HORNEANDO el volteo en la geometría (x → ancho−x) y
 *  cruzando los pares izquierda/derecha, de modo que `legL` siga siendo la
 *  pierna IZQUIERDA del espectador. Así interpolar march → march-espejo baja
 *  una pierna mientras sube la otra (sin extremidades cruzando el cuerpo). */
export function mirrorPoseDef(def: KidPoseDef): KidPoseDef {
  const flip = (points: string) => formatPts(parsePts(points).map(([x, y]) => [VIEW_W - x, y]))
  const flipShoe = (s: ShoePlacement): ShoePlacement => ({ x: Math.round((VIEW_W - s.x) * 10) / 10, y: s.y, r: -s.r })
  return {
    dy: def.dy,
    dx: -(def.dx ?? 0),
    armL: flip(def.armR),
    armR: flip(def.armL),
    legL: flip(def.legR),
    legR: flip(def.legL),
    shoeL: flipShoe(def.shoeR),
    shoeR: flipShoe(def.shoeL),
  }
}

/** Interpolación lineal entre dos poses (t: 0 → a, 1 → b). El easing lo pone
 *  quien anima (PoseGuide). */
export function lerpPoseDef(a: KidPoseDef, b: KidPoseDef, t: number): KidPoseDef {
  const n = (x: number, y: number) => x + (y - x) * t
  const pts = (pa: string, pb: string) => {
    const A = parsePts(pa)
    const B = parsePts(pb)
    return formatPts(A.map(([x, y], i) => [n(x, B[i]![0]), n(y, B[i]![1])]))
  }
  const shoe = (sa: ShoePlacement, sb: ShoePlacement): ShoePlacement => ({
    x: Math.round(n(sa.x, sb.x) * 10) / 10,
    y: Math.round(n(sa.y, sb.y) * 10) / 10,
    r: Math.round(n(sa.r, sb.r) * 10) / 10,
  })
  return {
    dy: n(a.dy, b.dy),
    dx: n(a.dx ?? 0, b.dx ?? 0),
    armL: pts(a.armL, b.armL),
    armR: pts(a.armR, b.armR),
    legL: pts(a.legL, b.legL),
    legR: pts(a.legR, b.legR),
    shoeL: shoe(a.shoeL, b.shoeL),
    shoeR: shoe(a.shoeR, b.shoeR),
  }
}
