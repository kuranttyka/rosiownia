import { useEffect, useRef } from 'react'

interface Point { x: number; y: number }

export default function YumaCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<Point>({ x: -100, y: -100 })
  const catRef = useRef<Point>({ x: 200, y: 400 })
  const velRef = useRef<Point>({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const stateRef = useRef<'idle' | 'walk' | 'run'>('idle')
  const facingRef = useRef<1 | -1>(1) // 1 = right, -1 = left
  const blinkRef = useRef(0)
  const tailRef = useRef(0)
  const idleTimerRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouse)

    // Randomize starting position
    catRef.current = { x: Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2, y: window.innerHeight * 0.75 }

    let raf: number
    const loop = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const cat = catRef.current
      const mouse = mouseRef.current
      const dx = mouse.x - cat.x
      const dy = mouse.y - cat.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Movement: loosely follow cursor with some lag
      const speed = dist > 300 ? 2.5 : dist > 120 ? 1.2 : 0
      if (speed > 0) {
        velRef.current.x += (dx / dist) * speed * 0.08
        velRef.current.y += (dy / dist) * speed * 0.08
        stateRef.current = dist > 300 ? 'run' : 'walk'
        idleTimerRef.current = 0
      } else {
        idleTimerRef.current++
        if (idleTimerRef.current > 60) stateRef.current = 'idle'
      }

      // Friction
      velRef.current.x *= 0.92
      velRef.current.y *= 0.92
      cat.x += velRef.current.x
      cat.y += velRef.current.y

      // Keep on screen
      cat.x = Math.max(30, Math.min(width - 30, cat.x))
      cat.y = Math.max(30, Math.min(height - 30, cat.y))

      // Facing direction
      if (Math.abs(velRef.current.x) > 0.3) {
        facingRef.current = velRef.current.x > 0 ? 1 : -1
      }

      // Animation frame counter
      frameRef.current++
      tailRef.current += 0.06
      if (frameRef.current % 120 === 0) blinkRef.current = 8

      if (blinkRef.current > 0) blinkRef.current--

      drawCat(ctx, cat.x, cat.y, facingRef.current, stateRef.current, frameRef.current, blinkRef.current > 0, tailRef.current)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  )
}

function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  facing: 1 | -1,
  state: string,
  frame: number,
  blink: boolean,
  tailPhase: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(facing, 1)

  const bob = state === 'walk' ? Math.sin(frame * 0.15) * 2 : state === 'run' ? Math.sin(frame * 0.25) * 3 : Math.sin(frame * 0.03) * 0.5
  const legPhase = state !== 'idle' ? frame * 0.15 : 0

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(0, 18, 22, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Tail
  ctx.strokeStyle = '#f5f0e8'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  const tailWag = Math.sin(tailPhase) * 15
  ctx.moveTo(-14, -2 + bob)
  ctx.quadraticCurveTo(-28, -20 + bob + tailWag, -22, -35 + bob + tailWag * 0.5)
  ctx.stroke()

  // Legs
  ctx.fillStyle = '#f5f0e8'
  const legOff1 = Math.sin(legPhase) * 4
  const legOff2 = Math.sin(legPhase + Math.PI) * 4
  // back legs
  ctx.fillRect(-10, 8 + bob + legOff1, 5, 10)
  ctx.fillRect(4, 8 + bob + legOff2, 5, 10)
  // front legs
  ctx.fillRect(-6, 8 + bob + legOff2, 5, 10)
  ctx.fillRect(8, 8 + bob + legOff1, 5, 10)

  // Paws (tiny pink dots)
  ctx.fillStyle = '#f0abab'
  for (const lx of [-8, 6, -4, 10]) {
    const lo = (lx < 0 ? legOff1 : legOff2)
    ctx.beginPath()
    ctx.arc(lx + 2, 18 + bob + ((lx === -8 || lx === 10) ? legOff1 : legOff2), 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Body
  ctx.fillStyle = '#f5f0e8'
  ctx.beginPath()
  ctx.ellipse(0, 2 + bob, 18, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  // Fluffy chest tuft
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(6, 4 + bob, 7, 9, 0.2, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = '#f5f0e8'
  ctx.beginPath()
  ctx.ellipse(12, -10 + bob, 12, 11, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ears
  ctx.fillStyle = '#f5f0e8'
  ctx.beginPath()
  ctx.moveTo(5, -18 + bob)
  ctx.lineTo(2, -28 + bob)
  ctx.lineTo(11, -20 + bob)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(17, -18 + bob)
  ctx.lineTo(21, -28 + bob)
  ctx.lineTo(13, -20 + bob)
  ctx.fill()

  // Inner ears (pink)
  ctx.fillStyle = '#f0abab'
  ctx.beginPath()
  ctx.moveTo(6, -18 + bob)
  ctx.lineTo(4, -25 + bob)
  ctx.lineTo(10, -19 + bob)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(16, -18 + bob)
  ctx.lineTo(19, -25 + bob)
  ctx.lineTo(13, -19 + bob)
  ctx.fill()

  // Eyes
  if (blink) {
    ctx.strokeStyle = '#2a2a35'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(7, -10 + bob)
    ctx.lineTo(11, -9 + bob)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(15, -10 + bob)
    ctx.lineTo(19, -9 + bob)
    ctx.stroke()
  } else {
    ctx.fillStyle = '#2a2a35'
    ctx.beginPath()
    ctx.ellipse(9, -10 + bob, 2, 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(17, -10 + bob, 2, 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
    // Eye shine
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(10, -11 + bob, 0.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(18, -11 + bob, 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Nose
  ctx.fillStyle = '#f0abab'
  ctx.beginPath()
  ctx.moveTo(12, -6 + bob)
  ctx.lineTo(11, -5 + bob)
  ctx.lineTo(13, -5 + bob)
  ctx.closePath()
  ctx.fill()

  // Mouth
  ctx.strokeStyle = '#d4a0a0'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(12, -5 + bob)
  ctx.lineTo(10, -3 + bob)
  ctx.moveTo(12, -5 + bob)
  ctx.lineTo(14, -3 + bob)
  ctx.stroke()

  // Whiskers
  ctx.strokeStyle = 'rgba(200,200,200,0.5)'
  ctx.lineWidth = 0.5
  for (const [sx, sy, ex, ey] of [
    [3, -7, -8, -9],
    [3, -5, -9, -5],
    [3, -3, -8, -1],
    [21, -7, 32, -9],
    [21, -5, 33, -5],
    [21, -3, 32, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(sx, sy + bob)
    ctx.lineTo(ex, ey + bob)
    ctx.stroke()
  }

  ctx.restore()
}
