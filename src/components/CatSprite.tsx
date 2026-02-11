import { useState, useEffect, useRef, useCallback } from 'react'
import { useMachine } from '@xstate/react'
import { catMachine } from './catMachine'

const SCALE = 3
const FRAME_SIZE = 32

interface SpriteAnim {
  src: string
  frames: number
  speed: number
}

const anims: Record<string, SpriteAnim> = {
  Idle:        { src: '/sprites/cat/Idle.png',        frames: 13, speed: 150 },
  Sitting:     { src: '/sprites/cat/Sitting.png',     frames: 6,  speed: 200 },
  Waiting:     { src: '/sprites/cat/Waiting.png',     frames: 12, speed: 150 },
  Sleepy:      { src: '/sprites/cat/Sleepy.png',      frames: 9,  speed: 250 },
  WalkRight:   { src: '/sprites/cat/WalkRight.png',   frames: 10, speed: 100 },
  WalkLeft:    { src: '/sprites/cat/WalkLeft.png',    frames: 10, speed: 100 },
  Sleep:       { src: '/sprites/cat/Sleep.png',        frames: 4,  speed: 400 },
  LayDown:     { src: '/sprites/cat/LayDown.png',      frames: 8,  speed: 200 },
  Dance:       { src: '/sprites/cat/Dance.png',        frames: 12, speed: 150 },
  Excited:     { src: '/sprites/cat/Excited.png',      frames: 12, speed: 120 },
  Scratching:  { src: '/sprites/cat/Scratching.png',   frames: 12, speed: 120 },
  EatingFull:  { src: '/sprites/cat/EatingFull.png',   frames: 15, speed: 150 },
  Surprised:   { src: '/sprites/cat/Surprised.png',    frames: 4,  speed: 200 },
  Cry:         { src: '/sprites/cat/Cry.png',          frames: 4,  speed: 250 },
  Box1:        { src: '/sprites/cat/Box1.png',         frames: 4,  speed: 300 },
  Box2:        { src: '/sprites/cat/Box2.png',         frames: 12, speed: 200 },
  Sad:         { src: '/sprites/cat/Sad.png',          frames: 9,  speed: 200 },
}

export default function CatSprite() {
  const [state, send] = useMachine(catMachine)
  const { x, y, targetX, targetY, animKey } = state.context
  const [pos, setPos] = useState({ x, y })
  const [frame, setFrame] = useState(0)
  const moveRef = useRef<ReturnType<typeof setInterval>>()

  // Walking movement
  const isWalking = state.matches('walking')
  useEffect(() => {
    if (moveRef.current) clearInterval(moveRef.current)

    if (isWalking) {
      const speed = 0.35
      moveRef.current = setInterval(() => {
        setPos(prev => {
          const dx = targetX - prev.x
          const dy = targetY - prev.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 1.5) {
            clearInterval(moveRef.current!)
            const finalPos = { x: targetX, y: targetY }
            send({ type: 'ARRIVED', ...finalPos })
            return finalPos
          }
          return {
            x: prev.x + (dx / dist) * speed,
            y: prev.y + (dy / dist) * speed,
          }
        })
      }, 30)
    }

    return () => { if (moveRef.current) clearInterval(moveRef.current) }
  }, [isWalking, targetX, targetY, send])

  // Override animKey for walking based on actual position
  const effectiveAnimKey = animKey

  // Frame animation
  useEffect(() => {
    const anim = anims[effectiveAnimKey]
    if (!anim) return
    setFrame(0)
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % anim.frames)
    }, anim.speed)
    return () => clearInterval(interval)
  }, [effectiveAnimKey])

  const handleClick = useCallback(() => {
    send({ type: 'CLICK' })
  }, [send])

  const anim = anims[effectiveAnimKey]
  if (!anim) return null

  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE

  return (
    <div
      className="absolute pixel-art cursor-pointer"
      onClick={handleClick}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -50%)${isWalking ? ` translateY(${Math.sin(frame * 0.8) * 3}px)` : ''}`,
        width: scaledW,
        height: scaledH,
        backgroundImage: `url(${anim.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${anim.frames * scaledW}px ${scaledH}px`,
        backgroundPositionX: -(frame * scaledW),
        backgroundPositionY: 0,
        imageRendering: 'pixelated',
        zIndex: 10,
      }}
      title="Click me! 🐱"
    />
  )
}
