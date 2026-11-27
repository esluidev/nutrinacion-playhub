<template>
  <!-- Un QR para abrir una dirección con la cámara de otro aparato (unirse a un taller, en Player). Se dibuja en un
       lienzo con la tinta sobre la superficie, para que se lea igual en claro y en oscuro. -->
  <canvas ref="lienzo" class="ui-qr" role="img" :aria-label="label" :style="{ width: `${size}px`, height: `${size}px` }" />
</template>

<script setup lang="ts">
import { encode } from 'uqr'

const props = withDefaults(defineProps<{ value: string, label: string, size?: number }>(), { size: 168 })

const lienzo = ref<HTMLCanvasElement | null>(null)

function dibujar() {
  const canvas = lienzo.value
  if (!canvas) return
  const { data } = encode(props.value, { ecc: 'M', border: 1 })
  const n = data.length
  const escala = window.devicePixelRatio || 1
  canvas.width = Math.round(props.size * escala)
  canvas.height = Math.round(props.size * escala)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const estilo = getComputedStyle(canvas)
  const modulo = canvas.width / n
  ctx.fillStyle = estilo.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = estilo.color
  data.forEach((fila, y) => fila.forEach((lleno, x) => {
    // Cada módulo cubre su sitio entero (sin costuras entre módulos al escalar).
    if (lleno) ctx.fillRect(Math.floor(x * modulo), Math.floor(y * modulo), Math.ceil(modulo), Math.ceil(modulo))
  }))
}

onMounted(dibujar)
watch(() => [props.value, props.size], dibujar)
</script>

<style scoped>
.ui-qr { display: block; color: var(--color-ink); background: var(--color-surface); border-radius: var(--radius-control-sm); }
</style>
