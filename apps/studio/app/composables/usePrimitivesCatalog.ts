// ─────────────────────────────────────────────────────────────────────────────
// Catalog of StoryPlay game primitives, mirroring the reference design system.
// The 'portada' ones have a working playground at /primitives/[slug].
// The rest are registered as 'pendiente' until they get ported in later tasks.
// methods/callbacks document the public API of each DS class — they become the
// contract to preserve when porting (Componente.vue + useComposable.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type PrimitiveStatus = 'portada' | 'pendiente'

export type PrimitiveCategory = 'interactions' | 'manipulation' | 'measurement'

export interface PrimitiveCatalogEntry {
  name: string // technical name (matches /app/primitives/<Name>/)
  slug: string // URL slug for playground (/primitives/[slug]) and icon key
  label: string // display label in UI
  description: string
  category: PrimitiveCategory
  status: PrimitiveStatus
  cssClass: string // main CSS class from the DS
  methods: string[] // public methods of the DS class
  callbacks: string[] // option callbacks of the DS class
}

export const PRIMITIVE_CATEGORY_LABELS: Record<PrimitiveCategory, string> = {
  interactions: 'Interacciones',
  manipulation: 'Manipulacion',
  measurement: 'Medicion',
}

// Tailwind classes for the icon container, tinted per category
export const PRIMITIVE_CATEGORY_STYLES: Record<PrimitiveCategory, { iconBg: string; iconText: string }> = {
  interactions: { iconBg: 'bg-brand-primary-50', iconText: 'text-brand-primary-600' },
  manipulation: { iconBg: 'bg-brand-secondary-50', iconText: 'text-brand-secondary-600' },
  measurement: { iconBg: 'bg-brand-purple-50', iconText: 'text-brand-purple-600' },
}

const CATALOG: PrimitiveCatalogEntry[] = [
  // ── Interactions ──────────────────────────────────────────────────────────
  {
    name: 'Wheel',
    slug: 'wheel',
    label: 'Ruleta',
    description: 'Ruleta giratoria de N sectores con aro decorativo, hub central y puntero con tick fisico. El sector ganador se elige antes de girar para caer siempre centrado.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.wheel-disc',
    methods: ['spin()', 'reset()'],
    callbacks: ['onLand', 'onTick'],
  },
  {
    name: 'ProgressRing',
    slug: 'progress-ring',
    label: 'Anillo de Progreso',
    description: 'Anillo SVG circular con canal de fondo y trazo de progreso animado. Variantes de color y label central de porcentaje.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.progress-ring',
    methods: ['setProgress()', 'animate()'],
    callbacks: [],
  },
  {
    name: 'ProgressHalo',
    slug: 'progress-halo',
    label: 'Halo de Progreso',
    description: 'Anillo de progreso que ENVUELVE otro componente o sprite (slot). Mismo canal y arco del DS que ProgressRing, pero como marco declarativo (prop 0..1) para arte. Es el anillo de HoldAction.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.progress-halo',
    methods: [],
    callbacks: [],
  },
  {
    name: 'ProgressBar',
    slug: 'progress-bar',
    label: 'Barra de Progreso',
    description: 'Barra horizontal con efecto glossy estilo Duolingo. Soporta animacion ease-out cubica, variantes de color y tres tamanios.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.progress-bar',
    methods: ['setProgress()', 'animate()'],
    callbacks: [],
  },
  {
    name: 'Dice',
    slug: 'dice',
    label: 'Dado',
    description: 'Dado isometrico con 24 orientaciones fisicamente validas, animacion de lanzamiento con sonido y dots renderizados por JS. Variantes ink, red, blue.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.dice',
    methods: ['roll()', 'setValue()'],
    callbacks: ['onResult'],
  },
  {
    name: 'ScoreCounter',
    slug: 'score-counter',
    label: 'Contador de Puntos',
    description: 'Badge con icono, numero animado y feedback de bump. Muestra delta flotante (+N / -N) al cambiar el valor. Variantes ink, red, blue.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.score-counter',
    methods: ['add()', 'subtract()', 'set()', 'reset()'],
    callbacks: [],
  },
  {
    name: 'Glass',
    slug: 'glass',
    label: 'Vaso',
    description: 'Vaso estilo sticker con liquido que sube por nivel (0-1). Deja un margen de aire en el borde al completarse (maxFill). Color del liquido tematizable via --glass-water.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.glass',
    methods: [],
    callbacks: [],
  },
  {
    name: 'Stove',
    slug: 'stove',
    label: 'Hornilla',
    description: 'Hornilla de cocina con perilla, llamas animadas, tiempo de coccion y SLOT para apoyar el utensilio (sprite) encima — la escena compone <Stove><PotSticker/></Stove> y queda alineado solo. La perilla solo funciona cuando la estacion esta lista (ready); al girarla enciende y al terminar emite done.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.stove',
    methods: ['ignite()', 'reset()'],
    callbacks: ['onIgnite', 'onDone'],
  },
  {
    name: 'TapAction',
    slug: 'tap-action',
    label: 'Accion por Toques',
    description: 'Accion fisica que se completa tocando N veces el elemento (cascar un huevo, batir, amasar). Envuelve el arte de la escena, menea en cada toque y llena pips de progreso. Expone count para estados progresivos.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.tap-action',
    methods: ['reset()'],
    callbacks: ['onTap', 'onComplete'],
  },
  {
    name: 'Particles',
    slug: 'particles',
    label: 'Particulas',
    description: 'Particulas de ambiente en loop para escenas de cocina/fisica: vapor que sube (steam), aceite salpicando (splatter) y burbujas de hervor (bubbles). Efecto visual puro; la escena lo posiciona sobre su arte.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.particles',
    methods: [],
    callbacks: [],
  },
  {
    name: 'Stir',
    slug: 'stir',
    label: 'Cuchara Mezcladora',
    description: 'Cuchara de madera que mezcla en circulos — se superpone a cualquier utensilio mientras un alimento se revuelve (huevo, masa, sopa). Reutilizable en todo juego donde haya que mezclar.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.stir',
    methods: [],
    callbacks: [],
  },
  {
    name: 'HoldAction',
    slug: 'hold-action',
    label: 'Accion Sostenida',
    description: 'Accion fisica que se completa MANTENIENDO presionado el elemento durante N segundos (respirar hondo, calmarse, sostener). Contraparte sostenida de TapAction: envuelve el arte de la escena, dibuja un anillo de progreso que se llena mientras dura la presion y al soltar el avance se PAUSA (nunca castiga). Expone progress/holding para estados progresivos del arte.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.hold-action',
    methods: ['reset()'],
    callbacks: ['onHoldStart', 'onHoldEnd', 'onProgress', 'onComplete'],
  },
  {
    name: 'StepMeter',
    slug: 'step-meter',
    label: 'Medidor por Pasos',
    description: 'Medidor segmentado por pasos discretos con efecto glossy, para progresos por etapas dentro de una escena. Sin implementacion en el DS de referencia; disenado siguiendo el lenguaje de ProgressBar.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.step-meter',
    methods: ['setStep()', 'next()', 'reset()'],
    callbacks: ['onChange', 'onComplete'],
  },

  {
    name: 'PoseGuide',
    slug: 'pose-guide',
    label: 'Guia de Movimiento',
    description: 'Demo animada de un ejercicio fisico: el sprite KidPoseSticker TUINEA entre los cuadros de un movimiento (marchar, rodilla arriba, saltar...) con interpolacion a 60fps y easing — movimiento continuo, no a saltos. La escena controla playing; detenida congela el primer cuadro. Para juegos de actividad fisica donde la pantalla guia y el nino imita.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.pose-guide',
    methods: ['play()', 'pause()', 'reset()'],
    callbacks: ['onStep'],
  },
  {
    name: 'BreathGuide',
    slug: 'breath-guide',
    label: 'Guia de Respiracion',
    description: 'Respiracion guiada por ciclos: burbuja que crece al inhalar y se encoge al exhalar, con dots de ciclos completados. Fases temporizadas (inhaleMs/exhaleMs). Para pausas de calma y recuperacion.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.breath-guide',
    methods: ['start()', 'reset()'],
    callbacks: ['onPhase', 'onCycle', 'onDone'],
  },

  // ── Manipulation ──────────────────────────────────────────────────────────
  {
    name: 'Draggable',
    slug: 'draggable',
    label: 'Arrastrable',
    description: 'Tarjeta arrastrable con pointer events (touch + mouse unificados), hover lift y bounce-back al soltar fuera de una zona valida.',
    category: 'manipulation',
    status: 'portada',
    cssClass: '.draggable',
    methods: [],
    callbacks: ['onDragStart', 'onDragEnd'],
  },
  {
    name: 'DropZone',
    slug: 'drop-zone',
    label: 'Zona de Soltado',
    description: 'Zona receptora para Draggables con registro central. Acepta/rechaza por criterio, estados hover valido/invalido y celebracion al recibir.',
    category: 'manipulation',
    status: 'portada',
    cssClass: '.drop-zone',
    methods: ['accept()', 'reset()'],
    callbacks: ['onDrop', 'onReject'],
  },
  {
    name: 'ReorderList',
    slug: 'reorder-list',
    label: 'Lista Ordenable',
    description: 'Lista vertical reordenable por arrastre con animacion FLIP. Modos freeform y validate contra un orden correcto, con celebracion al completar.',
    category: 'manipulation',
    status: 'portada',
    cssClass: '.reorder-list',
    methods: ['shuffle()', 'reset()', 'getOrder()'],
    callbacks: ['onReorder', 'onComplete'],
  },
  {
    name: 'TapField',
    slug: 'tap-field',
    label: 'Campo de Toque',
    description: 'Juego de tocar objetivos correctos: los aciertos vuelan a una canasta con slots, los errores sacuden. Celebracion con confetti al completar.',
    category: 'manipulation',
    status: 'portada',
    cssClass: '.tap-field',
    methods: ['shuffle()', 'reset()'],
    callbacks: ['onHit', 'onMiss', 'onComplete'],
  },

  // ── Measurement ───────────────────────────────────────────────────────────
  {
    name: 'Scale',
    slug: 'scale',
    label: 'Bascula',
    description: 'Bascula digital: los objetos arrastrados al plato suman peso y el display anima el total. Unidades kg, g y lb.',
    category: 'measurement',
    status: 'portada',
    cssClass: '.scale',
    methods: ['setUnit()', 'reset()', 'getWeight()'],
    callbacks: ['onMeasure'],
  },
  {
    name: 'Ruler',
    slug: 'ruler',
    label: 'Medidor de Altura',
    description: 'Regla vertical: el objeto soltado crece desde el piso hasta su altura real y un marcador flotante muestra la medida. Unidades cm, m y ft.',
    category: 'measurement',
    status: 'portada',
    cssClass: '.ruler',
    methods: ['setUnit()', 'reset()', 'getHeight()'],
    callbacks: ['onMeasure'],
  },
  {
    name: 'Thermometer',
    slug: 'thermometer',
    label: 'Termometro',
    description: 'Termometro axilar con columna que se llena segun la temperatura medida, zonas semanticas por color (hipotermia → muy alta) y display animado.',
    category: 'measurement',
    status: 'portada',
    cssClass: '.thermometer',
    methods: ['measure()', 'reset()'],
    callbacks: ['onMeasure'],
  },
  {
    name: 'Glucometer',
    slug: 'glucometer',
    label: 'Glucometro',
    description: 'Glucometro educativo con flujo de 5 pasos: elegir paciente, tomar sangre, insertar tira, medir y resultado con zona de color.',
    category: 'measurement',
    status: 'portada',
    cssClass: '.glucometer',
    methods: ['selectPatient()', 'measure()', 'next()', 'reset()'],
    callbacks: ['onMeasure'],
  },
  {
    name: 'EmotionGauge',
    slug: 'emotion-gauge',
    label: 'Medidor de Emociones',
    description: 'Medidor vertical de intensidad emocional con tres zonas semanticas: calma (verde), atencion (amarillo) e intensa (rojo). La columna sube y cambia de color segun el valor 0-1. Presentacional puro — la escena decide el valor y el ritmo (subirlo con el enojo, bajarlo al respirar). Para juegos de salud emocional y autocontrol.',
    category: 'measurement',
    status: 'portada',
    cssClass: '.emotion-gauge',
    methods: [],
    callbacks: [],
  },
  {
    name: 'ExerciseTimer',
    slug: 'exercise-timer',
    label: 'Temporizador de Ejercicio',
    description: 'Cuenta regresiva de un ejercicio fisico: anillo que se vacia con los segundos grandes al centro y beat opcional (tick + pulso) que marca el ritmo a seguir. Sin beat es un conteo silencioso para posturas sostenidas y estiramientos.',
    category: 'measurement',
    status: 'portada',
    cssClass: '.exercise-timer',
    methods: ['start()', 'stop()', 'reset()'],
    callbacks: ['onSecond', 'onBeat', 'onDone'],
  },
  {
    name: 'StopLight',
    slug: 'stop-light',
    label: 'Semaforo',
    description: 'Semaforo sticker de tres luces para juegos de ritmo y control inhibitorio: verde avanza, amarillo despacio, rojo estatua. Presentacional puro — la escena decide el estado y los sonidos.',
    category: 'interactions',
    status: 'portada',
    cssClass: '.stop-light',
    methods: [],
    callbacks: [],
  },
]

export function usePrimitivesCatalog() {
  const catalog = useState<PrimitiveCatalogEntry[]>('primitives-catalog', () => [...CATALOG])

  function getPrimitive(slug: string): PrimitiveCatalogEntry | undefined {
    return catalog.value.find(p => p.slug === slug)
  }

  const portedPrimitives = computed(() => catalog.value.filter(p => p.status === 'portada'))
  const pendingPrimitives = computed(() => catalog.value.filter(p => p.status === 'pendiente'))

  const groupedByCategory = computed(() => {
    const categories: PrimitiveCategory[] = ['interactions', 'manipulation', 'measurement']
    return categories.map(category => {
      const primitives = catalog.value.filter(p => p.category === category)
      return {
        category,
        label: PRIMITIVE_CATEGORY_LABELS[category],
        primitives,
        portedCount: primitives.filter(p => p.status === 'portada').length,
      }
    })
  })

  return {
    catalog,
    getPrimitive,
    portedPrimitives,
    pendingPrimitives,
    groupedByCategory,
  }
}
