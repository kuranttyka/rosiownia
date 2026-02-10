import { useEffect, useRef } from 'react'

interface Point { x: number; y: number }

const S = 2.8 // Global scale — makes the cat large and noticeable

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

    // Touch support for mobile
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    window.addEventListener('touchmove', onTouch, { passive: true })

    catRef.current = {
      x: Math.random() * window.innerWidth * 0.5 + window.innerWidth * 0.25,
      y: window.innerHeight - 60 * S
    }

    let raf: number
    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const cat = catRef.current
      const mouse = mouseRef.current
      const dx = mouse.x - cat.x
      const dy = mouse.y - cat.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const speed = dist > 350 ? 3.2 : dist > 160 ? 1.5 : 0
      if (speed > 0) {
        velRef.current.x += (dx / dist) * speed * 0.065
        velRef.current.y += (dy / dist) * speed * 0.065
        stateRef.current = dist > 350 ? 'run' : 'walk'
        idleTimerRef.current = 0
        stretchRef.current = 0
        yawnRef.current = 0
      } else {
        idleTimerRef.current++
        if (idleTimerRef.current > 80) stateRef.current = 'idle'
        if (idleTimerRef.current === 220) stretchRef.current = 70
        if (idleTimerRef.current === 450) yawnRef.current = 50
        if (idleTimerRef.current > 550) stateRef.current = 'sit'
      }

      velRef.current.x *= 0.91
      velRef.current.y *= 0.91
      cat.x += velRef.current.x
      cat.y += velRef.current.y

      // Keep on screen with margin for the cat's size
      const margin = 50 * S
      cat.x = Math.max(margin, Math.min(window.innerWidth - margin, cat.x))
      cat.y = Math.max(margin, Math.min(window.innerHeight - margin * 0.5, cat.y))

      if (Math.abs(velRef.current.x) > 0.3) {
        facingRef.current = velRef.current.x > 0 ? 1 : -1
      }

      frameRef.current++
      tailRef.current += stateRef.current === 'sit' ? 0.025 : 0.055
      if (frameRef.current % 100 === 0) blinkRef.current = 12
      if (frameRef.current % 180 === 0 && Math.random() > 0.5) earTwitchRef.current = 15
      purrRef.current += 0.07

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
      window.removeEventListener('touchmove', onTouch)
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

// Color palette for Yuma
const FUR_CREAM = '#f5efe6'
const FUR_WHITE = '#faf8f4'
const FUR_BEIGE = '#d9c4a8'
const FUR_CARAMEL = '#c4a57b'
const FUR_TABBY_DARK = '#b08f6a'
const FUR_TABBY_LIGHT = '#d4b896'
const PINK_SKIN = '#e8a0b4'
const PINK_NOSE = '#dfa0a8'
const PINK_INNER_EAR = '#edb5be'
const EYE_BLUE = '#7c9ab8'
const EYE_DARK = '#2a2535'

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
  ctx.scale(facing * S, S)

  const isSit = state === 'sit'
  const bob = state === 'walk' ? Math.sin(frame * 0.14) * 2.5
    : state === 'run' ? Math.sin(frame * 0.24) * 3.5
    : isSit ? Math.sin(frame * 0.02) * 0.4
    : Math.sin(frame * 0.03) * 0.8
  const legPhase = state === 'walk' ? frame * 0.14 : state === 'run' ? frame * 0.22 : 0
  const purrBob = isSit ? Math.sin(purrPhase) * 0.5 : 0
  const stretchAmt = stretch > 0 ? Math.sin((70 - stretch) / 70 * Math.PI) * 10 : 0

  // ===== Shadow =====
  const shadowGrad = ctx.createRadialGradient(0, 22, 0, 0, 22, 30)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.14)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(0, 22, 28 + stretchAmt * 0.5, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // ===== TAIL — big fluffy with cream/white =====
  const tailWag = Math.sin(tailPhase) * (isSit ? 10 : 20)
  const tailWag2 = Math.cos(tailPhase * 0.7) * 7
  // Tail fur — thick main stroke
  ctx.strokeStyle = FUR_WHITE
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-16, -2 + bob)
  ctx.bezierCurveTo(
    -26, -18 + bob + tailWag,
    -36 + tailWag2, -32 + bob + tailWag * 0.5,
    -28, -44 + bob + tailWag * 0.3
  )
  ctx.stroke()
  // Tail fluff outline — slightly wider, cream tinted
  ctx.strokeStyle = FUR_CREAM
  ctx.lineWidth = 10
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(-16, -2 + bob)
  ctx.bezierCurveTo(
    -26, -18 + bob + tailWag,
    -36 + tailWag2, -32 + bob + tailWag * 0.5,
    -28, -44 + bob + tailWag * 0.3
  )
  ctx.stroke()
  ctx.globalAlpha = 1
  // Tail tip poof
  ctx.fillStyle = FUR_WHITE
  ctx.beginPath()
  ctx.ellipse(-28, -44 + bob + tailWag * 0.3, 5, 4, tailWag * 0.02, 0, Math.PI * 2)
  ctx.fill()

  // ===== LEGS =====
  if (isSit) {
    // Sitting — tucked hind legs, front paws visible
    ctx.fillStyle = FUR_CREAM
    ctx.beginPath()
    ctx.ellipse(-7, 14 + bob, 10, 6, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(9, 14 + bob, 10, 6, 0.2, 0, Math.PI * 2)
    ctx.fill()
    // Front paws
    ctx.fillStyle = FUR_WHITE
    roundRect(ctx, -4, 10 + bob, 7, 10, 3)
    roundRect(ctx, 8, 10 + bob, 7, 10, 3)
    // Toe beans
    ctx.fillStyle = PINK_SKIN
    for (const px of [-1, 1.5, 4]) {
      ctx.beginPath()
      ctx.arc(px, 19 + bob, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const px of [9.5, 12, 14.5]) {
      ctx.beginPath()
      ctx.arc(px, 19 + bob, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    const legOff1 = Math.sin(legPhase) * 5
    const legOff2 = Math.sin(legPhase + Math.PI) * 5
    // Back legs — slightly beige
    ctx.fillStyle = FUR_CREAM
    roundRect(ctx, -12, 8 + bob + legOff1, 7, 14, 3)
    roundRect(ctx, 3, 8 + bob + legOff2, 7, 14, 3)
    // Front legs — whiter
    ctx.fillStyle = FUR_WHITE
    roundRect(ctx, -8, 8 + bob + legOff2 - stretchAmt * 0.3, 7, 14 + stretchAmt * 0.5, 3)
    roundRect(ctx, 8, 8 + bob + legOff1 - stretchAmt * 0.3, 7, 14 + stretchAmt * 0.5, 3)
    // Paws
    ctx.fillStyle = PINK_SKIN
    ctx.globalAlpha = 0.6
    for (const [lx, off] of [[-10, legOff1], [5, legOff2], [-6, legOff2], [10, legOff1]] as const) {
      ctx.beginPath()
      ctx.ellipse(lx + 2, 22 + bob + off + stretchAmt * 0.2, 3.5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ===== BODY — cream base with tabby pattern on back =====
  // Body base
  ctx.fillStyle = FUR_CREAM
  ctx.beginPath()
  ctx.ellipse(0 + stretchAmt * 0.3, 2 + bob + purrBob, 22 + stretchAmt * 0.4, 16, 0, 0, Math.PI * 2)
  ctx.fill()

  // Tabby stripes on the back — subtle beige/caramel
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = FUR_CARAMEL
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const sx = -10 + i * 5.5
    ctx.beginPath()
    ctx.moveTo(sx, -8 + bob + purrBob)
    ctx.quadraticCurveTo(sx + 1.5, -12 + bob + purrBob, sx + 0.5, -14 + bob + purrBob)
    ctx.stroke()
  }
  // A couple wider stripes
  ctx.strokeStyle = FUR_TABBY_LIGHT
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(-6, -6 + bob + purrBob)
  ctx.quadraticCurveTo(-4, -11 + bob + purrBob, -5, -14 + bob + purrBob)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(8, -6 + bob + purrBob)
  ctx.quadraticCurveTo(10, -11 + bob + purrBob, 9, -14 + bob + purrBob)
  ctx.stroke()
  ctx.globalAlpha = 1

  // White belly/chest fluff
  ctx.fillStyle = FUR_WHITE
  ctx.beginPath()
  ctx.ellipse(8, 6 + bob + purrBob, 10, 12, 0.15, 0, Math.PI * 2)
  ctx.fill()

  // Maine Coon neck ruff — luxurious
  ctx.fillStyle = FUR_WHITE
  ctx.beginPath()
  ctx.ellipse(11, -1 + bob, 12, 10, 0.08, 0, Math.PI * 2)
  ctx.fill()
  // Ruff texture lines
  ctx.globalAlpha = 0.12
  ctx.strokeStyle = FUR_BEIGE
  ctx.lineWidth = 0.8
  for (let a = -0.8; a < 0.8; a += 0.25) {
    ctx.beginPath()
    ctx.moveTo(11 + Math.cos(a) * 6, -1 + bob + Math.sin(a) * 6)
    ctx.lineTo(11 + Math.cos(a) * 12, -1 + bob + Math.sin(a) * 10)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // ===== HEAD =====
  ctx.fillStyle = FUR_CREAM
  ctx.beginPath()
  ctx.ellipse(14, -12 + bob + purrBob, 14, 13, 0, 0, Math.PI * 2)
  ctx.fill()

  // Forehead tabby "M" marking — very subtle
  ctx.globalAlpha = 0.2
  ctx.strokeStyle = FUR_CARAMEL
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(7, -16 + bob)
  ctx.lineTo(10, -20 + bob)
  ctx.lineTo(14, -17 + bob)
  ctx.lineTo(18, -20 + bob)
  ctx.lineTo(21, -16 + bob)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Cheek fluffs — Maine Coon style
  ctx.fillStyle = FUR_WHITE
  ctx.beginPath()
  ctx.ellipse(4, -5 + bob, 6, 5, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(24, -5 + bob, 6, 5, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // ===== EARS =====
  const earAngle = earTwitch ? Math.sin(Date.now() * 0.04) * 0.18 : 0

  // Left ear
  ctx.save()
  ctx.translate(5, -22 + bob)
  ctx.rotate(-0.12 + earAngle)
  // Outer ear
  ctx.fillStyle = FUR_CREAM
  ctx.beginPath()
  ctx.moveTo(-1, 2)
  ctx.lineTo(-5, -16)
  ctx.lineTo(8, -1)
  ctx.closePath()
  ctx.fill()
  // Inner ear — pink
  ctx.fillStyle = PINK_INNER_EAR
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-3, -12)
  ctx.lineTo(6, -1)
  ctx.closePath()
  ctx.fill()
  // Lynx tip tuft
  ctx.fillStyle = FUR_WHITE
  ctx.beginPath()
  ctx.moveTo(-5, -16)
  ctx.lineTo(-7, -21)
  ctx.lineTo(-2, -16)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Right ear
  ctx.save()
  ctx.translate(21, -22 + bob)
  ctx.rotate(0.12 - earAngle)
  ctx.fillStyle = FUR_CREAM
  ctx.beginPath()
  ctx.moveTo(3, 2)
  ctx.lineTo(7, -16)
  ctx.lineTo(-6, -1)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = PINK_INNER_EAR
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.lineTo(5, -12)
  ctx.lineTo(-4, -1)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = FUR_WHITE
  ctx.beginPath()
  ctx.moveTo(7, -16)
  ctx.lineTo(9, -21)
  ctx.lineTo(4, -16)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // ===== EYES =====
  if (blink) {
    // Blink — cute curved lines
    ctx.strokeStyle = EYE_DARK
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(9, -12 + bob, 3, 0.3, Math.PI - 0.3)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(19, -12 + bob, 3, 0.3, Math.PI - 0.3)
    ctx.stroke()
  } else if (isSit) {
    // Happy squint
    ctx.strokeStyle = EYE_DARK
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(9, -11 + bob, 3, Math.PI + 0.4, -0.4)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(19, -11 + bob, 3, Math.PI + 0.4, -0.4)
    ctx.stroke()
  } else {
    // Full eyes — larger and more detailed
    // Eye whites
    ctx.fillStyle = '#f8f6f2'
    ctx.beginPath()
    ctx.ellipse(9, -12 + bob, 3.5, 4, -0.05, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(19, -12 + bob, 3.5, 4, 0.05, 0, Math.PI * 2)
    ctx.fill()

    // Iris — blue-grey
    ctx.fillStyle = EYE_BLUE
    ctx.beginPath()
    ctx.ellipse(9, -12 + bob, 2.5, 3.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(19, -12 + bob, 2.5, 3.2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Pupil — vertical slit
    ctx.fillStyle = '#1a1520'
    ctx.beginPath()
    ctx.ellipse(9, -12 + bob, 1.2, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(19, -12 + bob, 1.2, 2.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eye shine — two highlights per eye
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(10.5, -13.5 + bob, 1.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(8.5, -11 + bob, 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(20.5, -13.5 + bob, 1.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(18.5, -11 + bob, 0.6, 0, Math.PI * 2)
    ctx.fill()

    // Eye outline
    ctx.strokeStyle = EYE_DARK
    ctx.lineWidth = 0.6
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(9, -12 + bob, 3.5, 4, -0.05, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(19, -12 + bob, 3.5, 4, 0.05, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // ===== NOSE — pink triangle =====
  ctx.fillStyle = PINK_NOSE
  ctx.beginPath()
  ctx.moveTo(14, -6 + bob)
  ctx.quadraticCurveTo(12, -3.5 + bob, 12.5, -3.5 + bob)
  ctx.lineTo(15.5, -3.5 + bob)
  ctx.quadraticCurveTo(16, -3.5 + bob, 14, -6 + bob)
  ctx.fill()
  // Nose shine
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.ellipse(13.8, -5.5 + bob, 1, 0.7, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // ===== MOUTH =====
  if (yawn > 0) {
    const yawnOpen = Math.sin((50 - yawn) / 50 * Math.PI) * 5
    ctx.fillStyle = '#c47a8a'
    ctx.beginPath()
    ctx.ellipse(14, -1.5 + bob, 3.5, yawnOpen, 0, 0, Math.PI * 2)
    ctx.fill()
    // Tongue
    ctx.fillStyle = '#e8a0b4'
    ctx.beginPath()
    ctx.ellipse(14, 0 + bob + yawnOpen * 0.3, 2, 1.2, 0, 0, Math.PI * 2)
    ctx.fill()
    // Tiny teeth
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(12.5, -1.5 + bob - yawnOpen * 0.6)
    ctx.lineTo(13, -1.5 + bob - yawnOpen * 0.3)
    ctx.lineTo(13.5, -1.5 + bob - yawnOpen * 0.6)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(14.5, -1.5 + bob - yawnOpen * 0.6)
    ctx.lineTo(15, -1.5 + bob - yawnOpen * 0.3)
    ctx.lineTo(15.5, -1.5 + bob - yawnOpen * 0.6)
    ctx.fill()
  } else {
    ctx.strokeStyle = '#c9908a'
    ctx.lineWidth = 0.9
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(14, -3.5 + bob)
    ctx.quadraticCurveTo(11, -1 + bob, 9, -1.5 + bob)
    ctx.moveTo(14, -3.5 + bob)
    ctx.quadraticCurveTo(17, -1 + bob, 19, -1.5 + bob)
    ctx.stroke()
  }

  // ===== WHISKERS — delicate and long =====
  ctx.strokeStyle = 'rgba(210,205,195,0.4)'
  ctx.lineWidth = 0.5
  ctx.lineCap = 'round'
  const whiskerWaveT = frame * 0.015
  for (const [sx, sy, ex, ey, phase] of [
    [3, -7, -14, -11, 0],
    [3, -5, -15, -5.5, 1],
    [3, -3, -14, 0, 2],
    [24, -7, 41, -11, 3],
    [24, -5, 42, -5.5, 4],
    [24, -3, 41, 0, 5],
  ] as const) {
    const wave = Math.sin(whiskerWaveT + phase * 0.7) * 0.8
    ctx.beginPath()
    ctx.moveTo(sx, sy + bob)
    ctx.lineTo(ex, ey + bob + wave)
    ctx.stroke()
  }

  // ===== Purr particles when sitting =====
  if (isSit) {
    const purrAlpha = (Math.sin(purrPhase * 2) + 1) * 0.15
    if (purrAlpha > 0.1) {
      ctx.globalAlpha = purrAlpha
      ctx.fillStyle = '#b49cfc'
      ctx.font = '10px serif'
      ctx.fillText('♪', 28 + Math.sin(purrPhase) * 5, -22 + bob + Math.cos(purrPhase * 1.3) * 4)
      ctx.font = '7px serif'
      ctx.fillText('♫', 32 + Math.cos(purrPhase * 0.8) * 3, -28 + bob + Math.sin(purrPhase * 1.1) * 3)
      ctx.globalAlpha = 1
    }
    // Small "zzz" after very long idle
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
