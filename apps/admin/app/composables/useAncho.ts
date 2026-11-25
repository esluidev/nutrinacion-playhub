// El ancho de un elemento, al día con ResizeObserver. Sirve para decidir por el sitio que de verdad hay (con el menú
// lateral abierto o plegado, en cualquier pantalla) y no por el ancho de la ventana: p. ej. qué acciones caben en la
// cabecera de una ficha junto al nombre y cuáles pasan al menú ⋮ (DESIGN.md, «Cabecera de una ficha»).
import type { Ref } from 'vue'

export function useAncho(el: Ref<HTMLElement | null | undefined>): Ref<number> {
  const ancho = ref(0)
  let observador: ResizeObserver | null = null
  onMounted(() => {
    observador = new ResizeObserver(([entrada]) => {
      if (entrada) ancho.value = entrada.contentRect.width
    })
    // El elemento puede aparecer después (detrás de un v-if mientras cargan los datos)
    watch(el, (nuevo, viejo) => {
      if (viejo) observador?.unobserve(viejo)
      if (nuevo) observador?.observe(nuevo)
    }, { immediate: true })
  })
  onBeforeUnmount(() => observador?.disconnect())
  return ancho
}
