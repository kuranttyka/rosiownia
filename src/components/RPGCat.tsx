import { useEffect, useRef, useState, useCallback } from 'react'

const FRAME_SIZE = 32
const SCALE = 3
const MOVE_SPEED = 3
const ATTACK_DURATION = 4 * 100
const SCROLL_EDGE_THRESHOLD = 50
const SCROLL_SPEED = 2

const ATLAS_SRC = '/sprites/catplayer/atlas.png'

interface SpriteAnim {
  y: number
  yLeft: number
  frames: number
  speed: number
}

const anims: Record<string, SpriteAnim> = {
  idle:   { y: 0,   yLeft: 32,  frames: 3, speed: 200 },
  walk:   { y: 64,  yLeft: 96,  frames: 3, speed: 150 },
  attack: { y: 448, yLeft: 480, frames: 4, speed: 100 },
  sleep:  { y: 384, yLeft: 416, frames: 5, speed: 300 },
}

const ATLAS_W = 288
const ATLAS_H = 704

// Preload atlas
if (typeof window !== 'undefined') {
  const img = new Image()
  img.src = ATLAS_SRC
}

let audioCtx: AudioContext | null = null
let clickAudioBuffer: AudioBuffer | null = null

async function playClickSound() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (!clickAudioBuffer) {
    const response = await fetch('/sounds/click-tape.mp3')
    const arrayBuffer = await response.arrayBuffer()
    clickAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  }
  const source = audioCtx.createBufferSource()
  source.buffer = clickAudioBuffer
  source.connect(audioCtx.destination)
  source.start(0)
}

/**
 * Check if the cat is overlapping any .card element.
 * Returns the card's elevation (z offset) or 0 if on the background.
 */
function getCardElevation(cx: number, cy: number, catW: number, catH: number): number {
  const cards = document.querySelectorAll('.card')
  const catCx = cx + catW / 2
  const catCy = cy + catH / 2
  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    if (
      catCx >= rect.left &&
      catCx <= rect.right &&
      catCy >= rect.top &&
      catCy <= rect.bottom
    ) {
      return 1 // on a card
    }
  }
  return 0
}

export default function RPGCat() {
  const keysRef = useRef<Set<string>>(new Set())
  const stateRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facingRight: true,
    anim: 'idle' as string,
    frame: 0,
    frameTimer: 0,
    idleTimer: 0,
    attackTimer: 0,
    initialized: false,
    onCard: false,
    shadowScale: 1,
  })
  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, touchId: -1 })
  const joystickCenterRef = useRef({ x: 80, y: 0 })

  const [catStyle, setCatStyle] = useState({
    x: 0, y: 0, anim: 'idle', frame: 0, facingRight: true, onCard: false,
  })
  const [joystick, setJoystick] = useState({ dx: 0, dy: 0 })
  const [isMobile, setIsMobile] = useState(false)

  const handleAttack = useCallback((clickX: number) => {
    const s = stateRef.current
    const catCenterX = s.x + (FRAME_SIZE * SCALE) / 2
    s.facingRight = clickX > catCenterX
    s.attackTimer = ATTACK_DURATION
    s.anim = 'attack'
    s.frame = 0
    s.frameTimer = 0
    s.idleTimer = 0
    playClickSound()
  }, [])

  const gameLoop = useCallback((timestamp: number) => {
    const dt = Math.min(timestamp - lastTimeRef.current, 33)
    lastTimeRef.current = timestamp

    const s = stateRef.current
    const keys = keysRef.current
    const catW = FRAME_SIZE * SCALE
    const catH = FRAME_SIZE * SCALE

    if (!s.initialized) {
      s.x = (window.innerWidth - catW) / 2
      s.y = window.innerHeight - catH - 20
      s.initialized = true
    }

    // Attack timer
    if (s.attackTimer > 0) {
      s.attackTimer -= dt
      if (s.attackTimer <= 0) {
        s.attackTimer = 0
        s.vx = 0
        s.vy = 0
      }
    }

    // Movement
    if (s.attackTimer <= 0) {
      const joy = joystickRef.current
      const left  = keys.has('a') || keys.has('arrowleft')  || (joy.active && joy.dx < -20)
      const right = keys.has('d') || keys.has('arrowright') || (joy.active && joy.dx > 20)
      const up    = keys.has('w') || keys.has('arrowup')    || (joy.active && joy.dy < -20)
      const down  = keys.has('s') || keys.has('arrowdown')  || (joy.active && joy.dy > 20)

      let dx = 0, dy = 0
      if (left)  { dx -= MOVE_SPEED; s.facingRight = false }
      if (right) { dx += MOVE_SPEED; s.facingRight = true }
      if (up) dy -= MOVE_SPEED
      if (down) dy += MOVE_SPEED

      if (dx !== 0 && dy !== 0) {
        const norm = Math.sqrt(dx * dx + dy * dy)
        dx = (dx / norm) * MOVE_SPEED
        dy = (dy / norm) * MOVE_SPEED
      }

      s.vx = dx
      s.vy = dy
      s.x += s.vx
      s.y += s.vy

      // Animation state
      const moving = s.vx !== 0 || s.vy !== 0
      let newAnim = s.anim
      if (moving) {
        newAnim = 'walk'
        s.idleTimer = 0
      } else if (s.anim === 'sleep') {
        newAnim = 'sleep'
      } else {
        s.idleTimer += dt
        newAnim = s.idleTimer > 8000 ? 'sleep' : 'idle'
      }
      if (newAnim !== s.anim) {
        s.anim = newAnim
        s.frame = 0
        s.frameTimer = 0
      }
    } else {
      s.vx *= 0.5
      s.vy *= 0.5
      s.x += s.vx
      s.y += s.vy
    }

    // Page-scroll bounds (cat can scroll with page)
    const pageH = document.documentElement.scrollHeight
    if (s.x < 0) s.x = 0
    if (s.x + catW > window.innerWidth) s.x = window.innerWidth - catW
    if (s.y < 0) s.y = 0
    if (s.y + catH > pageH) s.y = pageH - catH

    // Card detection
    const scrollY = window.scrollY
    s.onCard = getCardElevation(s.x, s.y - scrollY, catW, catH) > 0

    // Edge scrolling - only when cat is actively moving
    const isMoving = Math.abs(s.vx) > 0.1 || Math.abs(s.vy) > 0.1
    if (isMoving) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // Near top edge and can scroll up
      if (s.y < SCROLL_EDGE_THRESHOLD && scrollTop > 0) {
        window.scrollBy(0, -SCROLL_SPEED)
      }

      // Near bottom edge and can scroll down
      if (s.y > clientHeight - catH - SCROLL_EDGE_THRESHOLD && scrollTop + clientHeight < scrollHeight) {
        window.scrollBy(0, SCROLL_SPEED)
      }
    }

    // Frame tick
    s.frameTimer += dt
    const anim = anims[s.anim]
    if (anim && s.frameTimer >= anim.speed) {
      s.frameTimer = 0
      s.frame = (s.frame + 1) % anim.frames
    }

    setCatStyle({
      x: Math.round(s.x),
      y: Math.round(s.y),
      anim: s.anim,
      frame: s.frame,
      facingRight: s.facingRight,
      onCard: s.onCard,
    })

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['a','d','w','s','arrowleft','arrowright','arrowup','arrowdown'].includes(key)) {
        keysRef.current.add(key)
        // Wake from sleep on any movement key
        const s = stateRef.current
        if (s.anim === 'sleep') {
          s.anim = 'idle'
          s.idleTimer = 0
          s.frame = 0
          s.frameTimer = 0
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, input, textarea, select, [role="button"]')) return
      handleAttack(e.clientX)
    }

    // Joystick touch handling
    const JOYSTICK_ZONE = 160
    const JOY_RADIUS = 60

    const handleTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        const { clientX: tx, clientY: ty } = touch
        if (tx < JOYSTICK_ZONE && ty > window.innerHeight - JOYSTICK_ZONE && !joystickRef.current.active) {
          e.preventDefault()
          const joy = joystickRef.current
          const center = joystickCenterRef.current
          joy.active = true
          joy.touchId = touch.identifier
          joy.dx = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, tx - center.x))
          joy.dy = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, ty - center.y))
          setJoystick({ dx: joy.dx, dy: joy.dy })
          // Wake from sleep
          const s = stateRef.current
          if (s.anim === 'sleep') {
            s.anim = 'idle'
            s.idleTimer = 0
          }
        } else {
          const el = document.elementFromPoint(tx, ty)
          if (!el || !el.closest('a, button, input, textarea, select, [role="button"]')) {
            handleAttack(tx)
          }
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const joy = joystickRef.current
      if (!joy.active) return
      e.preventDefault()
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier !== joy.touchId) continue
        const center = joystickCenterRef.current
        joy.dx = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, touch.clientX - center.x))
        joy.dy = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, touch.clientY - center.y))
        setJoystick({ dx: joy.dx, dy: joy.dy })
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const joy = joystickRef.current
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === joy.touchId) {
          joy.active = false
          joy.dx = 0
          joy.dy = 0
          joy.touchId = -1
          setJoystick({ dx: 0, dy: 0 })
        }
      }
    }

    const mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsMobile(mobile)
    joystickCenterRef.current = { x: 80, y: window.innerHeight - 80 }

    const handleResize = () => {
      joystickCenterRef.current = { x: 80, y: window.innerHeight - 80 }
    }

    // Auto-scroll to follow cat when it goes off-screen
    const scrollFollow = () => {
      const s = stateRef.current
      const catH = FRAME_SIZE * SCALE
      const scrollY = window.scrollY
      const viewH = window.innerHeight
      const catScreenY = s.y - scrollY

      if (catScreenY < 80) {
        window.scrollBy({ top: catScreenY - 80, behavior: 'auto' })
      } else if (catScreenY + catH > viewH - 80) {
        window.scrollBy({ top: (catScreenY + catH) - (viewH - 80), behavior: 'auto' })
      }
    }
    const scrollInterval = setInterval(scrollFollow, 100)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('resize', handleResize)

    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafRef.current)
      clearInterval(scrollInterval)
    }
  }, [gameLoop, handleAttack])

  const anim = anims[catStyle.anim]
  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE
  const spriteY = catStyle.facingRight ? anim.y : anim.yLeft

  return (
    <>
      {/* Cat shadow */}
      <div
        style={{
          position: 'absolute',
          left: catStyle.x + scaledW * 0.15,
          top: catStyle.y + scaledH - 6,
          width: scaledW * 0.7,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(61, 44, 30, 0.12)',
          filter: 'blur(2px)',
          zIndex: 9998,
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
          opacity: catStyle.anim === 'sleep' ? 0.06 : 0.12,
        }}
      />

      {/* Cat sprite */}
      <div
        style={{
          position: 'absolute',
          left: catStyle.x,
          top: catStyle.y,
          width: scaledW,
          height: scaledH,
          zIndex: 9999,
          backgroundImage: `url(${ATLAS_SRC})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${ATLAS_W * SCALE}px ${ATLAS_H * SCALE}px`,
          backgroundPositionX: -(catStyle.frame * scaledW),
          backgroundPositionY: -(spriteY * SCALE),
          imageRendering: 'pixelated',
          pointerEvents: 'none',
          // Subtle lift when on a card
          filter: catStyle.onCard ? 'drop-shadow(0 4px 6px rgba(61,44,30,0.15))' : 'none',
          transition: 'filter 0.2s ease',
        }}
      />

      {/* Mobile joystick */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            left: joystickCenterRef.current.x - 50,
            top: joystickCenterRef.current.y - 50,
            width: 100,
            height: 100,
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(61,44,30,0.08)',
              border: '2px solid rgba(61,44,30,0.15)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 50 + joystick.dx - 20,
              top: 50 + joystick.dy - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: joystick.dx || joystick.dy ? 'rgba(61,44,30,0.3)' : 'rgba(61,44,30,0.12)',
              transition: (!joystick.dx && !joystick.dy) ? 'left 0.15s ease-out, top 0.15s ease-out' : 'none',
            }}
          />
        </div>
      )}

      {/* Hint */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          fontFamily: '"Kyiv Type", "Crimson Pro", serif',
          fontSize: 13,
          color: '#8B6F47',
          opacity: 0.5,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        WASD to move · Click to attack
      </div>
    </>
  )
}
