<template>
  <!-- Regla 16: only playable elements — the zones and beans explain
       themselves; the instruction lives in the HUD audio, the feedback in
       the shell's strip -->
  <div class="scene">
    <!-- Bean tray — identity-colored cards (the bean's game color) bring the
         board to life -->
    <div class="tray">
      <Draggable
        v-for="bean in shuffledBeans"
        :key="bean.id"
        ref="draggableRefs"
        :data="bean.id"
        :label="bean.displayName"
        :color="BEAN_VARIANT[bean.id]"
        @dragstart="emit('knowledge', null)"
        class="tray-card"
      >
        <div class="tray-bean">
          <BeanSticker :body="bean.bean.body" :outline="bean.bean.outline" />
        </div>
      </Draggable>
    </div>

    <!-- Power zones: compact — they hold ONE bean, shown as its sticker
         (chip slot), never as a name badge -->
    <div class="zones">
      <DropZone
        v-for="bean in BEANS"
        :key="bean.id"
        ref="zoneRefs"
        :accepts="[bean.id]"
        :max="1"
        :title="bean.benefit"
        :emoji="bean.benefitEmoji"
        class="power-zone"
        @drop="onMatch(bean)"
      >
        <template #chip>
          <div class="zone-bean">
            <BeanSticker :body="bean.bean.body" :outline="bean.bean.outline" />
          </div>
        </template>
      </DropZone>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { useT } from '~/composables/useT'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import DropZone from '~/primitives/DropZone/DropZone.vue'
import { Sounds } from '~/primitives/sounds'
import BeanSticker from '~/sprites/BeanSticker.vue'
import { beansFor, type Bean } from '../../beans'
import sceneConfig from './scene.config'
import type { KnowledgePayload } from '~/types/scene'

const props = defineProps<{
  locale?: string
  config?: Record<string, unknown>
}>()

const emit = defineEmits<{
  complete: []
  score: [points: number]
  knowledge: [payload: KnowledgePayload | null]
}>()

const t = useT(sceneConfig.strings, () => props.locale)
// Bean varieties resolved to the active content language (strings → plain)
const BEANS = beansFor(props.locale ?? 'es')

// Each card wears its bean's game-identity color (same mapping as the wheel)
const BEAN_VARIANT: Record<string, DraggableColor> = {
  rojo: 'red',
  negro: 'blue',
  blanco: 'green',
  pinto: 'yellow',
}

// Tray order independent of zone order, so it's a real challenge
const shuffledBeans = ref<Bean[]>([...BEANS].sort(() => Math.random() - 0.5))
const matches = ref(0)
let completed = false

function onMatch(bean: Bean) {
  matches.value++
  emit('score', 10)
  // The dato goes out as knowledge (regla 15): visible text in every mode
  // (the teacher's script), narrated automatically in kid. Phrasing is
  // localized in scene.config (matchHtml/matchVoice); data fills {placeholders}.
  emit('knowledge', {
    title: bean.displayName,
    html: t('matchHtml', {
      nameLower: bean.name.toLowerCase(),
      displayName: bean.displayName,
      color: bean.nutrientColor,
      benefit: bean.benefit.toLowerCase(),
    }),
    voice: t('matchVoice', {
      name: bean.name,
      displayName: bean.displayName,
      benefit: bean.benefit.toLowerCase(),
    }),
    visual: { component: markRaw(BeanSticker), props: { body: bean.bean.body, outline: bean.bean.outline } },
  })

  if (matches.value >= BEANS.length && !completed) {
    completed = true
    setTimeout(() => {
      Sounds.play('celebrate')
      emit('complete')
    }, 600)
  }
}
</script>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  padding: 120px 70px 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 44px;
  font-family: var(--font-body);
  color: var(--ink);
}

.tray {
  display: flex;
  gap: 28px;
  justify-content: center;
  transition: opacity 200ms ease;
}

.tray-locked {
  pointer-events: none;
  opacity: 0.55;
}

/* Identity-colored cards, sized to feel grabbable */
.tray-card {
  min-width: 152px;
  padding: 18px 20px 14px;
  border-radius: 26px;
}

.tray-bean {
  width: 100px;
  height: 80px;
}

.zones {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  width: 100%;
}

/* Compact: a zone holds ONE bean — no reason to be a wall */
.power-zone {
  min-height: 240px;
}

/* The landed bean sits centered in the zone body */
.power-zone :deep(.drop-zone-slots) {
  align-items: center;
}

.zone-bean {
  width: 124px;
  height: 98px;
}
</style>
