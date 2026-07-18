import { defineStore } from 'pinia'

// Per-session game state for the storyboard being played (StoryPlay spec §11):
// points, completed scenes. In memory only — reloading restarts the workshop.
export const useGameState = defineStore('gameState', {
  state: () => ({
    storyboardId: '' as string,
    points: 0,
    completedScenes: [] as number[],
    /** Run start timestamp — the summary scene shows elapsed time */
    startedAt: 0,
    /** Scene count of the storyboard being played (set by the runner) */
    totalScenes: 0,
  }),

  getters: {
    completedCount: state => state.completedScenes.length,
    isSceneCompleted: state => (index: number) => state.completedScenes.includes(index),
  },

  actions: {
    start(storyboardId: string, totalScenes = 0) {
      // A run always starts clean: re-entering the same storyboard in the same
      // session must not inherit points/progress (in kid mode every scene would
      // count as already completed and the completion overlay — the only way
      // to advance — would never show)
      this.reset()
      this.storyboardId = storyboardId
      this.totalScenes = totalScenes
      this.startedAt = Date.now()
    },
    addScore(points: number) {
      this.points += points
    },
    markCompleted(index: number) {
      if (!this.completedScenes.includes(index)) {
        this.completedScenes.push(index)
      }
    },
    reset() {
      this.storyboardId = ''
      this.points = 0
      this.completedScenes = []
      this.startedAt = 0
      this.totalScenes = 0
    },
  },
})
