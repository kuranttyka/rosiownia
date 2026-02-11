import { useEffect, useRef, useState, useCallback } from 'react'

const FRAME_SIZE = 32
const SCALE = 3
const GRAVITY = 0.6
const JUMP_FORCE = -12
const MOVE_SPEED = 3.5
const RUN_SPEED = 5.5

interface SpriteAnim {
  src: string
  srcLeft: string
  frames: number
  speed: number // ms per frame
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
  })
  const platformsRef = useRef<Platform[]>([])
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const [catStyle, setCatStyle] = useState({
    x: 100, y: 100, anim: 'idle', frame: 0, facingRight: true,
  })

  // Collect platforms from DOM elements with data-platform
  const collectPlatforms = useCallback(() => {
    const container = canvasRef.current
    if (!container) return
    const elements = container.querySelectorAll('[data-platform]')
    const platforms: Platform[] = []

    // Ground
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
    const dt = Math.min(timestamp - lastTimeRef.current, 33) // cap at ~30fps delta
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

    // Input
    const left = keys.has('a') || keys.has('arrowleft')
    const right = keys.has('d') || keys.has('arrowright')
    const jump = keys.has(' ') || keys.has('w') || keys.has('arrowup')
    const running = keys.has('shift')
    const down = keys.has('s') || keys.has('arrowdown')

    // Horizontal movement
    const speed = running ? RUN_SPEED : MOVE_SPEED
    if (left) {
      s.vx = -speed
      s.facingRight = false
    } else if (right) {
      s.vx = speed
      s.facingRight = true
    } else {
      s.vx *= 0.7 // friction
      if (Math.abs(s.vx) < 0.3) s.vx = 0
    }

    // Jump
    if (jump && s.grounded) {
      s.vy = JUMP_FORCE
      s.grounded = false
    }

    // Gravity
    s.vy += GRAVITY
    if (s.vy > 15) s.vy = 15 // terminal velocity

    // Move
    s.x += s.vx
    s.y += s.vy

    // Collision with platforms
    s.grounded = false
    for (const p of platforms) {
      // Cat bottom hits platform top
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
          s.landTimer = 4 * 80 // land animation duration
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

    // Frame animation
    s.frameTimer += dt
    const anim = anims[newAnim]
    if (newAnim !== s.anim) {
      s.anim = newAnim
      s.frame = 0
      s.frameTimer = 0
    } else if (anim && s.frameTimer >= anim.speed) {
      s.frameTimer = 0
      s.frame = (s.frame + 1) % anim.frames
    }

    // Update React state (batched)
    setCatStyle({
      x: Math.round(s.x),
      y: Math.round(s.y),
      anim: s.anim,
      frame: s.frame,
      facingRight: s.facingRight,
    })

    rafRef.current = requestAnimationFrame(gameLoop)
  }, [])

  // Setup
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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    collectPlatforms()
    window.addEventListener('resize', collectPlatforms)

    // Start game loop
    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', collectPlatforms)
      cancelAnimationFrame(rafRef.current)
    }
  }, [gameLoop, collectPlatforms])

  // Re-collect platforms when content changes
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
    <div ref={canvasRef} className="relative w-full" style={{ minHeight: '100vh' }}>
      {/* Page content — elements with data-platform become collidable */}
      <div className="relative z-0">
        {/* Title */}
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
            imageRendering: 'pixelated',
          }}
        >
          Rouzeris
        </h1>

        {/* Subtitle platform */}
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

        {/* Link platforms */}
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

        {/* Ground decoration */}
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

      {/* Controls hint */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 text-xs opacity-50"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          color: '#3d2c1e',
        }}
      >
        WASD / Arrows · Space = Jump · Shift = Run
      </div>
    </div>
  )
}
