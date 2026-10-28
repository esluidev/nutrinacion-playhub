<template>
  <!-- Anuncio (Situar): la Bienvenida, dibujada desde datos, igual en todos los modos. -->
  <section class="welcome" :data-area="storyboard.category" :aria-labelledby="`${uid}-topic`">
    <div class="welcome-text">
      <p class="welcome-kicker">
        <span class="badge" :data-area="storyboard.category">{{ AREA_LABELS[storyboard.category] }}</span>
        <span class="badge">{{ profile.label }}</span>
      </p>
      <p v-if="title.lead" class="welcome-lead">{{ title.lead }}</p>
      <h2 :id="`${uid}-topic`" class="welcome-topic" tabindex="-1">{{ title.topic }}</h2>
      <p v-if="subtitle" class="welcome-subtitle">{{ subtitle }}</p>
    </div>
    <div class="welcome-art" aria-hidden="true">
      <img v-if="image" :src="image" alt="">
    </div>
  </section>
</template>

<script setup lang="ts">
import { tr } from '~/types/i18n'
import { librarySvg } from '../content'
import { AREA_LABELS } from '../profiles'
import type { TemplateProps } from '../types'

const props = defineProps<TemplateProps>()
defineEmits<{ feedback: [], progress: [], complete: [] }>()

const uid = useId()
const text = (key: string) => {
  const value = props.scene.strings?.[key]
  return value ? tr(value, props.locale) : ''
}

// strings.title marca con {{ }} el tema: lo anterior es la entrada («Hoy vamos a conocer»),
// lo marcado es el tema en grande («el huevo»).
const title = computed(() => {
  const raw = text('title')
  const match = raw.match(/^(.*?)\{\{(.+?)\}\}(.*)$/)
  if (!match) return { lead: '', topic: raw }
  return { lead: match[1]!.trim(), topic: `${match[2]}${match[3]}`.trim() }
})
const subtitle = computed(() => text('subtitle'))
const image = computed(() => librarySvg(props.scene.library.svg[0]))

defineExpose({ fit: () => {} })
</script>
