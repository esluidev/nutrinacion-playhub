<template>
  <!-- Kid figure v5: identidad de personaje propia. Peinados con silueta real
       (flequillo despeinado + remolino / bob con chonguitos altos), cara
       expresiva (ojos grandes con catchlight, cejas, boca abierta con lengua),
       camiseta con cuello y MANGAS DINÁMICAS que siguen el ángulo del brazo en
       cada pose, falda de ruedo ondulado, puños en el short. Conserva el
       acabado v4: cel-shading, sombra de contacto que sigue dx y se encoge al
       despegar (dy). Dos edades ('kid' default / 'teen') y dos variantes
       ('boy'/'girl') comparten el dibujo, parametrizado por el rig. `def`
       acepta geometría interpolada de PoseGuide. Pure art, no mechanic. -->
  <svg class="kid" :viewBox="viewBox256" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <g :transform="`scale(${scale256})`">
    <defs>
      <clipPath :id="`${uid}-head`"><circle :cx="rig.head.cx" :cy="rig.head.cy" :r="rig.head.r" /></clipPath>
      <clipPath :id="`${uid}-torso`"><rect :x="rig.torso.x" :y="rig.torso.y" :width="rig.torso.w" :height="rig.torso.h" :rx="rig.torso.rx" /></clipPath>
    </defs>

    <g :transform="mirror2 ? 'translate(220,0) scale(-1,1)' : undefined">
      <g :transform="`translate(${def.dx ?? 0}, 0)`">
        <!-- Sombra de contacto: en el piso, se encoge al despegar -->
        <ellipse :cx="110" :cy="rig.shadow.cy" :rx="rig.shadow.rx * shadowScale" :ry="rig.shadow.ry" fill="#3d4256" :opacity="0.10 * shadowScale + 0.02" />

        <g :transform="`translate(0, ${def.dy + rig.groundOffset})`">
          <!-- Legs (behind everything): ink underlay + skin stroke -->
          <template v-for="leg in ['legL', 'legR'] as const" :key="leg">
            <polyline :points="def[leg]" fill="none" stroke="#3d4256" :stroke-width="rig.limbs.legInk" stroke-linecap="round" stroke-linejoin="round" />
            <polyline :points="def[leg]" fill="none" :stroke="skin" :stroke-width="rig.limbs.legSkin" stroke-linecap="round" stroke-linejoin="round" />
          </template>

          <!-- Shoes + brillo de punta -->
          <g v-for="(shoe, i) in [def.shoeL, def.shoeR]" :key="i" :transform="`rotate(${shoe.r} ${shoe.x} ${shoe.y})`">
            <ellipse :cx="shoe.x" :cy="shoe.y" :rx="rig.shoe.rx" :ry="rig.shoe.ry" :fill="shoes" stroke="#3d4256" stroke-width="5" />
            <circle :cx="shoe.x - rig.shoe.rx * 0.35" :cy="shoe.y - rig.shoe.ry * 0.3" r="2.6" fill="#fff" opacity="0.55" />
          </g>

          <!-- Bottoms first (shorts/skirt), so the hands stay visible over them -->
          <path :d="variant === 'boy' ? rig.shortsPath : rig.skirtPath" fill="#3f4458" stroke="#3d4256" stroke-width="6" stroke-linejoin="round" />

          <!-- Arms BEHIND the shirt: the joint disappears under the torso -->
          <template v-for="arm in ['armL', 'armR'] as const" :key="arm">
            <polyline :points="def[arm]" fill="none" stroke="#3d4256" :stroke-width="rig.limbs.armInk" stroke-linecap="round" stroke-linejoin="round" />
            <polyline :points="def[arm]" fill="none" :stroke="skin" :stroke-width="rig.limbs.armSkin" stroke-linecap="round" stroke-linejoin="round" />
          </template>

          <!-- Torso (shirt): base + media luna de sombra + brillo + cuello -->
          <rect :x="rig.torso.x" :y="rig.torso.y" :width="rig.torso.w" :height="rig.torso.h" :rx="rig.torso.rx" :fill="shirt" stroke="#3d4256" stroke-width="6" />
          <g :clip-path="`url(#${uid}-torso)`">
            <rect :x="rig.torso.x" :y="rig.torso.y" :width="rig.torso.w" :height="rig.torso.h" fill="#000" opacity="0.12" />
            <rect :x="rig.torso.x - 6" :y="rig.torso.y - 7" :width="rig.torso.w" :height="rig.torso.h" :rx="rig.torso.rx" :fill="shirt" />
            <rect :x="rig.shirtShine.x" :y="rig.shirtShine.y" :width="rig.shirtShine.w" :height="rig.shirtShine.h" :rx="rig.shirtShine.rx" fill="#fff" opacity="0.28" />
          </g>
          <path :d="rig.collarPath" fill="none" stroke="#3d4256" stroke-width="4" stroke-linecap="round" />

          <!-- Head: chonguitos (girl, detrás) + cara + cel + peinado -->
          <template v-if="variant === 'girl'">
            <g v-for="(b, i) in rig.girlBuns" :key="i">
              <circle :cx="b.cx" :cy="b.cy" :r="b.r" :fill="hair" stroke="#3d4256" stroke-width="5" />
              <circle :cx="b.cx - b.r * 0.3" :cy="b.cy - b.r * 0.35" :r="b.r * 0.24" fill="#fff" opacity="0.25" />
            </g>
          </template>
          <circle :cx="rig.head.cx" :cy="rig.head.cy" :r="rig.head.r" :fill="skin" stroke="#3d4256" stroke-width="6" />
          <g :clip-path="`url(#${uid}-head)`">
            <rect :x="rig.head.cx" :y="rig.head.cy - rig.head.r" :width="rig.head.r + 6" :height="rig.head.r * 2 + 6" fill="#3d4256" opacity="0.07" />
            <circle :cx="rig.head.cx - 5" :cy="rig.head.cy - 4" :r="rig.head.r" :fill="skin" />
          </g>
          <path :d="variant === 'boy' ? rig.boyHairPath : rig.girlHairPath" :fill="hair" stroke="#3d4256" stroke-width="5" stroke-linejoin="round" />

          <!-- Cara: ojos con catchlight, cejas, boca abierta con lengua, chapetes -->
          <template v-for="(e, i) in rig.eyes" :key="i">
            <ellipse :cx="e.cx" :cy="e.cy" :rx="e.rx" :ry="e.ry" fill="#3d4256" />
            <circle :cx="e.cx + e.rx * 0.35" :cy="e.cy - e.ry * 0.32" :r="e.rx * 0.38" fill="#fff" />
          </template>
          <path v-for="(b, i) in rig.brows" :key="`b${i}`" :d="b" fill="none" stroke="#3d4256" stroke-width="4" stroke-linecap="round" />
          <path :d="rig.mouthPath" fill="#3d4256" />
          <ellipse :cx="rig.tongue.cx" :cy="rig.tongue.cy" :rx="rig.tongue.rx" :ry="rig.tongue.ry" fill="#ee92a2" />
          <circle v-for="(b, i) in rig.blush" :key="`bl${i}`" :cx="b.cx" :cy="b.cy" :r="b.r" fill="#f7a8a0" opacity="0.6" />
        </g>
      </g>
    </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { KID_POSES_BY_AGE, KID_RIGS, type KidAge, type KidPose, type KidPoseDef, type KidVariant } from './kid-poses'

const props = withDefaults(defineProps<{
  pose?: KidPose
  /** Geometría ya resuelta (p. ej. un cuadro interpolado de PoseGuide).
      Si se pasa, `pose` y `mirror` se ignoran — el def viene horneado. */
  def?: KidPoseDef
  /** Flip horizontally (alternate stepping side without extra poses) */
  mirror?: boolean
  /** 'boy' (shorts) | 'girl' (chonguitos + falda) — same rig and poses */
  variant?: KidVariant
  /** 'kid' infantil 4-8 (default) | 'teen' proporción mayor */
  age?: KidAge
  shirt?: string
  skin?: string
  hair?: string
  shoes?: string
}>(), {
  pose: 'stand',
  mirror: false,
  variant: 'boy',
  age: 'kid',
  shirt: '#3aa8e0',
  skin: '#f5c09a',
  hair: '#5a3a26',
  shoes: '#e63946',
})

const uid = useId()

const rig = computed(() => KID_RIGS[props.age])
const def = computed(() => props.def ?? KID_POSES_BY_AGE[props.age][props.pose])
const mirror2 = computed(() => !props.def && props.mirror)

/** Normaliza el lienzo del rig a 256 en el lado mayor (resto del DS) */
function parseViewBox(value: string): [number, number, number, number] {
  const [minX = 0, minY = 0, width = 256, height = 256] = value.split(/\s+/).map(Number)
  return [minX, minY, width, height]
}

const scale256 = computed(() => {
  const [, , w, h] = parseViewBox(rig.value.viewBox)
  return 256 / Math.max(w, h)
})
const viewBox256 = computed(() => {
  const [mx, my, w, h] = parseViewBox(rig.value.viewBox)
  const k = scale256.value
  return `${mx * k} ${my * k} ${w * k} ${h * k}`
})

/** La sombra se encoge cuando la figura despega (dy < 0): el salto se lee */
const shadowScale = computed(() => {
  const dy = def.value.dy
  return dy < 0 ? Math.max(0.55, 1 + dy / 55) : 1
})
</script>

<style scoped>
.kid {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
