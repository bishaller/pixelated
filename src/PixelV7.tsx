import { useRef, useEffect, useState, useCallback } from 'react'
import { neonPixels48 } from './neonPixels'
import { grayPixels48, neonBg48 } from './grayPixels'
import './PixelV7.css'

const SIZE = 48

// Vibrant neon palettes — 6 colors each (shade 0=darkest to 5=brightest)
const PALETTES: { name: string; colors: [number, number, number][] }[] = [
  { name: 'Original', colors: [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]] }, // placeholder, uses neonPixels48 directly
  { name: 'Hot Pink', colors: [[102,0,51],[204,0,68],[255,51,102],[255,102,68],[255,170,0],[255,238,102]] },
  { name: 'Cyber Teal', colors: [[0,40,51],[0,85,102],[0,153,153],[0,204,187],[51,238,204],[170,255,238]] },
  { name: 'Neon Purple', colors: [[40,0,85],[85,0,153],[153,34,238],[187,85,255],[204,136,255],[230,195,255]] },
  { name: 'Electric Blue', colors: [[0,10,51],[0,40,136],[34,85,238],[34,153,255],[85,195,255],[187,230,255]] },
  { name: 'Sunset', colors: [[68,0,17],[153,17,34],[221,51,17],[238,119,17],[255,187,34],[255,238,119]] },
  { name: 'Toxic Green', colors: [[0,34,0],[0,85,17],[17,153,34],[68,204,34],[136,255,51],[204,255,153]] },
  { name: 'Magenta Gold', colors: [[68,0,51],[153,0,119],[238,0,153],[255,119,0],[255,187,0],[255,255,119]] },
  { name: 'Ice', colors: [[10,17,40],[26,51,85],[51,102,153],[102,170,204],[153,221,255],[221,245,255]] },
  { name: 'Lava', colors: [[51,0,0],[136,10,0],[204,51,0],[255,102,0],[255,170,51],[255,221,153]] },
  { name: 'Coral Reef', colors: [[51,10,26],[119,26,51],[187,51,68],[221,102,85],[255,153,119],[255,210,187]] },
  { name: 'Aurora', colors: [[0,10,26],[0,51,85],[0,136,119],[34,187,85],[153,221,0],[238,255,85]] },
  { name: 'Bubblegum', colors: [[68,0,51],[153,17,85],[221,51,153],[255,119,187],[255,170,210],[255,230,238]] },
  { name: 'Deep Ocean', colors: [[0,10,40],[0,34,85],[0,68,153],[17,119,187],[51,170,221],[136,221,255]] },
  { name: 'Neon Gold', colors: [[40,26,0],[85,60,0],[153,102,0],[204,153,0],[238,204,17],[255,238,136]] },
  { name: 'Grape', colors: [[26,0,40],[60,0,85],[102,26,153],[153,51,204],[187,102,238],[221,170,255]] },
  { name: 'Ember', colors: [[40,10,0],[102,26,0],[170,51,10],[221,102,10],[255,170,51],[255,230,153]] },
  { name: 'Mint Berry', colors: [[26,0,40],[68,0,85],[153,0,153],[0,170,119],[85,238,153],[187,255,230]] },
  { name: 'Blood Moon', colors: [[40,0,0],[102,0,17],[170,0,34],[221,34,51],[255,85,85],[255,170,170]] },
  { name: 'Synthwave', colors: [[17,0,51],[68,0,119],[153,0,204],[255,0,170],[255,85,221],[255,187,255]] },
  { name: 'Forest Fire', colors: [[17,26,0],[51,68,0],[119,136,0],[187,170,0],[238,119,0],[255,51,0]] },
  { name: 'Pastel Dream', colors: [[85,68,102],[136,119,153],[170,153,204],[204,187,238],[221,204,255],[238,230,255]] },
  { name: 'Monochrome', colors: [[10,10,15],[40,40,55],[85,85,102],[136,136,160],[187,187,204],[230,230,238]] },
  { name: 'Matrix', colors: [[0,17,0],[0,51,0],[0,119,0],[0,187,0],[0,238,0],[136,255,136]] },
]

function renderCard(
  canvas: HTMLCanvasElement,
  palIdx: number,
  pixelSize: number,
  gap: number,
  glow: boolean,
  rounded: boolean,
) {
  const ctx = canvas.getContext('2d')!
  const totalPx = pixelSize + gap
  const canvasSize = totalPx * SIZE
  canvas.width = canvasSize
  canvas.height = canvasSize

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  const isOriginal = palIdx === 0
  const pal = PALETTES[palIdx].colors

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let r: number, g: number, b: number

      if (neonBg48[y][x]) continue

      if (isOriginal) {
        ;[r, g, b] = neonPixels48[y][x]
        const brightness = r + g + b
        if (brightness < 60) continue
      } else {
        const shade = grayPixels48[y][x]
        ;[r, g, b] = pal[shade]
      }

      const px = x * totalPx
      const py = y * totalPx

      if (glow) {
        const brightness = r + g + b
        if (brightness > 150) {
          const glowSize = pixelSize * 1.8
          const gradient = ctx.createRadialGradient(
            px + pixelSize / 2, py + pixelSize / 2, 0,
            px + pixelSize / 2, py + pixelSize / 2, glowSize
          )
          gradient.addColorStop(0, `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)},0.25)`)
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.fillStyle = gradient
          ctx.fillRect(px - glowSize / 2, py - glowSize / 2, glowSize * 2, glowSize * 2)
        }
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`
      if (rounded) {
        ctx.beginPath()
        ctx.arc(px + pixelSize / 2, py + pixelSize / 2, pixelSize / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(px, py, pixelSize, pixelSize)
      }
    }
  }
}

interface PixelV7Props {
  hairMask: Uint8Array
  maskVersion: number
}

export function PixelV7({}: PixelV7Props) {
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const [pixelSize, setPixelSize] = useState(6)
  const [gap, setGap] = useState(1)
  const [glow, setGlow] = useState(true)
  const [rounded, setRounded] = useState(false)

  const setCanvasRef = useCallback((idx: number, el: HTMLCanvasElement | null) => {
    if (el) canvasRefs.current.set(idx, el)
    else canvasRefs.current.delete(idx)
  }, [])

  useEffect(() => {
    canvasRefs.current.forEach((canvas, idx) => {
      renderCard(canvas, idx, pixelSize, gap, glow, rounded)
    })
  }, [pixelSize, gap, glow, rounded])

  return (
    <div className="v7-layout">
      <div className="v7-cards">
        {PALETTES.map((pal, idx) => (
          <div key={idx} className="v7-card">
            <canvas
              ref={el => setCanvasRef(idx, el)}
              className="v7-card-canvas"
            />
            <div className="v7-card-footer">
              <span className="v7-card-num">{String(idx + 1).padStart(2, '0')}</span>
              <span className="v7-card-name">{pal.name}</span>
            </div>
          </div>
        ))}
      </div>

      <aside className="v7-sidebar">
        <div className="v7-section">
          <span className="v7-heading">Pixel Size</span>
          <input type="range" min={3} max={12} value={pixelSize}
            onChange={e => setPixelSize(+e.target.value)} className="v7-slider" />
          <span className="v7-value">{pixelSize}px</span>
        </div>
        <div className="v7-section">
          <span className="v7-heading">Gap</span>
          <input type="range" min={0} max={4} value={gap}
            onChange={e => setGap(+e.target.value)} className="v7-slider" />
          <span className="v7-value">{gap}px</span>
        </div>
        <div className="v7-section">
          <span className="v7-heading">Style</span>
          <div className="v7-btn-row">
            <button className={`v7-btn ${glow ? 'active' : ''}`}
              onClick={() => setGlow(g => !g)}>Glow</button>
            <button className={`v7-btn ${rounded ? 'active' : ''}`}
              onClick={() => setRounded(r => !r)}>Round</button>
          </div>
        </div>
      </aside>
    </div>
  )
}
