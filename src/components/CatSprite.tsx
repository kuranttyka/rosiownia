import { useState, useEffect, useRef, useCallback } from 'react'

const SCALE = 3
const FRAME_SIZE = 32

interface SpriteAnim {
  src: string
  frames: number
  speed: number
}

const anims: Record<string, SpriteAnim> = {
  idle:      { src: '/sprites/cat/Idle.png',      frames: 10, speed: 150 },
  idle2:     { src: '/sprites/cat/Idle2.png',      frames: 10, speed: 150 },
  walkRight: { src: '/sprites/cat/WalkRight.png',  frames: 10, speed: 100 },
  walkLeft:  { src: '/sprites/cat/WalkLeft.png',   frames: 10, speed: 100 },
  sleep:     { src: '/sprites/cat/Sleep.png',      frames: 4,  speed: 400 },
  sleepy:    { src: '/sprites/cat/Sleepy.png',     frames: 8,  speed: 250 },
  dance:     { src: '/sprites/cat/Dance.png',      frames: 4,  speed: 200 },
}

// Room walkable area (% of container)
const WALK_MIN_X = 15
const WALK_MAX_X = 75
const WALK_MIN_Y = 35
const WALK_MAX_Y = 70

type CatState = 'idle' | 'walking' | 'sleeping' | 'dancing'

export default function CatSprite() {
  const [pos, setPos] = useState({ x: 38, y: 55 })
  const [animKey, setAnimKey] = useState<string>('idle')
  const [frame, setFrame] = useState(0)
  const [catState, setCatState] = useState<CatState>('idle')
  const targetRef = useRef({ x: 38, y: 55 })
  const stateTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Pick next behavior
  const pickNextState = useCallback(() => {
    const roll = Math.random()
    if (roll < 0.5) {
      // Walk to random spot
      setCatState('walking')
      targetRef.current = {
        x: WALK_MIN_X + Math.random() * (WALK_MAX_X - WALK_MIN_X),
        y: WALK_MIN_Y + Math.random() * (WALK_MAX_Y - WALK_MIN_Y),
      }
    } else if (roll < 0.75) {
      // Idle
      setCatState('idle')
      const idleAnims = ['idle', 'idle2', 'sleepy']
      setAnimKey(idleAnims[Math.floor(Math.random() * idleAnims.length)])
      stateTimerRef.current = setTimeout(pickNextState, 3000 + Math.random() * 4000)
    } else if (roll < 0.9) {
      // Sleep
      setCatState('sleeping')
      setAnimKey('sleep')
      stateTimerRef.current = setTimeout(pickNextState, 6000 + Math.random() * 5000)
    } else {
      // Dance
      setCatState('dancing')
      setAnimKey('dance')
      stateTimerRef.current = setTimeout(pickNextState, 2000 + Math.random() * 2000)
    }
  }, [])

  // Initialize
  useEffect(() => {
    stateTimerRef.current = setTimeout(pickNextState, 2000)
    return () => { if (stateTimerRef.current) clearTimeout(stateTimerRef.current) }
  }, [pickNextState])

  // Walking movement
  useEffect(() => {
    if (catState !== 'walking') return

    const target = targetRef.current
    const dx = target.x - pos.x
    const dy = target.y - pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 1.5) {
      // Arrived
      setCatState('idle')
      setAnimKey('idle')
      stateTimerRef.current = setTimeout(pickNextState, 2000 + Math.random() * 3000)
      return
    }

    // Set walk animation direction
    setAnimKey(dx > 0 ? 'walkRight' : 'walkLeft')

    const speed = 0.4
    const moveTimer = setInterval(() => {
      setPos(prev => {
        const ddx = targetRef.current.x - prev.x
        const ddy = targetRef.current.y - prev.y
        const d = Math.sqrt(ddx * ddx + ddy * ddy)
        if (d < 1) {
          clearInterval(moveTimer)
          setCatState('idle')
          setAnimKey('idle')
          stateTimerRef.current = setTimeout(pickNextState, 2000 + Math.random() * 3000)
          return prev
        }
        return {
          x: prev.x + (ddx / d) * speed,
          y: prev.y + (ddy / d) * speed,
        }
      })
    }, 30)

    return () => clearInterval(moveTimer)
  }, [catState, pickNextState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Frame animation
  useEffect(() => {
    const anim = anims[animKey]
    if (!anim) return
    setFrame(0)
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % anim.frames)
    }, anim.speed)
    return () => clearInterval(interval)
  }, [animKey])

  const anim = anims[animKey]
  if (!anim) return null

  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE

  return (
    <div
      className="absolute pixel-art pointer-events-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        width: scaledW,
        height: scaledH,
        backgroundImage: `url(${anim.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${anim.frames * scaledW}px ${scaledH}px`,
        backgroundPositionX: -(frame * scaledW),
        backgroundPositionY: 0,
        imageRendering: 'pixelated',
        zIndex: 10,
        transition: 'none',
      }}
      title="Yuma 🐱"
    />
  )
}
