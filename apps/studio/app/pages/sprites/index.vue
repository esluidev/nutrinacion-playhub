<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-display font-bold text-brand-dark">Sprites</h2>
      <p class="text-sm text-gray-500 mt-1">Arte sticker reutilizable de los juegos (app/sprites/): elementos simples sin mecánica que las escenas componen.</p>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <UiSearchInput v-model="search" placeholder="Buscar sprite..." max-width="xs" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="s in visibleSprites" :key="s.id" class="card overflow-hidden flex flex-col">
        <!-- Preview sobre el canvas StoryPlay -->
        <div class="relative h-48 shrink-0 flex items-center justify-center" style="background: #f5f0e8">
          <div class="pointer-events-none select-none" :style="{ width: `${s.w}px`, height: `${s.h}px` }">
            <component :is="s.component" v-bind="s.props" />
          </div>
        </div>

        <div class="p-4 flex flex-col flex-1">
          <h4 class="font-display font-semibold text-brand-dark leading-tight">{{ s.label }}</h4>
          <p class="text-[11px] text-gray-400 font-mono mt-0.5">{{ s.file }}</p>
          <p class="text-sm text-gray-500 mt-2 flex-1">{{ s.description }}</p>
          <div class="flex flex-wrap gap-1.5 mt-3">
            <span v-for="prop in s.api" :key="prop" class="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 ring-1 ring-gray-200/60">
              {{ prop }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <UiCard v-if="!visibleSprites.length" class="text-center py-12" :hover="false">
      <p class="text-gray-400 text-sm">No hay sprites que coincidan con la búsqueda.</p>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { markRaw, type Component } from 'vue'
import BeanSticker from '~/sprites/BeanSticker.vue'
import BoiledEggSticker from '~/sprites/BoiledEggSticker.vue'
import BowlSticker from '~/sprites/BowlSticker.vue'
import EggPairSticker from '~/sprites/EggPairSticker.vue'
import EggPartSticker from '~/sprites/EggPartSticker.vue'
import EggSticker from '~/sprites/EggSticker.vue'
import FriedEggSticker from '~/sprites/FriedEggSticker.vue'
import KidPoseSticker from '~/sprites/KidPoseSticker.vue'
import PanSticker from '~/sprites/PanSticker.vue'
import PotSticker from '~/sprites/PotSticker.vue'
import ScrambledSticker from '~/sprites/ScrambledSticker.vue'
import AppleSticker from '~/sprites/AppleSticker.vue'
import YogurtSticker from '~/sprites/YogurtSticker.vue'
import BallSticker from '~/sprites/BallSticker.vue'
import BananaSticker from '~/sprites/BananaSticker.vue'
import BottleSticker from '~/sprites/BottleSticker.vue'
import CandySticker from '~/sprites/CandySticker.vue'
import CarrotSticker from '~/sprites/CarrotSticker.vue'
import CheeseSticker from '~/sprites/CheeseSticker.vue'
import ChickenSticker from '~/sprites/ChickenSticker.vue'
import ConeSticker from '~/sprites/ConeSticker.vue'
import CookieSticker from '~/sprites/CookieSticker.vue'
import CornSticker from '~/sprites/CornSticker.vue'
import EmotionFaceSticker from '~/sprites/EmotionFaceSticker.vue'
import HandSticker from '~/sprites/HandSticker.vue'
import HeartOrganSticker from '~/sprites/HeartOrganSticker.vue'
import HeartSticker from '~/sprites/HeartSticker.vue'
import JumpRopeSticker from '~/sprites/JumpRopeSticker.vue'
import MedalSticker from '~/sprites/MedalSticker.vue'
import MilkSticker from '~/sprites/MilkSticker.vue'
import MuscleSticker from '~/sprites/MuscleSticker.vue'
import OrangeSticker from '~/sprites/OrangeSticker.vue'
import PlateSticker from '~/sprites/PlateSticker.vue'
import SoapSticker from '~/sprites/SoapSticker.vue'
import SodaSticker from '~/sprites/SodaSticker.vue'
import StarSticker from '~/sprites/StarSticker.vue'
import TomatoSticker from '~/sprites/TomatoSticker.vue'
import ToothSticker from '~/sprites/ToothSticker.vue'
import ToothbrushSticker from '~/sprites/ToothbrushSticker.vue'
import TortillaSticker from '~/sprites/TortillaSticker.vue'
import WatermelonSticker from '~/sprites/WatermelonSticker.vue'
import WaterDropSticker from '~/sprites/WaterDropSticker.vue'
import InsulinPenSticker from '~/sprites/InsulinPenSticker.vue'
import KeySticker from '~/sprites/KeySticker.vue'
import FridgeSticker from '~/sprites/FridgeSticker.vue'
import SoupBowlSticker from '~/sprites/SoupBowlSticker.vue'
import BroccoliSticker from '~/sprites/BroccoliSticker.vue'

interface SpriteEntry {
  id: string
  label: string
  file: string
  description: string
  api: string[]
  component: Component
  props?: Record<string, unknown>
  w: number
  h: number
}

const SPRITES: SpriteEntry[] = [
  {
    id: 'soup-bowl',
    label: 'Tazón de Sopa',
    file: 'SoupBowlSticker.vue',
    description: 'Tazón de sopa de verduras con caldo, trozos a la vista y vapor opcional (`steam`). El héroe de los storyboards de salud emocional en la mesa.',
    api: ['steam', 'shadow'],
    component: markRaw(SoupBowlSticker),
    w: 150,
    h: 118,
  },
  {
    id: 'broccoli',
    label: 'Brócoli',
    file: 'BroccoliSticker.vue',
    description: 'Brócoli con floretes, hojas y tallos, adaptado al DS con contorno ink.',
    api: [],
    component: markRaw(BroccoliSticker),
    w: 116,
    h: 116,
  },
  {
    id: 'insulin-pen',
    label: 'Pluma de Insulina',
    file: 'InsulinPenSticker.vue',
    description: 'Pluma de insulina amigable: ventana de dosis, dial naranja y punta siempre cubierta (sin agujas visibles). Para storyboards de cuidado personal/diabetes.',
    api: ['dose', 'shadow'],
    component: markRaw(InsulinPenSticker),
    w: 96,
    h: 156,
  },
  {
    id: 'key',
    label: 'Llave',
    file: 'KeySticker.vue',
    description: 'Llave dorada clásica — la metáfora de la insulina que abre la puerta de la energía.',
    api: ['shadow'],
    component: markRaw(KeySticker),
    w: 170,
    h: 93,
  },
  {
    id: 'fridge',
    label: 'Refrigeradora',
    file: 'FridgeSticker.vue',
    description: 'Refri amigable con congelador y copo de nieve — el hogar frío de la insulina.',
    api: ['shadow'],
    component: markRaw(FridgeSticker),
    w: 120,
    h: 156,
  },
  {
    id: 'kid-boy',
    label: 'Niño (KidPoseSticker)',
    file: 'KidPoseSticker.vue',
    description: 'Personaje que demuestra los ejercicios. 8 poses × 2 edades (kid/teen), animable por PoseGuide.',
    api: ['pose', 'variant', 'age', 'mirror', 'shirt', 'skin', 'hair', 'shoes', 'def'],
    component: markRaw(KidPoseSticker),
    props: { pose: 'knee-up', variant: 'boy', shirt: '#6bbf8a' },
    w: 130,
    h: 178,
  },
  {
    id: 'kid-girl',
    label: 'Niña (KidPoseSticker)',
    file: 'KidPoseSticker.vue',
    description: 'Variante girl: bob con chonguitos altos y falda. Mismo rig y poses que el niño.',
    api: ['variant="girl"'],
    component: markRaw(KidPoseSticker),
    props: { pose: 'jump', variant: 'girl' },
    w: 130,
    h: 178,
  },
  {
    id: 'egg',
    label: 'Huevo',
    file: 'EggSticker.vue',
    description: 'Huevo por variedad (colores por props), con pecas de codorniz y grietas progresivas para cocinar.',
    api: ['body', 'outline', 'speckled', 'speckle', 'cracks'],
    component: markRaw(EggSticker),
    props: { body: '#f0c08e', outline: '#80522a' },
    w: 110,
    h: 145,
  },
  {
    id: 'egg-pair',
    label: 'Par de Huevos',
    file: 'EggPairSticker.vue',
    description: 'Ilustración héroe de la bienvenida de El Huevo: dos huevos con destellos.',
    api: [],
    component: markRaw(EggPairSticker),
    w: 175,
    h: 152,
  },
  {
    id: 'boiled',
    label: 'Huevo Cocido',
    file: 'BoiledEggSticker.vue',
    description: 'Huevo pelado entero + mitad con la yema a la vista.',
    api: [],
    component: markRaw(BoiledEggSticker),
    w: 175,
    h: 127,
  },
  {
    id: 'fried',
    label: 'Huevo Frito',
    file: 'FriedEggSticker.vue',
    description: 'Clara ondulada + yema glossy. `raw` = recién cascado (translúcido).',
    api: ['raw'],
    component: markRaw(FriedEggSticker),
    w: 175,
    h: 119,
  },
  {
    id: 'scrambled',
    label: 'Revuelto',
    file: 'ScrambledSticker.vue',
    description: 'Plato con montículo esponjoso y cebollín. `raw` = mezcla recién vertida.',
    api: ['raw'],
    component: markRaw(ScrambledSticker),
    w: 175,
    h: 119,
  },
  {
    id: 'egg-part',
    label: 'Partes del Huevo',
    file: 'EggPartSticker.vue',
    description: 'Cáscara, clara o yema según la prop `part` (escena de propiedades).',
    api: ['part: cascara|clara|yema'],
    component: markRaw(EggPartSticker),
    props: { part: 'cascara' },
    w: 175,
    h: 119,
  },
  {
    id: 'pot',
    label: 'Olla',
    file: 'PotSticker.vue',
    description: 'Olla metálica con agua. `lid` la tapa y `lidBouncing` hace saltar la tapa al hervir.',
    api: ['lid', 'lidBouncing'],
    component: markRaw(PotSticker),
    w: 175,
    h: 119,
  },
  {
    id: 'pan',
    label: 'Sartén',
    file: 'PanSticker.vue',
    description: 'Sartén isométrico con brillo de aceite y mango con agujero para colgar.',
    api: [],
    component: markRaw(PanSticker),
    w: 175,
    h: 119,
  },
  {
    id: 'bowl',
    label: 'Tazón',
    file: 'BowlSticker.vue',
    description: 'Tazón de cerámica con pie y franja. `filled` muestra la mezcla batida.',
    api: ['filled'],
    component: markRaw(BowlSticker),
    props: { filled: true },
    w: 175,
    h: 119,
  },
  {
    id: 'water',
    label: 'Gota de Agua',
    file: 'WaterDropSticker.vue',
    description: 'El arte de "agua" en tarjetas, pasos e ilustraciones de saber (reemplaza al emoji 💧).',
    api: [],
    component: markRaw(WaterDropSticker),
    w: 105,
    h: 135,
  },
  {
    id: 'apple',
    label: 'Manzana',
    file: 'AppleSticker.vue',
    description: 'Fruta por color (roja/verde/amarilla) con mordida opcional.',
    api: ['variety', 'body', 'shade', 'bite'],
    component: markRaw(AppleSticker),
    w: 115,
    h: 118,
  },
  {
    id: 'banana',
    label: 'Banano',
    file: 'BananaSticker.vue',
    description: 'Silueta Flaticon adaptada al DS: borde ink, tallo delineado y mitad madura como sombreado.',
    api: [],
    component: markRaw(BananaSticker),
    w: 135,
    h: 135,
  },
  {
    id: 'orange',
    label: 'Naranja',
    file: 'OrangeSticker.vue',
    description: 'Entera o partida con gajos.',
    api: ['half'],
    component: markRaw(OrangeSticker),
    w: 115,
    h: 115,
  },
  {
    id: 'watermelon',
    label: 'Sandía',
    file: 'WatermelonSticker.vue',
    description: 'Tajada con cáscara; `seeds` = semillas a la vista.',
    api: ['seeds'],
    component: markRaw(WatermelonSticker),
    w: 140,
    h: 105,
  },
  {
    id: 'carrot',
    label: 'Zanahoria',
    file: 'CarrotSticker.vue',
    description: 'Con hojas y líneas de raíz.',
    api: [],
    component: markRaw(CarrotSticker),
    w: 95,
    h: 140,
  },
  {
    id: 'tomato',
    label: 'Tomate',
    file: 'TomatoSticker.vue',
    description: 'Con cáliz de cinco puntas.',
    api: [],
    component: markRaw(TomatoSticker),
    w: 125,
    h: 116,
  },
  {
    id: 'corn',
    label: 'Elote',
    file: 'CornSticker.vue',
    description: 'Mazorca con granos; `husk` = hojas cruzadas.',
    api: ['husk'],
    component: markRaw(CornSticker),
    w: 118,
    h: 120,
  },
  {
    id: 'tortilla',
    label: 'Tortillas',
    file: 'TortillaSticker.vue',
    description: 'Una o en pila, con motitas tostadas.',
    api: ['stack'],
    component: markRaw(TortillaSticker),
    w: 145,
    h: 104,
  },
  {
    id: 'chicken',
    label: 'Pollo',
    file: 'ChickenSticker.vue',
    description: 'Pierna cocida con hueso.',
    api: [],
    component: markRaw(ChickenSticker),
    w: 135,
    h: 119,
  },
  {
    id: 'cheese2',
    label: 'Queso',
    file: 'CheeseSticker.vue',
    description: 'Cuña con ojos.',
    api: [],
    component: markRaw(CheeseSticker),
    w: 135,
    h: 103,
  },
  {
    id: 'milk',
    label: 'Leche',
    file: 'MilkSticker.vue',
    description: 'Vaso o caja (`kind`).',
    api: ['kind: glass|box'],
    component: markRaw(MilkSticker),
    w: 95,
    h: 130,
  },
  {
    id: 'yogurt2',
    label: 'Yogurt',
    file: 'YogurtSticker.vue',
    description: 'Bebible con banda de fresa.',
    api: [],
    component: markRaw(YogurtSticker),
    w: 90,
    h: 130,
  },
  {
    id: 'candy2',
    label: 'Dulce',
    file: 'CandySticker.vue',
    description: 'Dulce envuelto (fresa).',
    api: [],
    component: markRaw(CandySticker),
    w: 135,
    h: 86,
  },
  {
    id: 'cookie2',
    label: 'Galleta',
    file: 'CookieSticker.vue',
    description: 'Con chispas (ocasional).',
    api: [],
    component: markRaw(CookieSticker),
    w: 115,
    h: 112,
  },
  {
    id: 'soda2',
    label: 'Soda',
    file: 'SodaSticker.vue',
    description: 'Lata con banda (ocasional).',
    api: [],
    component: markRaw(SodaSticker),
    w: 85,
    h: 129,
  },
  {
    id: 'bottle2',
    label: 'Botella deportiva',
    file: 'BottleSticker.vue',
    description: 'Con nivel de agua (`level`).',
    api: ['level'],
    component: markRaw(BottleSticker),
    w: 80,
    h: 138,
  },
  {
    id: 'heart-organ',
    label: 'Corazón (órgano)',
    file: 'HeartOrganSticker.vue',
    description: 'Órgano amigable con electro; `beating` lo hace latir.',
    api: ['beating'],
    component: markRaw(HeartOrganSticker),
    w: 115,
    h: 121,
  },
  {
    id: 'muscle',
    label: 'Músculo',
    file: 'MuscleSticker.vue',
    description: 'Brazo flexionado con bíceps.',
    api: [],
    component: markRaw(MuscleSticker),
    w: 125,
    h: 116,
  },
  {
    id: 'tooth',
    label: 'Diente',
    file: 'ToothSticker.vue',
    description: 'Muela; `state` sano/caries/brillante.',
    api: ['state'],
    component: markRaw(ToothSticker),
    w: 100,
    h: 112,
  },
  {
    id: 'hand',
    label: 'Mano',
    file: 'HandSticker.vue',
    description: 'Abierta; `soapy` con burbujas de jabón.',
    api: ['soapy'],
    component: markRaw(HandSticker),
    w: 110,
    h: 122,
  },
  {
    id: 'soap',
    label: 'Jabón',
    file: 'SoapSticker.vue',
    description: 'Barra con burbujas.',
    api: [],
    component: markRaw(SoapSticker),
    w: 130,
    h: 99,
  },
  {
    id: 'toothbrush',
    label: 'Cepillo de dientes',
    file: 'ToothbrushSticker.vue',
    description: 'Con pasta opcional (`paste`).',
    api: ['paste'],
    component: markRaw(ToothbrushSticker),
    w: 150,
    h: 78,
  },
  {
    id: 'ball',
    label: 'Pelota',
    file: 'BallSticker.vue',
    description: 'Fútbol, básquet o playa (`kind`).',
    api: ['kind'],
    component: markRaw(BallSticker),
    w: 115,
    h: 115,
  },
  {
    id: 'jumprope',
    label: 'Cuerda de saltar',
    file: 'JumpRopeSticker.vue',
    description: 'Con mangos azules.',
    api: [],
    component: markRaw(JumpRopeSticker),
    w: 130,
    h: 113,
  },
  {
    id: 'cone',
    label: 'Cono',
    file: 'ConeSticker.vue',
    description: 'De entrenamiento con banda blanca.',
    api: ['body', 'shade'],
    component: markRaw(ConeSticker),
    w: 105,
    h: 102,
  },
  {
    id: 'medal',
    label: 'Medalla',
    file: 'MedalSticker.vue',
    description: 'Con listón; `metal` oro/plata/bronce.',
    api: ['metal'],
    component: markRaw(MedalSticker),
    w: 95,
    h: 126,
  },
  {
    id: 'emotion',
    label: 'Carita de emoción',
    file: 'EmotionFaceSticker.vue',
    description: '6 emociones (`emotion`), color por props.',
    api: ['emotion', 'body', 'shade'],
    component: markRaw(EmotionFaceSticker),
    w: 112,
    h: 115,
  },
  {
    id: 'heart',
    label: 'Corazón',
    file: 'HeartSticker.vue',
    description: 'Símbolo con destello, color por props.',
    api: ['body', 'shade', ],
    component: markRaw(HeartSticker),
    w: 118,
    h: 118,
  },
  {
    id: 'star',
    label: 'Estrella',
    file: 'StarSticker.vue',
    description: 'Premio/ruletas, color por props.',
    api: ['body', 'shade'],
    component: markRaw(StarSticker),
    w: 115,
    h: 115,
  },
  {
    id: 'plate',
    label: 'Plato',
    file: 'PlateSticker.vue',
    description: 'Vacío o con divisiones (`divided`).',
    api: ['divided'],
    component: markRaw(PlateSticker),
    w: 140,
    h: 93,
  },
  {
    id: 'bean',
    label: 'Frijol',
    file: 'BeanSticker.vue',
    description: 'Frijol canónico de ruleta-frijoles-v2, colores por variedad via props.',
    api: ['body', 'outline'],
    component: markRaw(BeanSticker),
    props: { body: '#e63946', outline: '#b82838' },
    w: 130,
    h: 130,
  },
]

const search = ref('')

const visibleSprites = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return SPRITES
  return SPRITES.filter(s =>
    s.label.toLowerCase().includes(q)
    || s.file.toLowerCase().includes(q)
    || s.description.toLowerCase().includes(q),
  )
})
</script>
