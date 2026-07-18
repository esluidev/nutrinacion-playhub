<template>
  <!-- Regla 16: only playable elements — the zones and parts explain
       themselves; the instruction lives in the HUD audio, the feedback in
       the shell's strip -->
  <div class="scene">
    <!-- Parts tray — identity-colored cards. Softly locked while the Tarjeta
         de Saber narrates (kid only) so the facts don't pile up -->
    <div class="tray">
      <Draggable
        v-for="part in shuffledParts"
        :key="part.id"
        :data="part.id"
        :label="part.name"
        :color="PART_VARIANT[part.id]"
        class="tray-card"
        @dragstart="emit('knowledge', null)"
      >
        <div class="tray-part">
          <EggPartSticker :part="part.id" />
        </div>
      </Draggable>
    </div>

    <!-- Power zones: compact — they hold ONE part, shown as its sticker -->
    <div class="zones">
      <DropZone
        v-for="part in PARTS"
        :key="part.id"
        :accepts="[part.id]"
        :max="1"
        :title="part.benefit"
        :emoji="part.benefitEmoji"
        class="power-zone"
        @drop="onMatch(part)"
      >
        <template #chip>
          <div class="zone-part">
            <EggPartSticker :part="part.id" />
          </div>
        </template>
      </DropZone>
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, ref } from 'vue'
import type { DraggableColor } from '~/primitives/Draggable/Draggable.types'
import Draggable from '~/primitives/Draggable/Draggable.vue'
import DropZone from '~/primitives/DropZone/DropZone.vue'
import { Sounds } from '~/primitives/sounds'
import EggPartSticker from '~/sprites/EggPartSticker.vue'
import { partsFor, type EggPart } from '../../eggs'
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

// Egg parts resolved to the active content language (name/benefit/fact → plain).
// All text lives in eggs.ts (PARTS), shared with the quiz — no scene strings.
const PARTS = partsFor(props.locale ?? 'es')

// Each card wears an identity tint: cáscara café-rojiza, clara azul, yema amarilla
const PART_VARIANT: Record<string, DraggableColor> = {
  cascara: 'red',
  clara: 'blue',
  yema: 'yellow',
}

// Tray order independent of zone order, so it's a real challenge
const shuffledParts = ref<EggPart[]>([...PARTS].sort(() => Math.random() - 0.5))
const matches = ref(0)
let completed = false

function onMatch(part: EggPart) {
  matches.value++
  emit('score', 10)
  // The dato goes out as knowledge (regla 15): visible text in every mode
  // (the teacher's script), narrated automatically in kid
  emit('knowledge', {
    title: part.name,
    html: part.factHtml,
    voice: part.factVoice,
    visual: { component: markRaw(EggPartSticker), props: { part: part.id } },
  })

  if (matches.value >= PARTS.length && !completed) {
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
  min-width: 168px;
  padding: 18px 20px 14px;
  border-radius: 26px;
}

.tray-part {
  width: 120px;
  height: 82px;
}

.zones {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 26px;
  width: 100%;
  max-width: 980px;
}

/* Compact: a zone holds ONE part — no reason to be a wall */
.power-zone {
  min-height: 240px;
}

/* The landed part sits centered in the zone body */
.power-zone :deep(.drop-zone-slots) {
  align-items: center;
}

.zone-part {
  width: 150px;
  height: 102px;
}
</style>
