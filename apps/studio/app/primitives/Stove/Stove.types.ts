export interface StoveProps {
  /** Cook time in ms once the knob is turned */
  duration?: number
  /** The knob only works when the station is ready (something to cook) */
  ready?: boolean
  /** Sin sonidos (para previews/catálogo — el juego real siempre suena) */
  silent?: boolean
}
