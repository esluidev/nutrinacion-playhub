import type { KidPose } from '~/sprites/kid-poses'

/** One frame of an exercise demo: a pose, optionally mirrored */
export interface PoseFrame {
  pose: KidPose
  mirror?: boolean
}

export interface PoseGuideOptions {
  /** Frame sequence looped while playing (e.g. march L / march R) */
  frames: PoseFrame[]
  /** ms per frame (the demo tempo) */
  interval?: number
}
