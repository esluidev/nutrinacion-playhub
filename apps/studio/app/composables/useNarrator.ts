import { inject } from 'vue'
import { NARRATOR_KEY, type SceneNarrate } from '~/primitives/narration'
import { speak } from '~/primitives/speech'

// Scene-facing narrator. Inside the runner the shell provides a context-bound
// narrator that plays the matching pre-recorded wav (Web Speech fallback when a
// line has no audio). Mounted standalone (no shell), it just synthesizes.
//
//   const narrate = useNarrator()
//   narrate(t('speak'), s => (speaking.value = s))
export function useNarrator(): SceneNarrate {
  return inject(NARRATOR_KEY, (text, onState) => speak(text, onState))
}
