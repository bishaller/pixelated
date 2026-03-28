import { useRef, useEffect, useState } from 'react'
import { shades384, hairs384 } from './canvasData'
import './PixelV6.css'

const PAL = [
  [8,8,15],
  [42,42,62],
  [90,90,114],
  [154,154,176],
  [208,208,220],
  [240,240,244],
]

const PAL_HAIR = [
  [10,8,16],
  [46,40,56],
  [94,84,104],
  [158,146,164],
  [208,208,220],
  [240,240,244],
]

const SRC = 384
const CANVAS = 600
const SCALE = CANVAS / SRC

// Background mask via flood-fill
function computeBg(): Uint8Array {
  const bg = new Uint8Array(SRC * SRC)
  const queue: number[] = []
  for (let y = 0; y < SRC; y++) {
    for (let x = 0; x < SRC; x++) {
      if (y === 0 || y === SRC - 1 || x === 0 || x === SRC - 1) {
        const i = y * SRC + x
        if (parseInt(shades384[i]) >= 4) {
          bg[i] = 1
          queue.push(i)
        }
      }
    }
  }
  const dirs = [-SRC, SRC, -1, 1]
  let head = 0
  while (head < queue.length) {
    const ci = queue[head++]
    const cx = ci % SRC
    for (const d of dirs) {
      const ni = ci + d
      if (ni < 0 || ni >= SRC * SRC) continue
      const nx = ni % SRC
      if (d === -1 && nx === SRC - 1) continue
      if (d === 1 && nx === 0) continue
      if (!bg[ni] && parseInt(shades384[ni]) >= 4) {
        bg[ni] = 1
        queue.push(ni)
      }
    }
  }
  return bg
}

interface Particle {
  tx: number
  ty: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  g: number
  b: number
  size: number
  hair: boolean
  dist: number
}

function buildParticles(sampleStep: number, mask: Uint8Array): Particle[] {
  const bg = computeBg()
  const particles: Particle[] = []

  const topY = new Int32Array(SRC).fill(SRC)
  for (let x = 0; x < SRC; x++) {
    for (let y = 0; y < SRC; y++) {
      if (mask[y * SRC + x] === 1) { topY[x] = y; break }
    }
  }
  let maxDist = 0
  const hairDist = new Float32Array(SRC * SRC)
  for (let i = 0; i < SRC * SRC; i++) {
    if (mask[i] === 1) {
      const x = i % SRC
      const y = Math.floor(i / SRC)
      const d = y - topY[x]
      hairDist[i] = d
      if (d > maxDist) maxDist = d
    }
  }
  if (maxDist > 0) {
    for (let i = 0; i < SRC * SRC; i++) {
      if (mask[i] === 1) hairDist[i] /= maxDist
    }
  }

  for (let y = 0; y < SRC; y += sampleStep) {
    for (let x = 0; x < SRC; x += sampleStep) {
      const i = y * SRC + x
      if (bg[i]) continue

      const s = parseInt(shades384[i])
      const isHair = mask[i] === 1
      const pal = isHair ? PAL_HAIR : PAL
      const [r, g, b] = pal[s]

      const tx = x * SCALE
      const ty = y * SCALE

      particles.push({
        tx, ty,
        x: tx,
        y: ty,
        vx: 0, vy: 0,
        r, g, b,
        size: sampleStep * SCALE * 0.9,
        hair: isHair,
        dist: hairDist[i],
      })
    }
  }

  return particles
}

// Settings stored in ref so the rAF loop reads them without re-mounting
interface Settings {
  mouseRadius: number
  mouseForce: number
  springEase: number
  friction: number
  particleShape: 'square' | 'circle'
  bgColor: string
  mouseMode: 'repel' | 'attract'
}

const DEFAULTS: Settings = {
  mouseRadius: 30,
  mouseForce: 6,
  springEase: 0.08,
  friction: 0.85,
  particleShape: 'square',
  bgColor: '#ffffff',
  mouseMode: 'repel',
}

interface PixelV6Props {
  hairMask: Uint8Array
  maskVersion: number
}

export function PixelV6({ hairMask, maskVersion }: PixelV6Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[] | null>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const settingsRef = useRef<Settings>({ ...DEFAULTS })

  const [density, setDensity] = useState(3)
  const [mouseRadius, setMouseRadius] = useState(DEFAULTS.mouseRadius)
  const [mouseForce, setMouseForce] = useState(DEFAULTS.mouseForce)
  const [springEase, setSpringEase] = useState(DEFAULTS.springEase)
  const [friction, setFriction] = useState(DEFAULTS.friction)
  const [particleShape, setParticleShape] = useState<'square' | 'circle'>(DEFAULTS.particleShape)
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor)
  const [mouseMode, setMouseMode] = useState<'repel' | 'attract'>(DEFAULTS.mouseMode)

  // Sync state to ref so animation loop sees latest values without re-effect
  settingsRef.current = { mouseRadius, mouseForce, springEase, friction, particleShape, bgColor, mouseMode }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    particlesRef.current = buildParticles(density, hairMask)

    function animate() {
      const s = settingsRef.current
      ctx.fillStyle = s.bgColor
      ctx.fillRect(0, 0, CANVAS, CANVAS)

      const mouse = mouseRef.current
      const particles = particlesRef.current!

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        let ax = (p.tx - p.x) * s.springEase
        let ay = (p.ty - p.y) * s.springEase

        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const distSq = dx * dx + dy * dy
          const rr = s.mouseRadius * s.mouseRadius
          if (distSq < rr && distSq > 0) {
            const dist = Math.sqrt(distSq)
            const force = (1 - dist / s.mouseRadius) * s.mouseForce
            const dir = s.mouseMode === 'repel' ? 1 : -1
            ax += (dx / dist) * force * dir
            ay += (dy / dist) * force * dir
          }
        }

        p.vx = (p.vx + ax) * s.friction
        p.vy = (p.vy + ay) * s.friction
        p.x += p.vx
        p.y += p.vy

        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
        if (s.particleShape === 'circle') {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [density, maskVersion, hairMask])

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = CANVAS / rect.width
    mouseRef.current.x = (e.clientX - rect.left) * scale
    mouseRef.current.y = (e.clientY - rect.top) * scale
  }

  return (
    <div className="v6-layout">
      <canvas
        ref={canvasRef}
        width={CANVAS}
        height={CANVAS}
        className="v6-canvas"
        onMouseMove={onMouseMove}
        onMouseEnter={() => { mouseRef.current.active = true }}
        onMouseLeave={() => { mouseRef.current.active = false }}
      />
      <aside className="v6-sidebar">
        <div className="v6-section">
          <span className="v6-heading">Particles</span>
          <label className="v6-label">
            Density
            <input type="range" min={1} max={6} step={1} value={density}
              onChange={e => setDensity(+e.target.value)} className="v6-slider" />
            <span className="v6-value">{particlesRef.current?.length.toLocaleString() ?? '—'}</span>
          </label>
          <label className="v6-label">
            Shape
            <div className="v6-btn-row">
              <button className={`v6-btn ${particleShape === 'square' ? 'active' : ''}`}
                onClick={() => setParticleShape('square')}>Square</button>
              <button className={`v6-btn ${particleShape === 'circle' ? 'active' : ''}`}
                onClick={() => setParticleShape('circle')}>Circle</button>
            </div>
          </label>
        </div>

        <div className="v6-section">
          <span className="v6-heading">Mouse</span>
          <label className="v6-label">
            Mode
            <div className="v6-btn-row">
              <button className={`v6-btn ${mouseMode === 'repel' ? 'active' : ''}`}
                onClick={() => setMouseMode('repel')}>Repel</button>
              <button className={`v6-btn ${mouseMode === 'attract' ? 'active' : ''}`}
                onClick={() => setMouseMode('attract')}>Attract</button>
            </div>
          </label>
          <label className="v6-label">
            Radius
            <input type="range" min={10} max={120} step={5} value={mouseRadius}
              onChange={e => setMouseRadius(+e.target.value)} className="v6-slider" />
            <span className="v6-value">{mouseRadius}px</span>
          </label>
          <label className="v6-label">
            Force
            <input type="range" min={1} max={30} step={1} value={mouseForce}
              onChange={e => setMouseForce(+e.target.value)} className="v6-slider" />
            <span className="v6-value">{mouseForce}</span>
          </label>
        </div>

        <div className="v6-section">
          <span className="v6-heading">Physics</span>
          <label className="v6-label">
            Spring
            <input type="range" min={0.01} max={0.2} step={0.01} value={springEase}
              onChange={e => setSpringEase(+e.target.value)} className="v6-slider" />
            <span className="v6-value">{springEase.toFixed(2)}</span>
          </label>
          <label className="v6-label">
            Friction
            <input type="range" min={0.5} max={0.98} step={0.01} value={friction}
              onChange={e => setFriction(+e.target.value)} className="v6-slider" />
            <span className="v6-value">{friction.toFixed(2)}</span>
          </label>
        </div>

        <div className="v6-section">
          <span className="v6-heading">Background</span>
          <div className="v6-btn-row">
            <button className={`v6-btn ${bgColor === '#ffffff' ? 'active' : ''}`}
              onClick={() => setBgColor('#ffffff')}>White</button>
            <button className={`v6-btn ${bgColor === '#0e0e1a' ? 'active' : ''}`}
              onClick={() => setBgColor('#0e0e1a')}>Dark</button>
            <button className={`v6-btn ${bgColor === '#f5ead5' ? 'active' : ''}`}
              onClick={() => setBgColor('#f5ead5')}>Warm</button>
          </div>
        </div>
      </aside>
    </div>
  )
}
