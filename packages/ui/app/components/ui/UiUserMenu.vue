<template>
  <!-- Menú de la cuenta, igual en Admin, Player y Educators: botón de contorno con el avatar, el
       nombre y un dato (correo u organización); al abrirlo, la identidad, las opciones de la app y
       «Cerrar sesión» en coral. -->
  <div ref="root" class="relative">
    <UiButton
      variant="outline"
      class="py-1 pl-1.5 pr-3"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="menuLabel"
      @click="open = !open"
    >
      <UiAvatar :name="name" />
      <span class="hidden text-left sm:block">
        <span class="block text-caption font-bold leading-tight text-ink">{{ shortName ?? name }}</span>
        <span v-if="detail" class="block max-w-36 truncate text-micro font-semibold leading-tight text-muted">{{ detail }}</span>
      </span>
      <UiIcon name="chevron-down" :class="['hidden size-3.5 text-muted transition-transform sm:block', open && 'rotate-180']" />
    </UiButton>

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div v-if="open" class="ui-listbox right-0 top-full z-50 w-60" role="menu">
        <div class="mb-1.5 flex items-center gap-2.5 border-b border-line px-3 py-2.5">
          <UiAvatar :name="name" />
          <div class="min-w-0">
            <p class="truncate text-body font-extrabold text-ink">{{ name }}</p>
            <p v-if="detail" class="mt-px truncate text-caption font-semibold text-muted">{{ detail }}</p>
          </div>
        </div>

        <component
          :is="item.to ? NuxtLink : 'button'"
          v-for="item in items"
          :key="item.key"
          v-bind="item.to ? { to: item.to } : { type: 'button' }"
          class="ui-option justify-start gap-2.5"
          role="menuitem"
          @click="elegir(item.key)"
        >
          <UiIcon :name="item.icon" class="size-4 shrink-0 text-subtle" />
          {{ item.label }}
        </component>

        <div v-if="items.length" class="my-1.5 border-t border-line" />
        <button
          type="button"
          data-tone="coral"
          class="ui-option justify-start gap-2.5 text-(--tone-strong) hover:bg-(--tone-wash)"
          role="menuitem"
          @click="salir"
        >
          <UiIcon name="logout" class="size-4 shrink-0" />
          {{ signOutLabel }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { UiIconName } from '../../utils/ui-icons'

export interface UiUserMenuItem {
  key: string
  label: string
  icon: UiIconName
  to?: string
}

withDefaults(defineProps<{
  name: string
  // Nombre corto en el botón; el completo va en el menú.
  shortName?: string
  // Dato bajo el nombre: correo en Admin y Player, organización en Educators.
  detail?: string
  items?: UiUserMenuItem[]
  signOutLabel?: string
  menuLabel?: string
}>(), {
  items: () => [],
  signOutLabel: 'Cerrar sesión',
  menuLabel: 'Menú de la cuenta',
})

const emit = defineEmits<{ select: [key: string], signOut: [] }>()

const NuxtLink = resolveComponent('NuxtLink')
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const route = useRoute()

function elegir(key: string) {
  open.value = false
  emit('select', key)
}
function salir() {
  open.value = false
  emit('signOut')
}

watch(() => route.path, () => (open.value = false))
function fuera(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function escape(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', fuera)
  document.addEventListener('keydown', escape)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', fuera)
  document.removeEventListener('keydown', escape)
})
</script>
