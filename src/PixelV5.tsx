import { useRef, useEffect, useState, useCallback } from 'react'
import { shades384, hairs384 } from './canvasData'
import './PixelV5.css'

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

const PAL_MASK_HAIR = [255, 64, 96]
const PAL_MASK_DIM = 0.15

const SIZE = 384

type Mode = 'normal' | 'mask' | 'invert' | 'haironly'

const modes: { id: Mode; label: string }[] = [
  { id: 'normal', label: 'NORMAL' },
  { id: 'mask', label: 'HAIR MASK' },
  { id: 'invert', label: 'INVERT' },
  { id: 'haironly', label: 'HAIR ONLY' },
]

interface PixelV5Props {
  hairMask: Uint8Array
  onMaskChange: () => void
}

export function PixelV5({ hairMask, onMaskChange }: PixelV5Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgDataRef = useRef<ImageData | null>(null)
  const [mode, setMode] = useState<Mode>('normal')
  const [brushSize, setBrushSize] = useState(8)
  const [tool, setTool] = useState<'eraser' | 'brush'>('eraser')
  const isPainting = useRef(false)

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!imgDataRef.current) {
      imgDataRef.current = ctx.createImageData(SIZE, SIZE)
    }

    const d = imgDataRef.current.data

    for (let i = 0; i < SIZE * SIZE; i++) {
      const s = parseInt(shades384[i])
      const h = hairMask[i] === 1
      const idx = i * 4
      let r: number, g: number, b: number

      if (mode === 'normal') {
        const pal = h ? PAL_HAIR : PAL
        ;[r, g, b] = pal[s]
      } else if (mode === 'mask') {
        if (h) {
          ;[r, g, b] = PAL_MASK_HAIR
        } else {
          const [pr, pg, pb] = PAL[s]
          r = Math.round(pr * PAL_MASK_DIM)
          g = Math.round(pg * PAL_MASK_DIM)
          b = Math.round(pb * PAL_MASK_DIM)
        }
      } else if (mode === 'invert') {
        const inv = 5 - s
        const pal = h ? PAL_HAIR : PAL
        ;[r, g, b] = pal[inv]
      } else {
        if (h) {
          ;[r, g, b] = PAL_HAIR[s]
        } else {
          r = g = b = 10
        }
      }

      d[idx] = r
      d[idx + 1] = g
      d[idx + 2] = b
      d[idx + 3] = 255
    }

    ctx.putImageData(imgDataRef.current, 0, 0)
  }, [mode, hairMask])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const paint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scale = SIZE / rect.width
    const cx = Math.floor((e.clientX - rect.left) * scale)
    const cy = Math.floor((e.clientY - rect.top) * scale)
    const r = brushSize
    const val = tool === 'brush' ? 1 : 0

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue
        const px = cx + dx
        const py = cy + dy
        if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
          hairMask[py * SIZE + px] = val
        }
      }
    }

    renderCanvas()
    onMaskChange()
  }, [brushSize, tool, renderCanvas, hairMask, onMaskChange])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isPainting.current = true
    paint(e)
  }, [paint])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPainting.current) paint(e)
  }, [paint])

  const onMouseUp = useCallback(() => {
    isPainting.current = false
  }, [])

  const resetMask = useCallback(() => {
    for (let i = 0; i < SIZE * SIZE; i++) {
      hairMask[i] = hairs384[i] === '1' ? 1 : 0
    }
    renderCanvas()
    onMaskChange()
  }, [renderCanvas, hairMask, onMaskChange])

  return (
    <div className="v5-layout">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="v5-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <aside className="v5-sidebar">
        <div className="v5-section">
          <span className="v5-heading">View</span>
          {modes.map(m => (
            <button
              key={m.id}
              className={`v5-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="v5-section">
          <span className="v5-heading">Edit Mask</span>
          <div className="v5-tool-row">
            <button
              className={`v5-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
            >
              ERASER
            </button>
            <button
              className={`v5-btn ${tool === 'brush' ? 'active' : ''}`}
              onClick={() => setTool('brush')}
            >
              BRUSH
            </button>
          </div>
          <label className="v5-label">
            Brush size: {brushSize}px
            <input
              type="range"
              min={2}
              max={30}
              value={brushSize}
              onChange={e => setBrushSize(+e.target.value)}
              className="v5-slider"
            />
          </label>
          <button className="v5-btn" onClick={resetMask}>
            RESET MASK
          </button>
        </div>
      </aside>
    </div>
  )
}
