import { computed, onBeforeUnmount, ref } from 'vue'
import { Sounds } from '~/primitives/sounds'
import type { ExerciseTimerOptions } from './ExerciseTimer.types'

// Countdown of a physical exercise: N seconds running down, with an optional
// BEAT (tick sound + event) marking the rhythm the child follows. The timer
// paces the exercise; what the movement looks like is PoseGuide's job.
export function useExerciseTimer(opts: ExerciseTimerOptions, hooks?: {
  onSecond?: (left: number) => void
  onBeat?: (n: number) => void
  onDone?: () => void
}) {
  const duration = Math.max(1, Math.round(opts.duration))
  const secondsLeft = ref(duration)
  const running = ref(false)

  let secondTimer: ReturnType<typeof setInterval> | null = null
  let beatTimer: ReturnType<typeof setInterval> | null = null
  let beats = 0

  const progress = computed(() => 1 - secondsLeft.value / duration)
  const done = computed(() => secondsLeft.value <= 0)

  function clearTimers() {
    if (secondTimer) clearInterval(secondTimer)
    if (beatTimer) clearInterval(beatTimer)
    secondTimer = null
    beatTimer = null
  }

  function start() {
    if (running.value || done.value) return
    running.value = true
    secondTimer = setInterval(() => {
      secondsLeft.value--
      hooks?.onSecond?.(secondsLeft.value)
      if (secondsLeft.value <= 0) {
        stop()
        hooks?.onDone?.()
      }
    }, 1000)
    if (opts.beatMs && opts.beatMs > 0) {
      beatTimer = setInterval(() => {
        beats++
        Sounds.play('tick')
        hooks?.onBeat?.(beats)
      }, opts.beatMs)
    }
  }

  function stop() {
    running.value = false
    clearTimers()
  }

  function reset() {
    stop()
    beats = 0
    secondsLeft.value = duration
  }

  onBeforeUnmount(stop)

  return { secondsLeft, running, progress, done, start, stop, reset }
}
