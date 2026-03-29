import { useRef, useEffect, useState, useMemo } from 'react'
import { createNoise3D } from 'simplex-noise'
import { neonPixels48 } from './neonPixels'
import { grayPixels48, neonBg48 } from './grayPixels'
import { regions48 } from './regions'
import { editMask96 } from './editMask96'
import { neonPixels64, grayPixels64, neonBg64, regions64, neonPixels96, grayPixels96, neonBg96, regions96 } from './multiRes'
import { neonPixels128, grayPixels128, neonBg128, regions128 } from './multiRes128'
import './PixelV8.css'

const DENSITY_OPTIONS = [48, 64, 96, 128] as const
type Density = typeof DENSITY_OPTIONS[number]

const DATA: Record<Density, {
  neon: [number,number,number][][]
  gray: number[][]
  bg: number[][]
  regions: number[][]
}> = {
  48: { neon: neonPixels48, gray: grayPixels48, bg: neonBg48, regions: regions48 },
  64: { neon: neonPixels64, gray: grayPixels64, bg: neonBg64, regions: regions64 },
  96: { neon: neonPixels96, gray: grayPixels96, bg: neonBg96, regions: regions96 },
  128: { neon: neonPixels128, gray: grayPixels128, bg: neonBg128, regions: regions128 },
}
const noise3D = createNoise3D()

const PALETTES: { name: string; colors: [number, number, number][] }[] = [
  { name: 'Original', colors: [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]] },
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

type AnimType = 'none' | 'shimmer' | 'wave' | 'sparkle' | 'breathe' | 'rainbow' | 'flow'

const ANIM_OPTIONS: { id: AnimType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'shimmer', label: 'Shimmer' },
  { id: 'wave', label: 'Wave' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'breathe', label: 'Breathe' },
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'flow', label: 'Flow' },
]

type HoverType = 'none' | 'brighten' | 'flash' | 'paletteSwap' | 'spotlight' | 'invert' |
  'rainbow' | 'pop' | 'shrink' | 'roundMorph' | 'dissolve' | 'push' | 'pull' |
  'ripple' | 'vortex' | 'xray' | 'glowTrail' | 'paint'

const HOVER_OPTIONS: { id: HoverType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'brighten', label: 'Brighten' },
  { id: 'flash', label: 'Flash' },
  { id: 'paletteSwap', label: 'Palette Swap' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'invert', label: 'Invert' },
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'pop', label: 'Pop' },
  { id: 'shrink', label: 'Shrink' },
  { id: 'roundMorph', label: 'Round Morph' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'ripple', label: 'Ripple' },
  { id: 'vortex', label: 'Vortex' },
  { id: 'xray', label: 'X-Ray' },
  { id: 'glowTrail', label: 'Glow Trail' },
  { id: 'paint', label: 'Paint Trail' },
]

// Compute distance from edge for each subject pixel (0 = not subject, 1 = edge, 2 = 1px in, etc.)
function computeEdgeDistance(mask: Uint8Array, size: number): Uint8Array {
  const dist = new Uint8Array(size * size) // 0 = bg, 255 = unvisited subject
  const dirs = [-1, 1, -size, size]
  const queue: number[] = []

  // Mark all subject pixels as unvisited (255), find edge pixels (dist=1)
  for (let i = 0; i < size * size; i++) {
    if (!mask[i]) continue
    dist[i] = 255
    const x = i % size
    let isEdge = false
    for (const d of dirs) {
      const ni = i + d
      if (ni < 0 || ni >= size * size) { isEdge = true; continue }
      const nx = ni % size
      if (d === -1 && nx === size - 1) continue
      if (d === 1 && nx === 0) continue
      if (!mask[ni]) { isEdge = true; break }
    }
    if (isEdge) {
      dist[i] = 1
      queue.push(i)
    }
  }

  // BFS inward — each layer gets distance+1
  let head = 0
  while (head < queue.length) {
    const ci = queue[head++]
    const cx = ci % size
    const cd = dist[ci]
    for (const d of dirs) {
      const ni = ci + d
      if (ni < 0 || ni >= size * size) continue
      const nx = ni % size
      if (d === -1 && nx === size - 1) continue
      if (d === 1 && nx === 0) continue
      if (dist[ni] === 255) {
        dist[ni] = cd + 1
        queue.push(ni)
      }
    }
  }

  return dist
}

// Pre-compute distance from top of hair per pixel (for flow animation)
function computeHairDist(regions: number[][], size: number): number[][] {
  const dist: number[][] = Array.from({ length: size }, () => Array(size).fill(0))
  // Find topmost hair pixel per column
  const topY = Array(size).fill(size)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (regions[y][x] === 1) { topY[x] = y; break }
    }
  }
  let maxDist = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (regions[y][x] === 1) {
        const d = y - topY[x]
        dist[y][x] = d
        if (d > maxDist) maxDist = d
      }
    }
  }
  if (maxDist > 0) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (regions[y][x] === 1) dist[y][x] /= maxDist
      }
    }
  }
  return dist
}

function getSubjectBounds(bg: number[][], size: number) {
  let minX = size, maxX = 0, minY = size, maxY = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!bg[y][x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, maxX, minY, maxY }
}

// Apply animation effect to a pixel color
function applyAnim(
  r: number, g: number, b: number,
  x: number, y: number,
  t: number, speed: number,
  anim: AnimType,
): [number, number, number] {
  if (anim === 'none') return [r, g, b]

  const ts = t * speed

  if (anim === 'shimmer') {
    const wave = Math.sin(ts * 4 + x * 0.3 - y * 0.1)
    const n = noise3D(x * 0.08, y * 0.08, ts * 0.5) * 0.5
    const shift = (wave + n) * 40
    return [
      Math.max(0, Math.min(255, r + shift)),
      Math.max(0, Math.min(255, g + shift)),
      Math.max(0, Math.min(255, b + shift)),
    ]
  }

  if (anim === 'wave') {
    const wave = Math.sin(ts * 3 + x * 0.2) * 0.5 + Math.sin(ts * 2 + y * 0.15) * 0.5
    const shift = wave * 50
    return [
      Math.max(0, Math.min(255, r + shift)),
      Math.max(0, Math.min(255, g + shift * 0.6)),
      Math.max(0, Math.min(255, b + shift * 0.3)),
    ]
  }

  if (anim === 'sparkle') {
    const n = noise3D(x * 0.2, y * 0.2, ts * 2)
    if (n > 0.6) {
      const boost = (n - 0.6) * 400
      return [
        Math.min(255, r + boost),
        Math.min(255, g + boost),
        Math.min(255, b + boost),
      ]
    }
    return [r, g, b]
  }

  if (anim === 'breathe') {
    const pulse = Math.sin(ts * 2) * 0.3 + 1
    return [
      Math.max(0, Math.min(255, r * pulse)),
      Math.max(0, Math.min(255, g * pulse)),
      Math.max(0, Math.min(255, b * pulse)),
    ]
  }

  if (anim === 'rainbow') {
    const hueShift = (ts * 60 + x * 3 + y * 2) % 360
    const rad = hueShift * Math.PI / 180
    const cos = Math.cos(rad) * 0.3
    const sin = Math.sin(rad) * 0.3
    return [
      Math.max(0, Math.min(255, r + (sin * 120))),
      Math.max(0, Math.min(255, g + (cos * 120))),
      Math.max(0, Math.min(255, b + (-sin * 80))),
    ]
  }

  return [r, g, b]
}

interface PixelV8Props {
  hairMask: Uint8Array
  maskVersion: number
}

export function PixelV8({}: PixelV8Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  // Pixel edit mask: 1=visible, 0=deleted. Initialized per density.
  const editMask = useRef<Map<Density, Uint8Array>>(new Map())
  function getEditMask(den: Density): Uint8Array {
    if (!editMask.current.has(den)) {
      if (den === 96) {
        editMask.current.set(den, new Uint8Array(editMask96))
      } else {
        // Resample from the baked 96 mask using nearest-neighbor
        const srcSize = 96
        const mask = new Uint8Array(den * den)
        for (let y = 0; y < den; y++) {
          for (let x = 0; x < den; x++) {
            const sy = Math.min(Math.floor(y * srcSize / den), srcSize - 1)
            const sx = Math.min(Math.floor(x * srcSize / den), srcSize - 1)
            mask[y * den + x] = editMask96[sy * srcSize + sx]
          }
        }
        editMask.current.set(den, mask)
      }
    }
    return editMask.current.get(den)!
  }

  const [editTool, setEditTool] = useState<'none' | 'erase' | 'draw'>('none')
  const [editBrush, setEditBrush] = useState(1)
  const [editVersion, setEditVersion] = useState(0)
  const isPainting = useRef(false)
  const undoStack = useRef<Map<Density, Uint8Array[]>>(new Map())

  function pushUndo(den: Density) {
    if (!undoStack.current.has(den)) undoStack.current.set(den, [])
    const stack = undoStack.current.get(den)!
    const mask = getEditMask(den)
    stack.push(new Uint8Array(mask))
    if (stack.length > 50) stack.shift() // cap at 50
  }

  function popUndo(den: Density) {
    const stack = undoStack.current.get(den)
    if (!stack || stack.length === 0) return
    const prev = stack.pop()!
    editMask.current.set(den, prev)
    setEditVersion(v => v + 1)
  }

  const [density, setDensity] = useState<Density>(96)
  const [palIdx, setPalIdx] = useState(7)
  const [pixelSize, setPixelSize] = useState(20)
  const [gap, setGap] = useState(0)
  const [glow, setGlow] = useState(true)
  const [glowIntensity, setGlowIntensity] = useState(0.05)
  const [glowRadius, setGlowRadius] = useState(0.5)
  const [rounded, setRounded] = useState(false)
  const [brightnessThreshold, setBrightnessThreshold] = useState(0)

  // Edge sparkle (on by default)
  const [edgeSparkle, setEdgeSparkle] = useState(true)
  const [edgeSpeed, setEdgeSpeed] = useState(0.5)
  const [edgeIntensity, setEdgeIntensity] = useState(1.5)
  const [edgeDepth, setEdgeDepth] = useState(3)

  // Hover effect
  const [hoverType, setHoverType] = useState<HoverType>('none')
  const [hoverRadius, setHoverRadius] = useState(8)
  const [hoverIntensity, setHoverIntensity] = useState(1)
  const mousePos = useRef<{ x: number; y: number; active: boolean }>({ x: -999, y: -999, active: false })
  // Trail buffer: stores fading intensity per pixel
  const trailBuffer = useRef<Float32Array>(new Float32Array(96 * 96))

  // Per-region animations
  const [hairAnim, setHairAnim] = useState<AnimType>('none')
  const [hairSpeed, setHairSpeed] = useState(1)
  const [faceAnim, setFaceAnim] = useState<AnimType>('none')
  const [faceSpeed, setFaceSpeed] = useState(1)
  const [bodyAnim, setBodyAnim] = useState<AnimType>('none')
  const [bodySpeed, setBodySpeed] = useState(1)

  const dd = DATA[density]
  const bounds = useMemo(() => getSubjectBounds(dd.bg, density), [density, dd.bg])
  const hairDist = useMemo(() => computeHairDist(dd.regions, density), [density, dd.regions])
  const hairDistRef = useRef(hairDist)
  hairDistRef.current = hairDist

  // Store settings in ref so rAF reads latest without re-mounting
  const settingsRef = useRef({
    palIdx, pixelSize, gap, glow, glowIntensity, glowRadius, rounded, brightnessThreshold,
    hairAnim, hairSpeed, faceAnim, faceSpeed, bodyAnim, bodySpeed, density,
    hoverType, hoverRadius, hoverIntensity, edgeSparkle, edgeSpeed, edgeIntensity, edgeDepth,
  })
  settingsRef.current = {
    palIdx, pixelSize, gap, glow, glowIntensity, glowRadius, rounded, brightnessThreshold,
    hairAnim, hairSpeed, faceAnim, faceSpeed, bodyAnim, bodySpeed, density,
    hoverType, hoverRadius, hoverIntensity, edgeSparkle, edgeSpeed, edgeIntensity, edgeDepth,
  }

  const hasAnimation = hairAnim !== 'none' || faceAnim !== 'none' || bodyAnim !== 'none' || hoverType !== 'none' || edgeSparkle

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const startTime = performance.now()

    // Compute edge distance once when effect mounts
    const initMask = getEditMask(density)
    const edgeDist = computeEdgeDistance(initMask, density)

    function render(now: number) {
      const s = settingsRef.current
      const curData = DATA[s.density]
      const t = (now - startTime) / 1000
      const isOriginal = s.palIdx === 0
      const pal = PALETTES[s.palIdx].colors
      const totalPx = s.pixelSize + s.gap

      const cols = bounds.maxX - bounds.minX + 1
      const rows = bounds.maxY - bounds.minY + 1
      const canvasW = totalPx * cols
      const canvasH = totalPx * rows
      canvas.width = canvasW
      canvas.height = canvasH

      ctx.clearRect(0, 0, canvasW, canvasH)

      const mask = getEditMask(s.density as Density)

      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
          if (!mask[y * s.density + x]) continue

          let r: number, g: number, b: number

          if (isOriginal) {
            ;[r, g, b] = curData.neon[y][x]
          } else {
            const shade = curData.gray[y][x]
            ;[r, g, b] = pal[shade]
          }

          if (r + g + b < s.brightnessThreshold) continue

          // Per-region animation
          const region = curData.regions[y][x]
          if (region === 1) {
            ;[r, g, b] = applyAnim(r, g, b, x, y, t, s.hairSpeed, s.hairAnim)
          } else if (region === 2) {
            ;[r, g, b] = applyAnim(r, g, b, x, y, t, s.faceSpeed, s.faceAnim)
          } else if (region === 3) {
            ;[r, g, b] = applyAnim(r, g, b, x, y, t, s.bodySpeed, s.bodyAnim)
          }

          let px = (x - bounds.minX) * totalPx
          let py = (y - bounds.minY) * totalPx

          // Flow: position displacement for hair
          if (region === 1 && s.hairAnim === 'flow') {
            const dist = hairDistRef.current[y]?.[x] ?? 0
            const amp = dist * dist // quadratic: tips move way more than roots
            const ts = t * s.hairSpeed

            // Multi-layer sine for natural sway
            const wave1 = Math.sin(ts * 3.5 + x * 0.15 - y * 0.05) * 0.7
            const wave2 = Math.sin(ts * 2.2 + x * 0.08 + y * 0.1) * 0.3
            const n = noise3D(x * 0.06, y * 0.06, ts * 0.4) * 0.4

            const dx = (wave1 + wave2 + n) * amp * s.pixelSize * 1.5
            const dy = (wave2 * 0.4 + n * 0.3) * amp * s.pixelSize * 0.6

            px += dx
            py += dy
          }

          // Edge sparkle — twinkle with depth control
          const eDist = edgeDist[y * s.density + x]
          if (s.edgeSparkle && eDist > 0 && eDist <= s.edgeDepth) {
            const falloff = 1 - (eDist - 1) / s.edgeDepth
            const ts = t * s.edgeSpeed
            // Hash position into a well-distributed random phase and frequency
            let h = (x * 374761393 + y * 668265263) | 0
            h = ((h ^ (h >> 13)) * 1274126177) | 0
            h = (h ^ (h >> 16)) | 0
            const phase = (h & 0xffff) / 0xffff * 6.28        // 0 to 2π
            const freqVar = 0.7 + ((h >> 16) & 0xff) / 255 * 0.6 // 0.7 to 1.3
            const blink = Math.sin(ts * 2 * freqVar + phase) * 0.5 + 0.5
            if (blink > 0.75) {
              const strength = (blink - 0.75) / 0.25
              const boost = strength * 170 * falloff * s.edgeIntensity
              r = Math.min(255, r + boost)
              g = Math.min(255, g + boost)
              b = Math.min(255, b + boost)
            }
          }

          // Hover effects
          let pixSize = s.pixelSize
          let useRound = s.rounded
          let skipPixel = false
          if (s.hoverType !== 'none' && mousePos.current.active) {
            const mx = mousePos.current.x
            const my = mousePos.current.y
            const dxH = x - mx
            const dyH = y - my
            const distH = Math.sqrt(dxH * dxH + dyH * dyH)
            const radius = s.hoverRadius
            const inRange = distH < radius
            const falloff = inRange ? 1 - distH / radius : 0
            const intensity = falloff * s.hoverIntensity

            // Update trail buffer
            if (inRange && (s.hoverType === 'glowTrail' || s.hoverType === 'paint')) {
              const ti = y * s.density + x
              trailBuffer.current[ti] = Math.min(1, trailBuffer.current[ti] + 0.15)
            }
            const trailVal = trailBuffer.current[y * s.density + x]

            if (s.hoverType === 'brighten' && inRange) {
              const boost = intensity * 120
              r = Math.min(255, r + boost)
              g = Math.min(255, g + boost)
              b = Math.min(255, b + boost)
            } else if (s.hoverType === 'flash' && inRange) {
              const boost = intensity * 200
              r = Math.min(255, r + boost)
              g = Math.min(255, g + boost)
              b = Math.min(255, b + boost)
            } else if (s.hoverType === 'paletteSwap' && inRange) {
              const altPalIdx = (s.palIdx + 1) % PALETTES.length
              const altPal = PALETTES[altPalIdx].colors
              const shade = curData.gray[y][x]
              const [ar, ag, ab] = altPal[shade]
              r = r + (ar - r) * intensity
              g = g + (ag - g) * intensity
              b = b + (ab - b) * intensity
            } else if (s.hoverType === 'spotlight') {
              if (!inRange) {
                r *= 0.3; g *= 0.3; b *= 0.3
              }
            } else if (s.hoverType === 'invert' && inRange) {
              r = r + (255 - 2 * r) * intensity
              g = g + (255 - 2 * g) * intensity
              b = b + (255 - 2 * b) * intensity
            } else if (s.hoverType === 'rainbow' && inRange) {
              const hue = (t * 200 + distH * 20) % 360
              const rad = hue * Math.PI / 180
              r = Math.min(255, Math.max(0, r + Math.sin(rad) * 100 * intensity))
              g = Math.min(255, Math.max(0, g + Math.sin(rad + 2.09) * 100 * intensity))
              b = Math.min(255, Math.max(0, b + Math.sin(rad + 4.19) * 100 * intensity))
            } else if (s.hoverType === 'pop' && inRange) {
              pixSize = s.pixelSize * (1 + intensity * 0.6)
            } else if (s.hoverType === 'shrink' && inRange) {
              pixSize = s.pixelSize * (1 - intensity * 0.5)
            } else if (s.hoverType === 'roundMorph' && inRange) {
              useRound = !s.rounded
            } else if (s.hoverType === 'dissolve' && inRange) {
              if (Math.random() < intensity * 0.7) skipPixel = true
            } else if (s.hoverType === 'push' && inRange && distH > 0) {
              const force = intensity * s.pixelSize * 2
              px += (dxH / distH) * force
              py += (dyH / distH) * force
            } else if (s.hoverType === 'pull' && inRange && distH > 0) {
              const force = intensity * s.pixelSize * 1.5
              px -= (dxH / distH) * force
              py -= (dyH / distH) * force
            } else if (s.hoverType === 'ripple' && inRange) {
              const wave = Math.sin(distH * 1.5 - t * 8) * intensity * s.pixelSize * 0.8
              px += (dxH / (distH || 1)) * wave
              py += (dyH / (distH || 1)) * wave
            } else if (s.hoverType === 'vortex' && inRange && distH > 0) {
              const angle = intensity * 1.5
              const cos = Math.cos(angle)
              const sin = Math.sin(angle)
              const ndx = dxH * cos - dyH * sin
              const ndy = dxH * sin + dyH * cos
              const force = intensity * s.pixelSize
              px += (ndx - dxH) * force * 0.3
              py += (ndy - dyH) * force * 0.3
            } else if (s.hoverType === 'xray' && inRange) {
              const [nr, ng, nb] = curData.neon[y][x]
              r = r + (nr - r) * intensity
              g = g + (ng - g) * intensity
              b = b + (nb - b) * intensity
            } else if (s.hoverType === 'glowTrail' && trailVal > 0) {
              const boost = trailVal * 150
              r = Math.min(255, r + boost)
              g = Math.min(255, g + boost)
              b = Math.min(255, b + boost * 0.5)
            } else if (s.hoverType === 'paint' && trailVal > 0) {
              const hue = (y * 5 + x * 3 + t * 50) % 360
              const rad = hue * Math.PI / 180
              r = Math.min(255, Math.max(0, r + Math.sin(rad) * trailVal * 100))
              g = Math.min(255, Math.max(0, g + Math.sin(rad + 2.09) * trailVal * 100))
              b = Math.min(255, Math.max(0, b + Math.sin(rad + 4.19) * trailVal * 100))
            }
          }

          if (skipPixel) continue

          // Decay trail
          const ti = y * s.density + x
          if (trailBuffer.current[ti] > 0) trailBuffer.current[ti] *= 0.97

          if (s.glow && r + g + b > 150) {
            const gs = s.pixelSize * s.glowRadius
            const gradient = ctx.createRadialGradient(
              px + s.pixelSize / 2, py + s.pixelSize / 2, 0,
              px + s.pixelSize / 2, py + s.pixelSize / 2, gs
            )
            gradient.addColorStop(0, `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)},${s.glowIntensity})`)
            gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
            ctx.fillStyle = gradient
            ctx.fillRect(px - gs / 2, py - gs / 2, gs * 2, gs * 2)
          }

          ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
          if (useRound) {
            ctx.beginPath()
            ctx.arc(px + pixSize / 2, py + pixSize / 2, pixSize / 2, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.fillRect(px, py, pixSize, pixSize)
          }
        }
      }

      if (s.hairAnim !== 'none' || s.faceAnim !== 'none' || s.bodyAnim !== 'none' || s.hoverType !== 'none' || s.edgeSparkle) {
        rafRef.current = requestAnimationFrame(render)
      }
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [bounds, hasAnimation, palIdx, pixelSize, gap, glow, glowIntensity, glowRadius, rounded, brightnessThreshold, density, editVersion, edgeSparkle])

  const paintAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editTool === 'none') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const totalPx = pixelSize + gap
    const cx = Math.floor(((e.clientX - rect.left) * scaleX) / totalPx) + bounds.minX
    const cy = Math.floor(((e.clientY - rect.top) * scaleY) / totalPx) + bounds.minY
    const mask = getEditMask(density)
    const val = editTool === 'erase' ? 0 : 1
    const br = editBrush - 1 // brush=1 means 0 radius (single pixel)
    if (br === 0) {
      if (cx >= 0 && cx < density && cy >= 0 && cy < density) {
        mask[cy * density + cx] = val
      }
    } else {
      for (let dy = -br; dy <= br; dy++) {
        for (let dx = -br; dx <= br; dx++) {
          if (dx * dx + dy * dy > br * br) continue
          const px = cx + dx
          const py = cy + dy
          if (px >= 0 && px < density && py >= 0 && py < density) {
            mask[py * density + px] = val
          }
        }
      }
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editTool === 'none') return
    pushUndo(density) // save state before painting
    isPainting.current = true
    paintAt(e)
    setEditVersion(v => v + 1)
  }
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPainting.current) {
      paintAt(e)
      setEditVersion(v => v + 1)
    }
    // Track mouse for hover effects
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const totalPx = pixelSize + gap
    mousePos.current.x = Math.floor(((e.clientX - rect.left) * scaleX) / totalPx) + bounds.minX
    mousePos.current.y = Math.floor(((e.clientY - rect.top) * scaleY) / totalPx) + bounds.minY
    mousePos.current.active = true
  }
  const onMouseUp = () => { isPainting.current = false }
  const onMouseLeave = () => { isPainting.current = false; mousePos.current.active = false }

  const resetEdit = () => {
    editMask.current.delete(density)
    getEditMask(density)
    setEditVersion(v => v + 1)
  }

  return (
    <div className="v8-layout">
      <div className="v8-canvas-wrap">
        <canvas
          ref={canvasRef}
          className={`v8-canvas ${editTool !== 'none' ? 'v8-editing' : ''}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>

      <aside className="v8-sidebar">
        <div className="v8-section">
          <span className="v8-heading">Density</span>
          <div className="v8-btn-row">
            {DENSITY_OPTIONS.map(d => (
              <button key={d} className={`v8-btn ${density === d ? 'active' : ''}`}
                onClick={() => setDensity(d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="v8-section">
          <span className="v8-heading">Palette</span>
          <div className="v8-btn-wrap">
            {PALETTES.map((p, i) => (
              <button key={i} className={`v8-btn ${palIdx === i ? 'active' : ''}`}
                onClick={() => setPalIdx(i)}>{p.name}</button>
            ))}
          </div>
        </div>

        <div className="v8-section">
          <span className="v8-heading">Pixel</span>
          <label className="v8-label">
            Size
            <input type="range" min={4} max={20} value={pixelSize}
              onChange={e => setPixelSize(+e.target.value)} className="v8-slider" />
            <span className="v8-value">{pixelSize}px</span>
          </label>
          <label className="v8-label">
            Gap
            <input type="range" min={0} max={6} value={gap}
              onChange={e => setGap(+e.target.value)} className="v8-slider" />
            <span className="v8-value">{gap}px</span>
          </label>
          <label className="v8-label">
            Shape
            <div className="v8-btn-row">
              <button className={`v8-btn ${!rounded ? 'active' : ''}`}
                onClick={() => setRounded(false)}>Square</button>
              <button className={`v8-btn ${rounded ? 'active' : ''}`}
                onClick={() => setRounded(true)}>Round</button>
            </div>
          </label>
        </div>

        <div className="v8-section">
          <span className="v8-heading">Glow</span>
          <div className="v8-btn-row">
            <button className={`v8-btn ${glow ? 'active' : ''}`}
              onClick={() => setGlow(g => !g)}>{glow ? 'ON' : 'OFF'}</button>
          </div>
          {glow && (
            <>
              <label className="v8-label">
                Intensity
                <input type="range" min={0.05} max={0.6} step={0.05} value={glowIntensity}
                  onChange={e => setGlowIntensity(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{glowIntensity.toFixed(2)}</span>
              </label>
              <label className="v8-label">
                Radius
                <input type="range" min={0.5} max={4} step={0.1} value={glowRadius}
                  onChange={e => setGlowRadius(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{glowRadius.toFixed(1)}x</span>
              </label>
            </>
          )}
        </div>

        <div className="v8-section">
          <span className="v8-heading">Brightness Cutoff</span>
          <input type="range" min={0} max={200} value={brightnessThreshold}
            onChange={e => setBrightnessThreshold(+e.target.value)} className="v8-slider" />
          <span className="v8-value">{brightnessThreshold}</span>
        </div>

        <div className="v8-section">
          <span className="v8-heading">Edit Pixels</span>
          <div className="v8-btn-wrap">
            <button className={`v8-btn ${editTool === 'none' ? 'active' : ''}`}
              onClick={() => setEditTool('none')}>Off</button>
            <button className={`v8-btn ${editTool === 'erase' ? 'active' : ''}`}
              onClick={() => setEditTool('erase')}>Erase</button>
            <button className={`v8-btn ${editTool === 'draw' ? 'active' : ''}`}
              onClick={() => setEditTool('draw')}>Draw</button>
          </div>
          {editTool !== 'none' && (
            <>
              <label className="v8-label">
                Brush
                <input type="range" min={1} max={5} value={editBrush}
                  onChange={e => setEditBrush(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{editBrush}px</span>
              </label>
              <div className="v8-btn-row">
                <button className="v8-btn" onClick={() => popUndo(density)}>Undo</button>
                <button className="v8-btn" onClick={resetEdit}>Reset</button>
              </div>
              <button className="v8-btn" onClick={() => {
                const mask = getEditMask(density)
                const rows: string[] = []
                for (let y = 0; y < density; y++) {
                  rows.push('[' + Array.from(mask.slice(y * density, (y + 1) * density)).join(',') + ']')
                }
                const text = '[\n' + rows.join(',\n') + '\n]'
                navigator.clipboard.writeText(text).then(() => alert('Mask copied to clipboard! Paste it to Claude.'))
              }}>Export Mask</button>
            </>
          )}
        </div>

        <div className="v8-section">
          <span className="v8-heading">Hair Animation</span>
          <div className="v8-btn-wrap">
            {ANIM_OPTIONS.map(a => (
              <button key={a.id} className={`v8-btn ${hairAnim === a.id ? 'active' : ''}`}
                onClick={() => setHairAnim(a.id)}>{a.label}</button>
            ))}
          </div>
          {hairAnim !== 'none' && (
            <label className="v8-label">
              Speed
              <input type="range" min={0.2} max={3} step={0.1} value={hairSpeed}
                onChange={e => setHairSpeed(+e.target.value)} className="v8-slider" />
              <span className="v8-value">{hairSpeed.toFixed(1)}x</span>
            </label>
          )}
        </div>

        <div className="v8-section">
          <span className="v8-heading">Face Animation</span>
          <div className="v8-btn-wrap">
            {ANIM_OPTIONS.map(a => (
              <button key={a.id} className={`v8-btn ${faceAnim === a.id ? 'active' : ''}`}
                onClick={() => setFaceAnim(a.id)}>{a.label}</button>
            ))}
          </div>
          {faceAnim !== 'none' && (
            <label className="v8-label">
              Speed
              <input type="range" min={0.2} max={3} step={0.1} value={faceSpeed}
                onChange={e => setFaceSpeed(+e.target.value)} className="v8-slider" />
              <span className="v8-value">{faceSpeed.toFixed(1)}x</span>
            </label>
          )}
        </div>

        <div className="v8-section">
          <span className="v8-heading">Body Animation</span>
          <div className="v8-btn-wrap">
            {ANIM_OPTIONS.map(a => (
              <button key={a.id} className={`v8-btn ${bodyAnim === a.id ? 'active' : ''}`}
                onClick={() => setBodyAnim(a.id)}>{a.label}</button>
            ))}
          </div>
          {bodyAnim !== 'none' && (
            <label className="v8-label">
              Speed
              <input type="range" min={0.2} max={3} step={0.1} value={bodySpeed}
                onChange={e => setBodySpeed(+e.target.value)} className="v8-slider" />
              <span className="v8-value">{bodySpeed.toFixed(1)}x</span>
            </label>
          )}
        </div>

        <div className="v8-section">
          <span className="v8-heading">Edge Sparkle</span>
          <div className="v8-btn-row">
            <button className={`v8-btn ${edgeSparkle ? 'active' : ''}`}
              onClick={() => setEdgeSparkle(e => !e)}>{edgeSparkle ? 'ON' : 'OFF'}</button>
          </div>
          {edgeSparkle && (
            <>
              <label className="v8-label">
                Speed
                <input type="range" min={0.05} max={4} step={0.05} value={edgeSpeed}
                  onChange={e => setEdgeSpeed(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{edgeSpeed.toFixed(2)}x</span>
              </label>
              <label className="v8-label">
                Intensity
                <input type="range" min={0.1} max={2} step={0.1} value={edgeIntensity}
                  onChange={e => setEdgeIntensity(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{edgeIntensity.toFixed(1)}x</span>
              </label>
              <label className="v8-label">
                Depth
                <input type="range" min={1} max={20} value={edgeDepth}
                  onChange={e => setEdgeDepth(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{edgeDepth}px</span>
              </label>
            </>
          )}
        </div>

        <div className="v8-section">
          <span className="v8-heading">Hover Effect</span>
          <div className="v8-btn-wrap">
            {HOVER_OPTIONS.map(h => (
              <button key={h.id} className={`v8-btn ${hoverType === h.id ? 'active' : ''}`}
                onClick={() => setHoverType(h.id)}>{h.label}</button>
            ))}
          </div>
          {hoverType !== 'none' && (
            <>
              <label className="v8-label">
                Radius
                <input type="range" min={2} max={30} value={hoverRadius}
                  onChange={e => setHoverRadius(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{hoverRadius}px</span>
              </label>
              <label className="v8-label">
                Intensity
                <input type="range" min={0.1} max={2} step={0.1} value={hoverIntensity}
                  onChange={e => setHoverIntensity(+e.target.value)} className="v8-slider" />
                <span className="v8-value">{hoverIntensity.toFixed(1)}x</span>
              </label>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
