import { useEffect, useRef } from 'react'

interface Point { x: number; y: number }

export default function YumaCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<Point>({ x: -200, y: -200 })
  const catRef = useRef<Point>({ x: 200, y: 400 })
  const velRef = useRef<Point>({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const stateRef = useRef<'idle' | 'walk' | 'run' | 'sit'>('idle')
  const facingRef = useRef<1 | -1>(1)
  const blinkRef = useRef(0)
  const tailRef = useRef(0)
  const idleTimerRef = useRef(0)
  const purrRef = useRef(0)
  const earTwitchRef = useRef(0)
  const stretchRef = useRef(0)
  const yawnRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouse)

    catRef.current = {
      x: Math.random() * window.innerWidth * 0.5 + window.innerWidth * 0.25,
      y: window.innerHeight * 0.78
    }

    let raf: number
    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const cat = catRef.current
      const mouse = mouseRef.current
      const dx = mouse.x - cat.x
      const dy = mouse.y - cat.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const speed = dist > 300 ? 3 : dist > 140 ? 1.4 : 0
      if (speed > 0) {
        velRef.current.x += (dx / dist) * speed * 0.07
        velRef.current.y += (dy / dist) * speed * 0.07
        stateRef.current = dist > 300 ? 'run' : 'walk'
        idleTimerRef.current = 0
        stretchRef.current = 0
        yawnRef.current = 0
      } else {
        idleTimerRef.current++
        if (idleTimerRef.current > 80) stateRef.current = 'idle'
        if (idleTimerRef.current === 200) stretchRef.current = 60
        if (idleTimerRef.current === 400) yawnRef.current = 40
        if (idleTimerRef.current > 500) stateRef.current = 'sit'
      }

      velRef.current.x *= 0.91
      velRef.current.y *= 0.91
      cat.x += velRef.current.x
      cat.y += velRef.current.y

      cat.x = Math.max(40, Math.min(window.innerWidth - 40, cat.x))
      cat.y = Math.max(40, Math.min(window.innerHeight - 40, cat.y))

      if (Math.abs(velRef.current.x) > 0.3) {
        facingRef.current = velRef.current.x > 0 ? 1 : -1
      }

      frameRef.current++
      tailRef.current += stateRef.current === 'sit' ? 0.03 : 0.06
      if (frameRef.current % 90 === 0) blinkRef.current = 10
      if (frameRef.current % 200 === 0 && Math.random() > 0.6) earTwitchRef.current = 12
      purrRef.current += 0.08

      if (blinkRef.current > 0) blinkRef.current--
      if (earTwitchRef.current > 0) earTwitchRef.current--
      if (stretchRef.current > 0) stretchRef.current--
      if (yawnRef.current > 0) yawnRef.current--

      drawCat(ctx, cat.x, cat.y, facingRef.current, stateRef.current, frameRef.current,
        blinkRef.current > 0, tailRef.current, purrRef.current,
        earTwitchRef.current > 0, stretchRef.current, yawnRef.current)

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
  purrPhase: number,
  earTwitch: boolean,
  stretch: number,
  yawn: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(facing, 1)

  const isSit = state === 'sit'
  const bob = state === 'walk' ? Math.sin(frame * 0.15) * 2.5
    : state === 'run' ? Math.sin(frame * 0.25) * 3.5
    : isSit ? Math.sin(frame * 0.02) * 0.3
    : Math.sin(frame * 0.03) * 0.8
  const legPhase = state === 'walk' ? frame * 0.15 : state === 'run' ? frame * 0.22 : 0
  const purrBob = isSit ? Math.sin(purrPhase) * 0.4 : 0
  const stretchAmount = stretch > 0 ? Math.sin((60 - stretch) / 60 * Math.PI) * 8 : 0

  // Shadow — softer, larger
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath()
  ctx.ellipse(0, 20, 26 + stretchAmount * 0.5, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Tail — more fluid curve
  ctx.strokeStyle = '#f0ebe3'
  ctx.lineWidth = 4.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  const tailWag = Math.sin(tailPhase) * (isSit ? 8 : 18)
  const tailWag2 = Math.cos(tailPhase * 0.7) * 6
  ctx.moveTo(-14, -2 + bob)
  ctx.bezierCurveTo(
    -24, -15 + bob + tailWag,
    -32 + tailWag2, -28 + bob + tailWag * 0.5,
    -24, -38 + bob + tailWag * 0.3
  )
  ctx.stroke()
  // Tail tip fluff
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(-24, -38 + bob + tailWag * 0.3, 3, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  const furColor = '#f0ebe3'
  ctx.fillStyle = furColor
  if (isSit) {
    // Sitting pose — tucked legs
    ctx.beginPath()
    ctx.ellipse(-6, 14 + bob, 8, 5, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(8, 14 + bob, 8, 5, 0.2, 0, Math.PI * 2)
    ctx.fill()
    // Front paws visible
    ctx.fillStyle = '#e8a0b4'
    ctx.beginPath()
    ctx.ellipse(0, 17 + bob, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(10, 17 + bob, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const legOff1 = Math.sin(legPhase) * 5
    const legOff2 = Math.sin(legPhase + Math.PI) * 5
    // Back legs
    roundRect(ctx, -11, 8 + bob + legOff1, 6, 12, 2)
    roundRect(ctx, 3, 8 + bob + legOff2, 6, 12, 2)
    // Front legs
    roundRect(ctx, -7, 8 + bob + legOff2 - stretchAmount * 0.3, 6, 12 + stretchAmount * 0.5, 2)
    roundRect(ctx, 7, 8 + bob + legOff1 - stretchAmount * 0.3, 6, 12 + stretchAmount * 0.5, 2)
    // Paws
    ctx.fillStyle = '#e8a0b4'
    for (const [lx, off] of [[-9, legOff1], [5, legOff2], [-5, legOff2], [9, legOff1]] as const) {
      ctx.beginPath()
      ctx.ellipse(lx + 2, 20 + bob + off, 3, 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Body — slightly larger, fluffier
  ctx.fillStyle = furColor
  ctx.beginPath()
  ctx.ellipse(0 + stretchAmount * 0.3, 2 + bob + purrBob, 20 + stretchAmount * 0.4, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  // Fluffy chest
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(7, 5 + bob + purrBob, 8, 10, 0.15, 0, 0, Math.PI * 2)
  ctx.fill()

  // Maine Coon neck ruff
  ctx.fillStyle = '#faf6f0'
  ctx.beginPath()
  ctx.ellipse(10, -2 + bob, 10, 8, 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = furColor
  ctx.beginPath()
  ctx.ellipse(13, -11 + bob + purrBob, 13, 12, 0, 0, Math.PI * 2)
  ctx.fill()

  // Cheek fluffs (Maine Coon!)
  ctx.fillStyle = '#faf6f0'
  ctx.beginPath()
  ctx.ellipse(4, -5 + bob, 5, 4, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(22, -5 + bob, 5, 4, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Ears with twitch
  const earAngle = earTwitch ? Math.sin(Date.now() * 0.05) * 0.15 : 0
  ctx.fillStyle = furColor
  // Left ear
  ctx.save()
  ctx.translate(5, -20 + bob)
  ctx.rotate(-0.1 + earAngle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-4, -14)
  ctx.lineTo(7, -2)
  ctx.closePath()
  ctx.fill()
  // Ear tuft (Maine Coon lynx tips!)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(-4, -14)
  ctx.lineTo(-6, -18)
  ctx.lineTo(-2, -14)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = furColor
  // Right ear
  ctx.save()
  ctx.translate(19, -20 + bob)
  ctx.rotate(0.1 - earAngle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(6, -14)
  ctx.lineTo(-5, -2)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(6, -14)
  ctx.lineTo(8, -18)
  ctx.lineTo(4, -14)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Inner ears
  ctx.fillStyle = '#e8a0b4'
  ctx.beginPath()
  ctx.moveTo(6, -19 + bob)
  ctx.lineTo(3, -28 + bob)
  ctx.lineTo(10, -20 + bob)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(18, -19 + bob)
  ctx.lineTo(22, -28 + bob)
  ctx.lineTo(14, -20 + bob)
  ctx.closePath()
  ctx.fill()

  // Eyes
  if (blink) {
    ctx.strokeStyle = '#2a2a35'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(9, -11 + bob, 2.5, 0.2, Math.PI - 0.2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(18, -11 + bob, 2.5, 0.2, Math.PI - 0.2)
    ctx.stroke()
  } else if (isSit) {
    // Happy squint eyes when sitting
    ctx.strokeStyle = '#2a2a35'
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(9, -10 + bob, 2.5, Math.PI + 0.3, -0.3)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(18, -10 + bob, 2.5, Math.PI + 0.3, -0.3)
    ctx.stroke()
  } else {
    // Normal eyes — bigger, more expressive
    ctx.fillStyle = '#2a2535'
    ctx.beginPath()
    ctx.ellipse(9, -11 + bob, 2.5, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(18, -11 + bob, 2.5, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    // Colored iris hint
    ctx.fillStyle = '#7c8fb0'
    ctx.beginPath()
    ctx.ellipse(9, -11 + bob, 1.8, 2.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(18, -11 + bob, 1.8, 2.2, 0, 0, Math.PI * 2)
    ctx.fill()
    // Pupils
    ctx.fillStyle = '#1a1520'
    ctx.beginPath()
    ctx.ellipse(9, -11 + bob, 1, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(18, -11 + bob, 1, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    // Eye shine
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(10, -12.5 + bob, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(19, -12.5 + bob, 1, 0, Math.PI * 2)
    ctx.fill()
  }

  // Nose
  ctx.fillStyle = '#e8a0b4'
  ctx.beginPath()
  ctx.moveTo(13, -6 + bob)
  ctx.bezierCurveTo(11.5, -4.5 + bob, 14.5, -4.5 + bob, 13, -6 + bob)
  ctx.moveTo(13, -6 + bob)
  ctx.lineTo(11.5, -4.5 + bob)
  ctx.lineTo(14.5, -4.5 + bob)
  ctx.closePath()
  ctx.fill()

  // Mouth / yawn
  if (yawn > 0) {
    const yawnOpen = Math.sin((40 - yawn) / 40 * Math.PI) * 4
    ctx.fillStyle = '#c47a8a'
    ctx.beginPath()
    ctx.ellipse(13, -2.5 + bob, 3, yawnOpen, 0, 0, Math.PI * 2)
    ctx.fill()
    // Tiny tongue
    ctx.fillStyle = '#e8a0b4'
    ctx.beginPath()
    ctx.ellipse(13, -1 + bob + yawnOpen * 0.3, 1.5, 1, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = '#c9908a'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(13, -4.5 + bob)
    ctx.quadraticCurveTo(10.5, -2 + bob, 9, -2.5 + bob)
    ctx.moveTo(13, -4.5 + bob)
    ctx.quadraticCurveTo(15.5, -2 + bob, 17, -2.5 + bob)
    ctx.stroke()
  }

  // Whiskers — more delicate
  ctx.strokeStyle = 'rgba(210,205,195,0.45)'
  ctx.lineWidth = 0.6
  for (const [sx, sy, ex, ey] of [
    [3, -7, -10, -10],
    [3, -5, -11, -5.5],
    [3, -3, -10, -1],
    [22, -7, 35, -10],
    [22, -5, 36, -5.5],
    [22, -3, 35, -1],
  ] as const) {
    const whiskerWave = Math.sin(frame * 0.02 + sx) * 0.5
    ctx.beginPath()
    ctx.moveTo(sx, sy + bob)
    ctx.lineTo(ex, ey + bob + whiskerWave)
    ctx.stroke()
  }

  // Purr particles when sitting
  if (isSit && Math.sin(purrPhase * 2) > 0.7) {
    ctx.fillStyle = 'rgba(180, 156, 252, 0.25)'
    ctx.font = '8px serif'
    ctx.fillText('♪', 24 + Math.sin(purrPhase) * 4, -18 + bob + Math.cos(purrPhase * 1.3) * 3)
  }

  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.fill()
}
