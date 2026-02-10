import { useState, useEffect, useRef } from 'react'

interface SpriteAnimation {
  src: string
  frames: number
  frameWidth: number
  frameHeight: number
  speed: number // ms per frame
}

const SCALE = 3
const FRAME_SIZE = 32

const animations: Record<string, SpriteAnimation> = {
  idle: {
    src: '/sprites/cat/Idle.png',
    frames: 10,
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    speed: 150,
  },
  idle2: {
    src: '/sprites/cat/Idle2.png',
    frames: 10,
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    speed: 150,
  },
  sleep: {
    src: '/sprites/cat/Sleep.png',
    frames: 4,
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    speed: 400,
  },
  sleepy: {
    src: '/sprites/cat/Sleepy.png',
    frames: 8,
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    speed: 250,
  },
  dance: {
    src: '/sprites/cat/Dance.png',
    frames: 4,
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    speed: 200,
  },
}

export default function CatSprite() {
  const [currentAnim, setCurrentAnim] = useState<string>('idle')
  const [frame, setFrame] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // Cycle through animations
  useEffect(() => {
    const sequence = ['idle', 'idle', 'idle2', 'idle', 'sleepy', 'idle', 'dance', 'idle']
    let seqIdx = 0

    const cycleAnim = () => {
      seqIdx = (seqIdx + 1) % sequence.length
      setCurrentAnim(sequence[seqIdx])
      setFrame(0)
    }

    const interval = setInterval(cycleAnim, 4000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [])

  // Animate frames
  useEffect(() => {
    const anim = animations[currentAnim]
    if (!anim) return

    setFrame(0)
    timerRef.current = setInterval(() => {
      setFrame((f) => (f + 1) % anim.frames)
    }, anim.speed)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentAnim])

  const anim = animations[currentAnim]
  if (!anim) return null

  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE

  return (
    <div
      className="pixel-art"
      style={{
        width: scaledW,
        height: scaledH,
        backgroundImage: `url(${anim.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${anim.frames * scaledW}px ${scaledH}px`,
        backgroundPositionX: -(frame * scaledW),
        backgroundPositionY: 0,
        imageRendering: 'pixelated',
      }}
      title="Yuma the cat 🐱"
    />
  )
}
