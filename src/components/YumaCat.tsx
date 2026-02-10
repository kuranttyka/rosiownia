import { useEffect, useRef, useState, useCallback } from 'react'

// ===== PIXEL ART SPRITE DATA =====
// Each frame is an array of strings. Each char = 1 pixel.
// Color map:
const PALETTE: Record<string, string> = {
  '.': '', // transparent
  K: '#3a3040', // outline/dark
  W: '#f5efe6', // cream fur
  w: '#faf8f4', // white fur
  B: '#d9c4a8', // beige
  C: '#c4a57b', // caramel stripe
  T: '#b08f6a', // tabby dark
  P: '#edb5be', // pink (ear/paw)
  N: '#dfa0a8', // nose pink
  E: '#7c9ab8', // eye blue
  D: '#2a2535', // pupil dark
  H: '#ffffff', // eye highlight
  G: '#e8d8c8', // light beige
  M: '#c9908a', // mouth
  R: '#b49cfc', // purr note
  S: '#4a4050', // shadow/outline soft
}

const SCALE = 7
const FRAME_W = 20
const FRAME_H = 20

// ---- IDLE: sitting, side view ----
const idle1 = [
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWEWKDWK........',
  '....KWWWEWDK........',
  '....KKWNWWKK........',
  '.....KMWWMK.........',
  '....KwwwwwwK.........',
  '...KwWCWWCWwK........',
  '..KwWWCWWCWWwKK......',
  '..KwWWWWWWWWwK.K.....',
  '..KwWWWWWWWWwK..K....',
  '...KwWWWWWWwK...K....',
  '...KwwwwwwwwK..K.....',
  '....KWK..KWK.K.......',
  '....KPK..KPKKK.......',
  '.........KKK.........',
  '....................',
  '....................',
  '....................',
]

const idle2 = [
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWEWKDWK........',
  '....KWWWEWDK........',
  '....KKWNWWKK........',
  '.....KMWWMK.........',
  '....KwwwwwwK.........',
  '...KwWCWWCWwK........',
  '..KwWWCWWCWWwK.K.....',
  '..KwWWWWWWWWwKK......',
  '..KwWWWWWWWWwK.......',
  '...KwWWWWWWwK........',
  '...KwwwwwwwwKK.......',
  '....KWK..KWK.K.......',
  '....KPK..KPK..K......',
  '..........KK.K.......',
  '...........KK........',
  '....................',
  '....................',
]

const idle3 = [ // blink
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWSKKSW K........',
  '....KWWWWWWK........',
  '....KKWNWWKK........',
  '.....KMWWMK.........',
  '....KwwwwwwK.........',
  '...KwWCWWCWwK........',
  '..KwWWCWWCWWwKK......',
  '..KwWWWWWWWWwK.K.....',
  '..KwWWWWWWWWwK..K....',
  '...KwWWWWWWwK...K....',
  '...KwwwwwwwwK..K.....',
  '....KWK..KWK.K.......',
  '....KPK..KPKKK.......',
  '.........KKK.........',
  '....................',
  '....................',
  '....................',
]

// ---- WALK: 4 frames, side view ----
const walk1 = [
  '....................',
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWEWKDWK........',
  '....KWWWEWDK........',
  '....KKWNWWKK........',
  '.....KwwwwK..........',
  '...KwWWCWWwK.........',
  '..KwWWCWWCWwK........',
  '..KwWWWWWWWwK........',
  '..KwWWWWWWWwK........',
  '...KwwwwwwwK.........',
  '...KWK.KWK..........',
  '..KPK...KPK.........',
  '.KKK.....KKK........',
  '....................',
  '....................',
  '....................',
  '....................',
]

const walk2 = [
  '....................',
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWEWKDWK........',
  '....KWWWEWDK........',
  '....KKWNWWKK........',
  '.....KwwwwK..........',
  '...KwWWCWWwK.........',
  '..KwWWCWWCWwK........',
  '..KwWWWWWWWwK........',
  '..KwWWWWWWWwK........',
  '...KwwwwwwwK.........',
  '....KWK.KWK.........',
  '....KPK.KWK.........',
  '....KKK.KPK.........',
  '.........KKK........',
  '....................',
  '....................',
  '....................',
]

const walk3 = [
  '....................',
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWEWKDWK........',
  '....KWWWEWDK........',
  '....KKWNWWKK........',
  '.....KwwwwK..........',
  '...KwWWCWWwK.........',
  '..KwWWCWWCWwK........',
  '..KwWWWWWWWwK........',
  '..KwWWWWWWWwK........',
  '...KwwwwwwwK.........',
  '...KWK..KWK.........',
  '...KWK..KPK.........',
  '...KPK..KKK.........',
  '...KKK..............',
  '....................',
  '....................',
  '....................',
]

const walk4 = [
  '....................',
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWEWKDWK........',
  '....KWWWEWDK........',
  '....KKWNWWKK........',
  '.....KwwwwK..........',
  '...KwWWCWWwK.........',
  '..KwWWCWWCWwK........',
  '..KwWWWWWWWwK........',
  '..KwWWWWWWWwK........',
  '...KwwwwwwwK.........',
  '....KWK.KWK.........',
  '...KWK...KPK........',
  '..KPK.....KKK.......',
  '..KKK..................',
  '....................',
  '....................',
  '....................',
]

// ---- SIT: relaxed ----
const sit1 = [
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWSKKSW K........',
  '....KWWWWWWK........',
  '....KKWNWWKK........',
  '.....KwwwwK..........',
  '....KwwwwwwK.........',
  '...KwWCWWCWwK........',
  '..KwWWCWWCWWwKK......',
  '..KwWWWWWWWWwK.K.....',
  '..KwWWWWWWWWwK..K....',
  '...KWWWWWWWWK...K....',
  '...KwwPwwPwwK..K.....',
  '....KKKKKKKK.K.......',
  '.............KK......',
  '....................',
  '....................',
  '....................',
  '....................',
]

const sit2 = [
  '.....KK..KK........',
  '....KPWKKWPK........',
  '....KWWWWWWK........',
  '....KWSKKSW K........',
  '....KWWWWWWK........',
  '....KKWNWWKK........',
  '.....KwwwwK..........',
  '....KwwwwwwK.........',
  '...KwWCWWCWwK........',
  '..KwWWCWWCWWwK..K....',
  '..KwWWWWWWWWwK.K.....',
  '..KwWWWWWWWWwKK......',
  '...KWWWWWWWWK........',
  '...KwwPwwPwwKK.......',
  '....KKKKKKKK.K.......',
  '..............K......',
  '..............K......',
  '....................',
  '....................',
  '....................',
]

// ---- SLEEP: curled up ----
const sleep1 = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....KK..KK..........',
  '...KPWKKWPK.........',
  '...KWWSWSWK.........',
  '...KWWNWWK..........',
  '..KwWWWWWWwK.........',
  '.KwWWCWCWWwKK........',
  '.KwWWWWWWWwK.K.......',
  '..KwwwwwwwK..K.......',
  '...KKKKKKK..K.......',
  '............K.......',
  '....................',
]

const sleep2 = [
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....KK..KK..........',
  '...KPWKKWPK.........',
  '...KWWSWSWK.........',
  '...KWWNWWK..........',
  '..KwWWWWWWwK.........',
  '.KwWWCWCWWwK.K.......',
  '.KwWWWWWWWwKK........',
  '..KwwwwwwwK.........',
  '...KKKKKKK..........',
  '....................',
  '....................',
]

// ===== ANIMATION DEFINITIONS =====
type CatState = 'idle' | 'walk' | 'sit' | 'sleep'

const ANIMATIONS: Record<CatState, { frames: string[][]; speed: number }> = {
  idle: { frames: [idle1, idle1, idle2, idle2, idle1, idle1, idle3, idle1], speed: 200 },
  walk: { frames: [walk1, walk2, walk3, walk4], speed: 150 },
  sit: { frames: [sit1, sit2], speed: 400 },
  sleep: { frames: [sleep1, sleep2], speed: 600 },
}

// ===== RENDER FRAME TO CANVAS =====
function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  scale: number,
  flipped: boolean,
) {
  ctx.save()
  if (flipped) {
    ctx.scale(-1, 1)
    ctx.translate(-FRAME_W * scale, 0)
  }
  for (let y = 0; y < frame.length; y++) {
    const row = frame[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      const color = PALETTE[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
  ctx.restore()
}

// ===== COMPONENT =====
export default function YumaCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    x: 200,
    catState: 'idle' as CatState,
    frameIdx: 0,
    facingRight: true,
    targetX: 300,
    stateTimer: 0,
    lastFrameTime: 0,
    lastStateChange: 0,
    mouseX: -1000,
    mouseY: -1000,
  })

  const tick = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = Date.now()
    const s = stateRef.current
    const anim = ANIMATIONS[s.catState]

    // Advance animation frame
    if (now - s.lastFrameTime > anim.speed) {
      s.frameIdx = (s.frameIdx + 1) % anim.frames.length
      s.lastFrameTime = now
    }

    // State machine
    const timeSinceChange = now - s.lastStateChange

    // Mouse following: if mouse is near bottom, set target
    const viewH = window.innerHeight
    if (s.mouseY > viewH - 200 && s.mouseX > 0) {
      if (s.catState !== 'sleep') {
        s.targetX = s.mouseX
        if (Math.abs(s.x - s.targetX) > 30) {
          if (s.catState !== 'walk') {
            s.catState = 'walk'
            s.frameIdx = 0
            s.lastStateChange = now
          }
        }
      }
    }

    switch (s.catState) {
      case 'idle':
        if (timeSinceChange > 2000 + Math.random() * 3000) {
          const r = Math.random()
          if (r < 0.4) {
            s.catState = 'walk'
            s.targetX = 100 + Math.random() * (window.innerWidth - 200)
          } else if (r < 0.7) {
            s.catState = 'sit'
          } else {
            s.catState = 'sleep'
          }
          s.frameIdx = 0
          s.lastStateChange = now
        }
        break
      case 'walk': {
        const dx = s.targetX - s.x
        if (Math.abs(dx) < 5) {
          s.catState = 'idle'
          s.frameIdx = 0
          s.lastStateChange = now
        } else {
          s.x += Math.sign(dx) * 1.8
          s.facingRight = dx > 0
        }
        break
      }
      case 'sit':
        if (timeSinceChange > 4000 + Math.random() * 4000) {
          s.catState = Math.random() > 0.5 ? 'idle' : 'sleep'
          s.frameIdx = 0
          s.lastStateChange = now
        }
        break
      case 'sleep':
        if (timeSinceChange > 6000 + Math.random() * 6000) {
          s.catState = 'idle'
          s.frameIdx = 0
          s.lastStateChange = now
        }
        break
    }

    // Keep on screen
    const catW = FRAME_W * SCALE
    s.x = Math.max(catW / 2, Math.min(window.innerWidth - catW / 2, s.x))

    // Render
    const dpr = window.devicePixelRatio || 1
    const cw = FRAME_W * SCALE
    const ch = FRAME_H * SCALE
    canvas.width = cw * dpr
    canvas.height = ch * dpr
    canvas.style.width = cw + 'px'
    canvas.style.height = ch + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cw, ch)
    ctx.imageSmoothingEnabled = false

    const frame = anim.frames[s.frameIdx]
    renderFrame(ctx, frame, SCALE, !s.facingRight)

    // Position the canvas
    canvas.style.left = (s.x - cw / 2) + 'px'

    // Sleep frames are lower on screen (cat is smaller/curled)
    if (s.catState === 'sleep') {
      canvas.style.bottom = '-20px'
    } else {
      canvas.style.bottom = '0px'
    }
  }, [])

  useEffect(() => {
    // Initialize position
    stateRef.current.x = window.innerWidth * 0.3 + Math.random() * window.innerWidth * 0.4
    stateRef.current.lastStateChange = Date.now()
    stateRef.current.lastFrameTime = Date.now()

    const onMouse = (e: MouseEvent) => {
      stateRef.current.mouseX = e.clientX
      stateRef.current.mouseY = e.clientY
    }
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        stateRef.current.mouseX = e.touches[0].clientX
        stateRef.current.mouseY = e.touches[0].clientY
      }
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })

    let raf: number
    const loop = () => {
      tick()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [tick])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 50,
        imageRendering: 'pixelated',
      }}
    />
  )
}
