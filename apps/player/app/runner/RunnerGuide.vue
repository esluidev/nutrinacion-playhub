<template>
  <!-- La guía de la escena actual (modo educador), en cuatro pestañas. Los campos vacíos o
       «no requiere» no se muestran; Mecánica dice «Pendiente» hasta que la guía la llene. -->
  <aside class="side-panel guide" data-side="left" :data-area="category" :aria-labelledby="`${uid}-title`">
    <div class="panel-head">
      <div>
        <p class="guide-meta">
          <span class="badge" :data-area="category">{{ AREA_LABELS[category] }}</span>
          <span v-if="guide?.verb" class="badge">{{ guide.verb }}</span>
          <span class="panel-caption">{{ txt('guideOf', { n: scene.number, total }) }}</span>
        </p>
        <h2 :id="`${uid}-title`" class="ui-heading">{{ scene.title }}</h2>
      </div>
      <UiButton ref="closeButton" tone="neutral" size="sm" icon="close" icon-only :label="txt('closeGuide')" @click="emit('close')" />
    </div>
    <p v-if="guide?.subtitle" class="guide-subtitle">{{ guide.subtitle }}</p>
    <UiTabs v-model="tab" class="guide-tabs" :items="tabs" :label="txt('guideTabs')" />
    <div ref="body" class="panel-scroll guide-body" role="tabpanel" tabindex="0" :data-more="more" @scroll="syncFade">
      <p v-if="!guide" class="ui-text">{{ txt('noGuide') }}</p>
      <section v-for="block in blocks" :key="block.label" :class="['guide-block', block.callout && 'guide-callout']">
        <h3 class="guide-label"><UiIcon :name="block.icon" />{{ block.label }}</h3>
        <template v-if="block.questions">
          <ul v-if="split(block.text).questions.length" class="guide-questions">
            <li v-for="q in split(block.text).questions" :key="q">{{ q }}</li>
          </ul>
          <p v-if="split(block.text).rest">{{ split(block.text).rest }}</p>
        </template>
        <p v-else :class="block.text === txt('pending') && 'is-pending'">{{ block.text }}</p>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { SceneGuide } from '@playhub/ui/app/utils/runner-contract'
import { useRunnerText } from './i18n'
import { AREA_LABELS } from './profiles'
import type { RunnerScene } from './types'

const props = defineProps<{
  scene: RunnerScene
  total: number
  category: string
  guide: SceneGuide | null
  locale: string
}>()

const emit = defineEmits<{ close: [] }>()

const txt = useRunnerText(() => props.locale)
const uid = useId()
const tab = ref('escena')
const body = ref<HTMLElement | null>(null)
const more = ref(false)

const tabs = computed(() => [
  { value: 'escena', label: txt('tabScene'), icon: 'compass' as const },
  { value: 'conducir', label: txt('tabLead'), icon: 'book' as const },
  { value: 'preguntas', label: txt('tabQuestions'), icon: 'chat' as const },
  { value: 'consejos', label: txt('tabTips'), icon: 'sparkles' as const },
])

interface Block { label: string, icon: UiIconName, text?: string, callout?: boolean, questions?: boolean }

const blocks = computed<(Block & { text: string })[]>(() => {
  const g = props.guide
  if (!g) return []
  const sections: Record<string, Block[]> = {
    escena: [
      { label: txt('objective'), icon: 'compass', text: g.objective, callout: true },
      { label: txt('description'), icon: 'book', text: g.description },
      { label: txt('mechanic'), icon: 'grid', text: g.mechanic || txt('pending') },
    ],
    conducir: [{ label: txt('pedagogy'), icon: 'chat', text: g.pedagogy }],
    preguntas: [
      { label: txt('questions'), icon: 'chat', text: g.questions, questions: true },
      { label: txt('psychology'), icon: 'heart', text: g.psychology },
    ],
    consejos: [
      { label: txt('tips'), icon: 'sparkles', text: g.tips },
      { label: txt('notDoing'), icon: 'warning', text: g.notDoing },
      { label: txt('science'), icon: 'info', text: g.science },
    ],
  }
  const isEmpty = (text?: string) => !text || /^no requiere/i.test(text)
  return (sections[tab.value] ?? []).filter(b => !isEmpty(b.text)) as (Block & { text: string })[]
})

// Las preguntas entre comillas («“…?”») se muestran como fichas; el resto, como texto.
function split(text: string) {
  const questions = [...text.matchAll(/“([^”]*\?)”/g)].map(m => m[1]!)
  const rest = text.split(/(?<=[.…])\s+(?=[A-ZÁÉÍÓÚÑ])/).filter(s => !questions.some(q => s.includes(q))).join(' ')
  return { questions, rest: questions.length ? rest : text }
}

// El texto largo se desplaza sin barra visible; un desvanecido dice que hay más abajo.
function syncFade() {
  const el = body.value
  if (el) more.value = el.scrollTop + el.clientHeight < el.scrollHeight - 2
}

watch([tab, () => props.scene], () => nextTick(() => {
  if (body.value) body.value.scrollTop = 0
  syncFade()
}))
onMounted(syncFade)
</script>
