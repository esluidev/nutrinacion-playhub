<template>
  <div ref="root" :class="['relative', variant === 'toolbar' ? 'inline-block' : 'block']">
    <label v-if="label" :id="`${uid}-label`" class="field-label">{{ label }}</label>
    <button
      :id="`${uid}-trigger`"
      ref="trigger"
      type="button"
      :disabled="disabled"
      :class="[
        'field field-trigger',
        size === 'sm' && 'field-sm',
        variant === 'toolbar' && 'w-auto whitespace-nowrap',
      ]"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-labelledby="label ? `${uid}-label ${uid}-trigger` : undefined"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      <span :class="['truncate', !selected && 'text-disabled']">
        <template v-if="prefix">{{ prefix }}: </template>{{ selected ? selected.label : (placeholder ?? labels.select) }}
      </span>
      <UiIcon name="chevron-down" />
    </button>

    <ul
      v-if="open"
      ref="list"
      role="listbox"
      tabindex="-1"
      :aria-labelledby="`${uid}-trigger`"
      :class="['ui-listbox', variant === 'toolbar' ? 'left-0 min-w-52' : 'w-full']"
      :style="posicion"
      @keydown="onListKey"
    >
      <!-- Un filtro de barra dice arriba, al abrirse, qué filtra: su prefijo («Categoría»). -->
      <li v-if="variant === 'toolbar' && prefix" role="presentation" class="eyebrow ui-listbox-legend">{{ prefix }}</li>
      <!-- Con muchas opciones (más de 10, o `searchable`), un buscador arriba: se escribe y se elige con las flechas. -->
      <li v-if="buscable" role="presentation" class="ui-listbox-search">
        <input
          ref="buscador"
          v-model="consulta"
          type="search"
          class="field field-sm"
          :placeholder="labels.search"
          :aria-label="labels.search"
          @keydown="onListKey"
        >
      </li>
      <template v-for="(opt, i) in visibles" :key="String(opt.value)">
        <!-- Opciones en grupos («Programas», «Jornadas»): la leyenda encabeza cada grupo. -->
        <li v-if="opt.group && opt.group !== visibles[i - 1]?.group" role="presentation" class="eyebrow ui-listbox-legend">{{ opt.group }}</li>
        <li
          role="option"
          :aria-selected="opt.value === modelValue"
          :data-active="i === active"
          class="ui-option"
          @click="choose(opt.value)"
          @mousemove="active = i"
        >
          <span class="truncate">{{ opt.label }}</span>
          <UiIcon v-if="opt.value === modelValue" name="check" class="size-4" />
        </li>
      </template>
      <li v-if="!visibles.length" role="presentation" class="ui-caption px-3 py-2">{{ labels.emptyFiltered }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { sinAcentos } from '../../utils/texto'

// `group`: las opciones seguidas con el mismo grupo van juntas bajo su leyenda («Programas», «Jornadas»).
// Con más de 10 opciones (o con `searchable`), el menú lleva un buscador arriba: sin acentos ni mayúsculas.
// `pinned`: siempre a la vista, también al buscar («Nuevo lugar…», «Sin programa»).
interface Option { value: string | number | null, label: string, group?: string, pinned?: boolean }

// Selector con menú propio (teclado: flechas, Enter, Escape). `form` es un campo de
// formulario; `toolbar` es un filtro que se ajusta a su contenido («Tipo: Todos») y, al abrirse,
// encabeza su menú con lo que filtra (el prefijo, como leyenda). Las opciones pueden ir en grupos,
// cada uno bajo su leyenda.
const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: Option[]
  label?: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  variant?: 'form' | 'toolbar'
  prefix?: string
  searchable?: boolean
}>(), {
  searchable: undefined,
  size: 'md',
  variant: 'form',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const labels = useUiLabels()
const uid = useId()
const open = ref(false)
const active = ref(-1)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const posicion = ref<Record<string, string>>({})

const selected = computed(() => props.options.find(o => o.value === props.modelValue) ?? null)

// El buscador: con más de 10 opciones, salvo que se diga otra cosa. Lo que se ve son las que coinciden.
const MUCHAS = 10
const buscable = computed(() => props.searchable ?? props.options.length > MUCHAS)
const consulta = ref('')
const buscador = ref<HTMLInputElement | null>(null)
const visibles = computed(() => {
  const q = buscable.value ? sinAcentos(consulta.value.trim()) : ''
  return q ? props.options.filter(o => o.pinned || sinAcentos(o.label).includes(q)) : props.options
})
watch(consulta, () => { active.value = 0 })

// El menú se abre donde cabe en la ventana: hacia la izquierda si a la derecha se sale (el de
// barra es más ancho que su botón) y hacia arriba si abajo no cabe y arriba hay más sitio. Se
// mide antes de pintarse, así nunca asoma fuera ni abre el desplazamiento de la página.
const MARGEN = 8
const SEPARACION = 6
function colocar() {
  const menu = list.value, boton = trigger.value, caja = root.value
  if (!menu || !boton || !caja) return
  const b = boton.getBoundingClientRect()
  const anchoVentana = document.documentElement.clientWidth
  const estilo: Record<string, string> = {}
  if (b.left + menu.offsetWidth > anchoVentana - MARGEN) Object.assign(estilo, { left: 'auto', right: '0' })
  const abajo = window.innerHeight - b.bottom - SEPARACION - MARGEN
  const arriba = b.top - SEPARACION - MARGEN
  if (menu.offsetHeight > abajo && arriba > abajo) {
    Object.assign(estilo, { top: 'auto', bottom: `${caja.offsetHeight - boton.offsetTop + SEPARACION}px`, marginTop: '0', maxHeight: `${arriba}px` })
  }
  else if (menu.offsetHeight > abajo) estilo.maxHeight = `${Math.max(abajo, 120)}px`
  posicion.value = estilo
}

function openList() {
  posicion.value = {}
  consulta.value = ''
  open.value = true
  active.value = Math.max(0, props.options.findIndex(o => o.value === props.modelValue))
  nextTick(() => {
    colocar()
    if (buscable.value) buscador.value?.focus({ preventScroll: true })
    else list.value?.focus({ preventScroll: true })
  })
}

// Si cambia la ventana con el menú abierto (girar el teléfono, la barra del navegador), se vuelve a colocar.
function recolocar() {
  if (!open.value) return
  posicion.value = {}
  nextTick(colocar)
}

function toggle() {
  if (open.value) open.value = false
  else openList()
}

function choose(value: string | number | null) {
  emit('update:modelValue', value)
  open.value = false
}

function onTriggerKey(e: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
    e.preventDefault()
    openList()
  }
}

// Las teclas valen igual en la lista y en el buscador; en el buscador, el espacio, Inicio y Fin escriben.
function onListKey(e: KeyboardEvent) {
  const last = visibles.value.length - 1
  const enBuscador = e.target === buscador.value
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(last, active.value + 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(0, active.value - 1) }
  else if (e.key === 'Home' && !enBuscador) { e.preventDefault(); active.value = 0 }
  else if (e.key === 'End' && !enBuscador) { e.preventDefault(); active.value = last }
  else if (e.key === 'Enter' || (e.key === ' ' && !enBuscador)) {
    e.preventDefault()
    const opt = visibles.value[active.value]
    if (opt) choose(opt.value)
  }
  else if (e.key === 'Escape' || e.key === 'Tab') { open.value = false }
}

function onClickOutside(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('resize', recolocar)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('resize', recolocar)
})
</script>
