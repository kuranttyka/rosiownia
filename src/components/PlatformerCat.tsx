import { useEffect, useRef, useState, useCallback } from 'react'

const FRAME_SIZE = 32
const SCALE = 3
const GRAVITY = 0.6
const JUMP_FORCE = -12
const MOVE_SPEED = 3.5
const RUN_SPEED = 5.5
const ATTACK_DURATION = 4 * 100 // 4 frames at 100ms

interface SpriteAnim {
  src: string
  srcLeft: string
  frames: number
  speed: number
}

const anims: Record<string, SpriteAnim> = {
  idle:    { src: '/sprites/catplayer/Cat_idle_1.png',      srcLeft: '/sprites/catplayer/Cat_idle_1_left.png',      frames: 3, speed: 200 },
  walk:    { src: '/sprites/catplayer/Cat_walk_1.png',      srcLeft: '/sprites/catplayer/Cat_walk_1_left.png',      frames: 3, speed: 150 },
  run:     { src: '/sprites/catplayer/Cat_run_1.png',       srcLeft: '/sprites/catplayer/Cat_run_1_left.png',       frames: 4, speed: 120 },
  jump:    { src: '/sprites/catplayer/Cat_jump_1.png',      srcLeft: '/sprites/catplayer/Cat_jump_1_left.png',      frames: 1, speed: 200 },
  fall:    { src: '/sprites/catplayer/Cat_fall_1.png',      srcLeft: '/sprites/catplayer/Cat_fall_1_left.png',      frames: 1, speed: 200 },
  land:    { src: '/sprites/catplayer/Cat_landding_1.png',  srcLeft: '/sprites/catplayer/Cat_landding_1_left.png',  frames: 4, speed: 80 },
  sleep:   { src: '/sprites/catplayer/Cat_asleep_1.png',    srcLeft: '/sprites/catplayer/Cat_asleep_1_left.png',    frames: 5, speed: 300 },
  attack:  { src: '/sprites/catplayer/Cat_attack_1.png',    srcLeft: '/sprites/catplayer/Cat_attack_1_left.png',    frames: 4, speed: 100 },
  duck:    { src: '/sprites/catplayer/Cat_ducking_idle_1.png', srcLeft: '/sprites/catplayer/Cat_ducking_idle_1_left.png', frames: 2, speed: 200 },
  spin:    { src: '/sprites/catplayer/Cat_spining_1.png',   srcLeft: '/sprites/catplayer/Cat_spining_1_left.png',   frames: 9, speed: 80 },
  cheer:   { src: '/sprites/catplayer/Cat_win_cheer_1.png', srcLeft: '/sprites/catplayer/Cat_win_cheer_1_left.png', frames: 3, speed: 150 },
}

interface Platform {
  x: number
  y: number
  w: number
  h: number
  el?: HTMLElement
}

// Preload all sprite images to avoid flicker on first animation change
const preloadedImages: Record<string, HTMLImageElement> = {}
if (typeof window !== 'undefined') {
  Object.values(anims).forEach(a => {
    for (const src of [a.src, a.srcLeft]) {
      if (!preloadedImages[src]) {
        const img = new Image()
        img.src = src
        preloadedImages[src] = img
      }
    }
  })
}

export default function PlatformerCat() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const stateRef = useRef({
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    grounded: false,
    facingRight: true,
    anim: 'idle' as string,
    frame: 0,
    frameTimer: 0,
    landTimer: 0,
    idleTimer: 0,
    attackTimer: 0,
  })
  const platformsRef = useRef<Platform[]>([])
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  // Mobile joystick state
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, startX: 0, startY: 0 })

  const [catStyle, setCatStyle] = useState({
    x: 100, y: 100, anim: 'idle', frame: 0, facingRight: true,
  })
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null)

  // Attack handler
  const handleAttack = useCallback((clickX: number) => {
    const s = stateRef.current
    const catCenterX = s.x + (FRAME_SIZE * SCALE) / 2
    s.facingRight = clickX > catCenterX
    s.attackTimer = ATTACK_DURATION
    s.anim = 'attack'
    s.frame = 0
    s.frameTimer = 0
  }, [])

  // Collect platforms from DOM elements with data-platform
  const collectPlatforms = useCallback(() => {
    const container = canvasRef.current
    if (!container) return
    const elements = container.querySelectorAll('[data-platform]')
    const platforms: Platform[] = []

    const containerRect = container.getBoundingClientRect()
    platforms.push({
      x: 0,
      y: containerRect.height - 4,
      w: containerRect.width,
      h: 20,
    })

    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()
      platforms.push({
        x: rect.left - cRect.left,
        y: rect.top - cRect.top,
        w: rect.width,
        h: rect.height,
        el: el as HTMLElement,
      })
    })

    platformsRef.current = platforms
  }, [])

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const dt = Math.min(timestamp - lastTimeRef.current, 33)
    lastTimeRef.current = timestamp

    const s = stateRef.current
    const keys = keysRef.current
    const platforms = platformsRef.current
    const container = canvasRef.current
    if (!container) { rafRef.current = requestAnimationFrame(gameLoop); return }

    const containerW = container.clientWidth
    const containerH = container.clientHeight
    const catW = FRAME_SIZE * SCALE
    const catH = FRAME_SIZE * SCALE

    // Attack timer
    if (s.attackTimer > 0) {
      s.attackTimer -= dt
      if (s.attackTimer <= 0) s.attackTimer = 0
    }

    // Input (keyboard + joystick)
    const joy = joystickRef.current
    const left = keys.has('a') || keys.has('arrowleft') || (joy.active && joy.dx < -20)
    const right = keys.has('d') || keys.has('arrowright') || (joy.active && joy.dx > 20)
    const jump = keys.has(' ') || keys.has('w') || keys.has('arrowup') || (joy.active && joy.dy < -30)
    const running = keys.has('shift') || (joy.active && Math.abs(joy.dx) > 50)
    const down = keys.has('s') || keys.has('arrowdown') || (joy.active && joy.dy > 30)

    // Don't move during attack
    if (s.attackTimer <= 0) {
      const speed = running ? RUN_SPEED : MOVE_SPEED
      if (left) {
        s.vx = -speed
        s.facingRight = false
      } else if (right) {
        s.vx = speed
        s.facingRight = true
      } else {
        s.vx *= 0.7
        if (Math.abs(s.vx) < 0.3) s.vx = 0
      }
    }

    // Jump
    if (jump && s.grounded && s.attackTimer <= 0) {
      s.vy = JUMP_FORCE
      s.grounded = false
    }

    // Gravity
    s.vy += GRAVITY
    if (s.vy > 15) s.vy = 15

    // Move
    s.x += s.vx
    s.y += s.vy

    // Collision
    s.grounded = false
    for (const p of platforms) {
      const catBottom = s.y + catH
      const catRight = s.x + catW
      const catLeft = s.x

      if (
        catRight > p.x + 4 &&
        catLeft < p.x + p.w - 4 &&
        catBottom > p.y &&
        catBottom < p.y + p.h + s.vy + 2 &&
        s.vy >= 0
      ) {
        s.y = p.y - catH
        s.vy = 0
        s.grounded = true
        if (s.landTimer === 0 && s.anim === 'fall') {
          s.landTimer = 4 * 80
        }
        break
      }
    }

    // Bounds
    if (s.x < 0) s.x = 0
    if (s.x + catW > containerW) s.x = containerW - catW
    if (s.y + catH > containerH) {
      s.y = containerH - catH
      s.vy = 0
      s.grounded = true
    }

    // Animation state
    if (s.attackTimer <= 0) {
      const moving = Math.abs(s.vx) > 0.5
      let newAnim = s.anim

      if (!s.grounded) {
        newAnim = s.vy < 0 ? 'jump' : 'fall'
        s.landTimer = 0
        s.idleTimer = 0
      } else if (s.landTimer > 0) {
        newAnim = 'land'
        s.landTimer -= dt
        if (s.landTimer <= 0) s.landTimer = 0
      } else if (down) {
        newAnim = 'duck'
        s.idleTimer = 0
      } else if (moving) {
        newAnim = running ? 'run' : 'walk'
        s.idleTimer = 0
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

    // Frame animation
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

  // Setup keyboard + mouse + touch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['a','d','w','s',' ','shift','arrowleft','arrowright','arrowup','arrowdown'].includes(key)) {
        e.preventDefault()
        keysRef.current.add(key)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    // Mouse click → attack
    const handleMouseDown = (e: MouseEvent) => {
      // Don't attack when clicking links
      if ((e.target as HTMLElement).closest('a')) return
      handleAttack(e.clientX)
    }

    // Touch: left half = joystick zone, tap right half = attack
    const handleTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        const x = touch.clientX
        const w = window.innerWidth

        if (x < w * 0.4) {
          // Joystick zone — left 40%
          const joy = joystickRef.current
          joy.active = true
          joy.startX = touch.clientX
          joy.startY = touch.clientY
          joy.dx = 0
          joy.dy = 0
          setJoystickPos({ x: touch.clientX, y: touch.clientY, dx: 0, dy: 0 })
        } else {
          // Right side tap = attack
          handleAttack(touch.clientX)
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const joy = joystickRef.current
      if (!joy.active) return
      for (const touch of Array.from(e.changedTouches)) {
        joy.dx = Math.max(-60, Math.min(60, touch.clientX - joy.startX))
        joy.dy = Math.max(-60, Math.min(60, touch.clientY - joy.startY))
        setJoystickPos(prev => prev ? { ...prev, dx: joy.dx, dy: joy.dy } : null)
      }
    }

    const handleTouchEnd = () => {
      const joy = joystickRef.current
      joy.active = false
      joy.dx = 0
      joy.dy = 0
      setJoystickPos(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    collectPlatforms()
    window.addEventListener('resize', collectPlatforms)

    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', collectPlatforms)
      cancelAnimationFrame(rafRef.current)
    }
  }, [gameLoop, collectPlatforms, handleAttack])

  // Re-collect platforms on DOM changes
  useEffect(() => {
    const observer = new MutationObserver(collectPlatforms)
    if (canvasRef.current) {
      observer.observe(canvasRef.current, { childList: true, subtree: true })
    }
    return () => observer.disconnect()
  }, [collectPlatforms])

  const anim = anims[catStyle.anim]
  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE
  const spriteSrc = catStyle.facingRight ? anim.src : anim.srcLeft

  return (
    <div ref={canvasRef} className="relative w-full select-none" style={{ minHeight: '100vh', touchAction: 'none' }}>
      {/* Page content — data-platform = collidable */}
      <div className="relative z-0">
        <h1
          data-platform
          className="inline-block px-6 py-3 text-4xl font-bold"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#3d2c1e',
            color: '#faf3e8',
            borderRadius: 4,
          }}
        >
          Rouzeris
        </h1>

        <p
          data-platform
          className="inline-block px-4 py-2 text-sm"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#8B6F47',
            color: '#faf3e8',
            borderRadius: 4,
          }}
        >
          artist · jewelry maker · developer
        </p>

        <a
          href="https://instagram.com/roksolanas_7"
          target="_blank"
          rel="noopener"
          data-platform
          className="inline-block px-5 py-3 text-sm hover:brightness-110"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            position: 'absolute',
            top: '45%',
            left: '15%',
            background: '#E1306C',
            color: '#fff',
            borderRadius: 4,
            textDecoration: 'none',
          }}
        >
          📸 Instagram
        </a>

        <a
          href="https://instagram.com/jumabestia"
          target="_blank"
          rel="noopener"
          data-platform
          className="inline-block px-5 py-3 text-sm hover:brightness-110"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            position: 'absolute',
            top: '45%',
            right: '15%',
            background: '#8B6F47',
            color: '#faf3e8',
            borderRadius: 4,
            textDecoration: 'none',
          }}
        >
          🐱 Yuma
        </a>

        <div
          data-platform
          className="px-5 py-3 text-sm"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            position: 'absolute',
            top: '60%',
            left: '30%',
            background: '#6B8E6B',
            color: '#faf3e8',
            borderRadius: 4,
          }}
        >
          🎨 Art
        </div>

        <div
          data-platform
          className="px-5 py-3 text-sm"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            position: 'absolute',
            top: '60%',
            right: '30%',
            background: '#6B7B8E',
            color: '#faf3e8',
            borderRadius: 4,
          }}
        >
          💎 Jewelry
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#3d2c1e',
          }}
        />
      </div>

      {/* Cat sprite */}
      <div
        ref={catRef}
        className="absolute z-10 pixel-art"
        style={{
          left: catStyle.x,
          top: catStyle.y,
          width: scaledW,
          height: scaledH,
          backgroundImage: `url(${spriteSrc})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${anim.frames * scaledW}px ${scaledH}px`,
          backgroundPositionX: -(catStyle.frame * scaledW),
          backgroundPositionY: 0,
          imageRendering: 'pixelated',
          pointerEvents: 'none',
        }}
      />

      {/* Mobile virtual joystick */}
      {joystickPos && (
        <>
          {/* Base circle */}
          <div
            className="fixed z-30 rounded-full border-2 border-white/30"
            style={{
              left: joystickPos.x - 50,
              top: joystickPos.y - 50,
              width: 100,
              height: 100,
              background: 'rgba(0,0,0,0.1)',
              pointerEvents: 'none',
            }}
          />
          {/* Thumb */}
          <div
            className="fixed z-30 rounded-full"
            style={{
              left: joystickPos.x + joystickPos.dx - 20,
              top: joystickPos.y + joystickPos.dy - 20,
              width: 40,
              height: 40,
              background: 'rgba(0,0,0,0.3)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Controls hint (hidden on mobile) */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 text-xs opacity-50 hidden md:block"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          color: '#3d2c1e',
        }}
      >
        WASD / Arrows · Space = Jump · Shift = Run · Click = Attack
      </div>

      {/* Mobile hint */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 text-xs opacity-50 md:hidden"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          color: '#3d2c1e',
        }}
      >
        Left = Joystick · Right = Attack
      </div>
    </div>
  )
}
