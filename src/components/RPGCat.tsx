import { useEffect, useRef, useState, useCallback } from 'react'

const FRAME_SIZE = 32
const SCALE = 3
const MOVE_SPEED = 3
const ATTACK_DURATION = 4 * 100

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
function playPopSound() {
  if (!audioCtx) audioCtx = new AudioContext()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, audioCtx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.1)
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12)
  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + 0.12)
}

export default function RPGCat() {
  const keysRef = useRef<Set<string>>(new Set())
  const stateRef = useRef({
    x: 0,
    y: 0,
    facingRight: true,
    anim: 'idle' as string,
    frame: 0,
    frameTimer: 0,
    idleTimer: 0,
    attackTimer: 0,
    initialized: false,
  })
  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, touchId: -1 })
  const joystickCenterRef = useRef({ x: 80, y: 0 })

  const [catStyle, setCatStyle] = useState({ x: 0, y: 0, anim: 'idle', frame: 0, facingRight: true })
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
    playPopSound()
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
      if (s.attackTimer <= 0) s.attackTimer = 0
    }

    // Movement (only when not attacking)
    if (s.attackTimer <= 0) {
      const joy = joystickRef.current
      const left = keys.has('a') || keys.has('arrowleft') || (joy.active && joy.dx < -20)
      const right = keys.has('d') || keys.has('arrowright') || (joy.active && joy.dx > 20)
      const up = keys.has('w') || keys.has('arrowup') || (joy.active && joy.dy < -20)
      const down = keys.has('s') || keys.has('arrowdown') || (joy.active && joy.dy > 20)

      let dx = 0, dy = 0
      if (left) { dx -= MOVE_SPEED; s.facingRight = false }
      if (right) { dx += MOVE_SPEED; s.facingRight = true }
      if (up) dy -= MOVE_SPEED
      if (down) dy += MOVE_SPEED

      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        const norm = Math.sqrt(dx * dx + dy * dy)
        dx = (dx / norm) * MOVE_SPEED
        dy = (dy / norm) * MOVE_SPEED
      }

      s.x += dx
      s.y += dy

      // Bounds
      if (s.x < 0) s.x = 0
      if (s.x + catW > window.innerWidth) s.x = window.innerWidth - catW
      if (s.y < 0) s.y = 0
      if (s.y + catH > window.innerHeight) s.y = window.innerHeight - catH

      // Animation
      const moving = dx !== 0 || dy !== 0
      let newAnim = s.anim
      if (moving) {
        newAnim = 'walk'
        s.idleTimer = 0
      } else if (s.anim === 'sleep') {
        // Stay asleep — only wake on user input (movement/click)
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
    })

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['a','d','w','s','arrowleft','arrowright','arrowup','arrowdown'].includes(key)) {
        keysRef.current.add(key)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, input, textarea, select, [role="button"]')) return
      handleAttack(e.clientX)
    }

    // Joystick area: bottom-left 160x160
    const JOYSTICK_ZONE = 160
    const JOY_RADIUS = 60

    const handleTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        const { clientX: tx, clientY: ty } = touch
        const center = joystickCenterRef.current
        const distToCenter = Math.sqrt((tx - center.x) ** 2 + (ty - center.y) ** 2)

        if (tx < JOYSTICK_ZONE && ty > window.innerHeight - JOYSTICK_ZONE && !joystickRef.current.active) {
          // Activate joystick — prevent scroll
          e.preventDefault()
          const joy = joystickRef.current
          joy.active = true
          joy.touchId = touch.identifier
          joy.dx = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, tx - center.x))
          joy.dy = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, ty - center.y))
          setJoystick({ dx: joy.dx, dy: joy.dy })
        } else if (distToCenter <= 120 && !joystickRef.current.active) {
          // Enlarged hitbox around joystick center
          const joy = joystickRef.current
          joy.active = true
          joy.touchId = touch.identifier
          joy.dx = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, tx - center.x))
          joy.dy = Math.max(-JOY_RADIUS, Math.min(JOY_RADIUS, ty - center.y))
          setJoystick({ dx: joy.dx, dy: joy.dy })
        } else {
          // Attack if not on interactive element
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
    }
  }, [gameLoop, handleAttack])

  const anim = anims[catStyle.anim]
  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE
  const spriteY = catStyle.facingRight ? anim.y : anim.yLeft

  return (
    <>
      {/* Cat sprite — fixed overlay */}
      <div
        style={{
          position: 'fixed',
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
          {/* Base */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(61,44,30,0.08)',
              border: '2px solid rgba(61,44,30,0.15)',
            }}
          />
          {/* Thumb */}
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
          fontFamily: '"Crimson Pro", serif',
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
