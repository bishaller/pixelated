import { useRef, useEffect } from 'react'
import { createNoise3D } from 'simplex-noise'

// RGB palettes matching the HTML's approach — [r,g,b] per shade 0–5
const PALETTES: Record<string, number[][]> = {
  mono: [
    [8, 8, 15], [46, 46, 64], [94, 94, 114],
    [144, 144, 164], [196, 196, 210], [240, 240, 245],
  ],
  sepia: [
    [43, 26, 14], [92, 58, 30], [139, 106, 62],
    [184, 154, 106], [221, 201, 163], [245, 234, 213],
  ],
  ocean: [
    [5, 21, 37], [10, 48, 80], [26, 90, 122],
    [58, 138, 170], [122, 196, 216], [208, 240, 248],
  ],
  neon: [
    [13, 0, 21], [74, 0, 128], [170, 0, 204],
    [255, 0, 170], [255, 102, 221], [255, 204, 245],
  ],
  sunset: [
    [26, 10, 30], [107, 29, 58], [196, 69, 32],
    [232, 120, 48], [245, 176, 64], [252, 232, 160],
  ],
  forest: [
    [10, 18, 8], [30, 51, 24], [58, 90, 42],
    [106, 138, 74], [164, 196, 128], [218, 240, 200],
  ],
  inverted: [
    [240, 240, 245], [196, 196, 210], [144, 144, 164],
    [94, 94, 114], [46, 46, 64], [8, 8, 15],
  ],
}

// Warm-tinted hair palette (from the HTML's PAL_HAIR)
const HAIR_PALETTES: Record<string, number[][]> = {
  mono: [
    [10, 8, 16], [46, 40, 56], [94, 84, 104],
    [158, 146, 164], [208, 208, 220], [240, 240, 244],
  ],
  // For other palettes, shift hair slightly warmer
  sepia: [
    [50, 28, 10], [100, 55, 25], [145, 100, 55],
    [190, 148, 95], [225, 198, 155], [248, 232, 208],
  ],
  ocean: [
    [8, 18, 42], [15, 44, 86], [32, 86, 128],
    [64, 132, 176], [128, 190, 222], [212, 238, 250],
  ],
  neon: [
    [18, 0, 26], [82, 0, 138], [178, 0, 212],
    [255, 10, 180], [255, 112, 228], [255, 210, 248],
  ],
  sunset: [
    [32, 12, 24], [115, 32, 50], [204, 72, 28],
    [238, 125, 42], [248, 180, 58], [254, 235, 155],
  ],
  forest: [
    [12, 20, 6], [34, 54, 20], [64, 94, 38],
    [112, 142, 68], [170, 200, 122], [222, 242, 196],
  ],
  inverted: [
    [240, 240, 244], [208, 208, 220], [158, 146, 164],
    [94, 84, 104], [46, 40, 56], [10, 8, 16],
  ],
}

const noise3D = createNoise3D()

// Flood-fill from edges to find background pixels (same algo as mask.ts)
function computeBgMask(shades: string, size: number): Uint8Array {
  const bg = new Uint8Array(size * size) // 1 = background
  const queue: number[] = []

  // Seed edges
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (y === 0 || y === size - 1 || x === 0 || x === size - 1) {
        const i = y * size + x
        if (parseInt(shades[i]) >= 4) {
          bg[i] = 1
          queue.push(i)
        }
      }
    }
  }

  const dirs = [-size, size, -1, 1]
  let head = 0
  while (head < queue.length) {
    const ci = queue[head++]
    const cx = ci % size
    for (const d of dirs) {
      const ni = ci + d
      if (ni < 0 || ni >= size * size) continue
      const nx = ni % size
      // Prevent wrapping
      if (d === -1 && nx === size - 1) continue
      if (d === 1 && nx === 0) continue
      if (!bg[ni] && parseInt(shades[ni]) >= 4) {
        bg[ni] = 1
        queue.push(ni)
      }
    }
  }

  return bg
}

interface PixelCanvasProps {
  shades: string    // flat string of shade chars '0'-'5'
  hairs: string     // flat string of '0'/'1'
  size: number      // grid dimension (e.g. 384)
  palette: string
  animEnabled: boolean
  animSpeed: number
  animAmplitude: number
  showSubjectOnly: boolean
}

export function PixelCanvas({
  shades,
  hairs,
  size,
  palette,
  animEnabled,
  animSpeed,
  animAmplitude,
  showSubjectOnly,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafId = useRef<number>(0)

  // Pre-compute background mask (flood-fill from edges)
  const bgMask = useRef<Uint8Array | null>(null)
  useEffect(() => {
    bgMask.current = computeBgMask(shades, size)
  }, [shades, size])

  // Pre-compute distance from scalp for each hair pixel (once)
  const distFromScalp = useRef<Float32Array | null>(null)
  useEffect(() => {
    const dist = new Float32Array(size * size)
    // Find topmost hair pixel per column
    const topY = new Int32Array(size).fill(size)
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (hairs[y * size + x] === '1') {
          topY[x] = y
          break
        }
      }
    }
    let maxDist = 0
    for (let i = 0; i < size * size; i++) {
      if (hairs[i] === '1') {
        const x = i % size
        const y = Math.floor(i / size)
        const d = y - topY[x]
        dist[i] = d
        if (d > maxDist) maxDist = d
      }
    }
    if (maxDist > 0) {
      for (let i = 0; i < size * size; i++) {
        if (hairs[i] === '1') dist[i] /= maxDist
      }
    }
    distFromScalp.current = dist
  }, [hairs, size])

  // Main render + animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imgData = ctx.createImageData(size, size)
    const pal = PALETTES[palette] || PALETTES.mono
    const hairPal = HAIR_PALETTES[palette] || HAIR_PALETTES.mono
    const dist = distFromScalp.current
    const bg = bgMask.current
    const startTime = performance.now()

    function render(now?: number) {
      const d = imgData.data
      const t = animEnabled && now != null
        ? (now - startTime) / 1000 / animSpeed
        : 0

      for (let i = 0; i < size * size; i++) {
        const s = parseInt(shades[i])
        const isHair = hairs[i] === '1'
        const idx = i * 4

        // Background removal via flood-fill mask
        if (showSubjectOnly && bg && bg[i]) {
          d[idx] = 255
          d[idx + 1] = 255
          d[idx + 2] = 255
          d[idx + 3] = 255
          continue
        }

        let r: number, g: number, b: number

        if (isHair && animEnabled && dist) {
          const x = i % size
          const y = Math.floor(i / size)
          const distVal = dist[i]
          const ampFactor = distVal * distVal

          // Multi-layer waves + noise
          const wave1 = Math.sin(t * 6.28 + x * 0.12 - y * 0.03)
          const wave2 = Math.sin(t * 3.5 + x * 0.06 + y * 0.08) * 0.5
          const noiseVal = noise3D(x * 0.05, y * 0.05, t * 0.6) * 0.6
          const combined = (wave1 + wave2 + noiseVal) * ampFactor * animAmplitude

          const shadeShift = Math.round(combined)
          const newShade = Math.max(0, Math.min(5, s + shadeShift))
          ;[r, g, b] = hairPal[newShade]
        } else if (isHair) {
          ;[r, g, b] = hairPal[s]
        } else {
          ;[r, g, b] = pal[s]
        }

        d[idx] = r
        d[idx + 1] = g
        d[idx + 2] = b
        d[idx + 3] = 255
      }

      ctx.putImageData(imgData, 0, 0)

      if (animEnabled) {
        rafId.current = requestAnimationFrame(render)
      }
    }

    render(animEnabled ? performance.now() : undefined)

    return () => cancelAnimationFrame(rafId.current)
  }, [shades, hairs, size, palette, animEnabled, animSpeed, animAmplitude, showSubjectOnly])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pixel-canvas"
    />
  )
}
