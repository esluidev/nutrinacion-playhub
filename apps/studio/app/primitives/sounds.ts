// ─────────────────────────────────────────────────────────────────────────────
// SOUNDS — synthesized audio library, ported verbatim from the StoryPlay DS
// (window.Sounds). All effects are generated with the Web Audio API on the
// fly — no files, universal across languages.
//
// Narration (pre-recorded ElevenLabs + Howler) is a SEPARATE future layer
// (useAudio); speak() below is the Web Speech fallback from the DS.
// ─────────────────────────────────────────────────────────────────────────────

export type SoundName = 'tick' | 'whoosh' | 'pop' | 'success' | 'error' | 'celebrate' | 'dice-roll' | 'coin'

// Global mute (HUD control): silences EVERYTHING — effects and voice —
// per the StoryPlay spec ("mute = silencia todo")
let muted = false

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  // Browsers block audio until user interaction
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

// --- tick: 60ms click on wheel sector crossing / reorder drop ---
function playTick() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.06)
  gain.gain.setValueAtTime(0.22, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.07)
}

// --- whoosh: 500ms sweep for card flips ---
function playWhoosh() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200, now)
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.5)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2000, now)
  gain.gain.setValueAtTime(0.0, now)
  gain.gain.linearRampToValueAtTime(0.18, now + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.5)
}

// --- pop: 160ms dual oscillator for drops / modal entrance ---
function playPop() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.type = 'sine'
  osc2.type = 'triangle'
  osc1.frequency.setValueAtTime(400, now)
  osc1.frequency.exponentialRampToValueAtTime(900, now + 0.12)
  osc2.frequency.setValueAtTime(600, now)
  osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.12)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.22, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)
  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 0.17)
  osc2.stop(now + 0.17)
}

// --- success: ascending cheerful arpeggio (C5, E5, G5) ---
function playSuccess() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = now + i * 0.08
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.22)
  })
}

// --- error: two descending notes, soft (G4, E4) ---
function playError() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [392.0, 329.63]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.12
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.16, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.24)
  })
}

// --- celebrate: longer ascending fanfare (C5, E5, G5, C6) ---
function playCelebrate() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = now + i * 0.1
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.37)
  })
}

// --- coin: classic two-note arcade coin (B5 → E6, square wave) — the
//     points-earned sound, à la Mario ---
function playCoin() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  // Short B5 grace note, then E6 ringing out
  osc.frequency.setValueAtTime(987.77, now)
  osc.frequency.setValueAtTime(1318.51, now + 0.085)
  // Square waves are loud: keep the level well below the sine/triangle sfx
  gain.gain.setValueAtTime(0.1, now)
  gain.gain.setValueAtTime(0.1, now + 0.085)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.62)
}

// --- dice-roll: multiple tumbling clicks over ~650ms ---
function playDiceRoll() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime

  // Each click: short burst of filtered white noise + pitched thunk,
  // 5 clicks spread across the roll, decreasing in volume
  const clickTimes = [0.0, 0.12, 0.28, 0.46, 0.62]
  const volumes = [0.28, 0.32, 0.26, 0.18, 0.12]

  clickTimes.forEach((t, i) => {
    const start = now + t
    const vol = volumes[i]!

    // Noise burst (wood/plastic click)
    const bufferSize = ctx.sampleRate * 0.06
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 1800 + Math.random() * 600
    noiseFilter.Q.value = 1.5

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0, start)
    noiseGain.gain.linearRampToValueAtTime(vol, start + 0.003)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.05)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(start)
    noise.stop(start + 0.06)

    // Low thunk (body of the impact)
    const thunk = ctx.createOscillator()
    const thunkGain = ctx.createGain()
    thunk.type = 'sine'
    const baseFreq = 140 + Math.random() * 40
    thunk.frequency.setValueAtTime(baseFreq, start)
    thunk.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, start + 0.04)
    thunkGain.gain.setValueAtTime(0, start)
    thunkGain.gain.linearRampToValueAtTime(vol * 0.7, start + 0.003)
    thunkGain.gain.exponentialRampToValueAtTime(0.001, start + 0.05)
    thunk.connect(thunkGain)
    thunkGain.connect(ctx.destination)
    thunk.start(start)
    thunk.stop(start + 0.06)
  })
}

// --- TTS via Web Speech API (fallback narration, from the DS) ---
function speak(text: string, opts: { lang?: string; rate?: number; pitch?: number } = {}) {
  if (muted) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = opts.lang ?? 'es-MX'
  u.rate = opts.rate ?? 1.05
  u.pitch = opts.pitch ?? 1.8
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    /Paulina|Microsoft Dalia|es-MX|es-US|es_MX/i.test(`${v.name} ${v.lang}`))
  if (preferred) u.voice = preferred
  window.speechSynthesis.speak(u)
}

export const Sounds = {
  setMuted(value: boolean) {
    muted = value
    if (value && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  },
  isMuted() {
    return muted
  },
  play(name: SoundName) {
    if (muted) return
    switch (name) {
      case 'tick': playTick(); break
      case 'whoosh': playWhoosh(); break
      case 'pop': playPop(); break
      case 'success': playSuccess(); break
      case 'error': playError(); break
      case 'celebrate': playCelebrate(); break
      case 'dice-roll': playDiceRoll(); break
      case 'coin': playCoin(); break
    }
  },
  speak,
}
