import { useState, useEffect } from 'react'

const FRAME_SIZE = 32
const SCALE = 4

const anims: Record<string, { src: string; frames: number; speed: number }> = {
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

const animNames = Object.keys(anims)

export default function SpriteDebugger() {
  const [selected, setSelected] = useState('WalkRight')
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)

  const anim = anims[selected]
  const scaledW = FRAME_SIZE * SCALE
  const scaledH = FRAME_SIZE * SCALE

  useEffect(() => {
    if (!playing) return
    setFrame(0)
    const iv = setInterval(() => {
      setFrame(f => (f + 1) % anim.frames)
    }, anim.speed / speed)
    return () => clearInterval(iv)
  }, [selected, playing, speed, anim.frames, anim.speed])

  return (
    <div style={{
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 10,
      background: '#faf3e8',
      minHeight: '100vh',
      padding: 32,
      color: '#3d2c1e',
    }}>
      <h1 style={{ fontSize: 16, marginBottom: 24 }}>🐱 Sprite Debugger</h1>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <label>
          Animation:
          <select
            value={selected}
            onChange={e => { setSelected(e.target.value); setFrame(0) }}
            style={{
              marginLeft: 8,
              fontFamily: 'inherit',
              fontSize: 10,
              padding: '4px 8px',
              background: '#fff',
              border: '2px solid #3d2c1e',
            }}
          >
            {animNames.map(name => (
              <option key={name} value={name}>{name} ({anims[name].frames}f @ {anims[name].speed}ms)</option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            fontFamily: 'inherit', fontSize: 10, padding: '4px 12px',
            background: playing ? '#e74c3c' : '#2ecc71', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>

        <label>
          Speed: {speed}x
          <input
            type="range" min={0.25} max={4} step={0.25} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>

        <span>Frame: {frame}/{anim.frames - 1}</span>
      </div>

      {/* Frame scrubber */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="range" min={0} max={anim.frames - 1} value={frame}
          onChange={e => { setPlaying(false); setFrame(Number(e.target.value)) }}
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>

      {/* Animated preview */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ marginBottom: 8 }}>Preview (animated):</p>
          <div style={{
            width: scaledW, height: scaledH,
            border: '2px solid #3d2c1e',
            background: '#d4eaf7',
            backgroundImage: `url(${anim.src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${anim.frames * scaledW}px ${scaledH}px`,
            backgroundPositionX: -(frame * scaledW),
            backgroundPositionY: 0,
            imageRendering: 'pixelated',
          }} />
        </div>

        {/* All frames grid */}
        <div>
          <p style={{ marginBottom: 8 }}>All frames:</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: anim.frames }, (_, i) => (
              <div
                key={i}
                onClick={() => { setPlaying(false); setFrame(i) }}
                style={{
                  width: scaledW, height: scaledH,
                  border: i === frame ? '2px solid #e74c3c' : '2px solid #ccc',
                  cursor: 'pointer',
                  background: '#d4eaf7',
                  backgroundImage: `url(${anim.src})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${anim.frames * scaledW}px ${scaledH}px`,
                  backgroundPositionX: -(i * scaledW),
                  backgroundPositionY: 0,
                  imageRendering: 'pixelated',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Full sprite sheet */}
      <div style={{ marginTop: 32 }}>
        <p style={{ marginBottom: 8 }}>Full sprite sheet ({anim.src}):</p>
        <img
          src={anim.src}
          style={{
            imageRendering: 'pixelated',
            height: scaledH,
            width: anim.frames * scaledW,
            border: '2px solid #3d2c1e',
            background: '#d4eaf7',
          }}
        />
      </div>
    </div>
  )
}
