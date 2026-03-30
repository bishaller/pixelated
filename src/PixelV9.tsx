import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { neonPixels128, grayPixels128, neonBg128, regions128 } from './multiRes128'
import { editMask96 } from './editMask96'
import './PixelV9.css'

const SIZE = 128
const PALETTES: { name: string; colors: [number, number, number][] }[] = [
  { name: 'Magenta Gold', colors: [[68,0,51],[153,0,119],[238,0,153],[255,119,0],[255,187,0],[255,255,119]] },
]

// Resample 96 edit mask to 128
function getSubjectMask(): Uint8Array {
  const mask = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const sy = Math.min(Math.floor(y * 96 / SIZE), 95)
      const sx = Math.min(Math.floor(x * 96 / SIZE), 95)
      mask[y * SIZE + x] = editMask96[sy * 96 + sx]
    }
  }
  return mask
}

// Cell states
const COVERED = 0
const REVEALED = 1
const FLAGGED = 2

interface GameState {
  cells: Uint8Array       // 0=covered, 1=revealed, 2=flagged
  mines: Uint8Array       // 1=mine
  counts: Uint8Array      // neighbor mine count
  subjectMask: Uint8Array
  totalSafe: number
  revealedSafe: number
  gameOver: boolean
  won: boolean
  mineCount: number
}

function initGame(minePercent: number): GameState {
  const subjectMask = getSubjectMask()
  const cells = new Uint8Array(SIZE * SIZE)
  const mines = new Uint8Array(SIZE * SIZE)
  const counts = new Uint8Array(SIZE * SIZE)

  // Count subject pixels
  const subjectPixels: number[] = []
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (subjectMask[i]) subjectPixels.push(i)
  }

  // Place mines randomly on subject pixels
  const mineCount = Math.floor(subjectPixels.length * minePercent)
  const shuffled = [...subjectPixels].sort(() => Math.random() - 0.5)
  for (let i = 0; i < mineCount; i++) {
    mines[shuffled[i]] = 1
  }

  // Compute neighbor counts
  const dirs = [-1, 1, -SIZE, SIZE, -SIZE - 1, -SIZE + 1, SIZE - 1, SIZE + 1]
  for (let i = 0; i < SIZE * SIZE; i++) {
    if (!subjectMask[i]) continue
    let count = 0
    const x = i % SIZE
    for (const d of dirs) {
      const ni = i + d
      if (ni < 0 || ni >= SIZE * SIZE) continue
      const nx = ni % SIZE
      if (Math.abs(nx - x) > 1) continue
      if (mines[ni]) count++
    }
    counts[i] = count
  }

  return {
    cells,
    mines,
    counts,
    subjectMask,
    totalSafe: subjectPixels.length - mineCount,
    revealedSafe: 0,
    gameOver: false,
    won: false,
    mineCount,
  }
}

function floodReveal(game: GameState, startIdx: number) {
  const queue = [startIdx]
  const dirs = [-1, 1, -SIZE, SIZE, -SIZE - 1, -SIZE + 1, SIZE - 1, SIZE + 1]

  while (queue.length > 0) {
    const i = queue.pop()!
    if (game.cells[i] === REVEALED) continue
    if (!game.subjectMask[i]) continue

    game.cells[i] = REVEALED
    if (!game.mines[i]) game.revealedSafe++

    // If count is 0, flood to neighbors
    if (game.counts[i] === 0 && !game.mines[i]) {
      const x = i % SIZE
      for (const d of dirs) {
        const ni = i + d
        if (ni < 0 || ni >= SIZE * SIZE) continue
        const nx = ni % SIZE
        if (Math.abs(nx - x) > 1) continue
        if (game.cells[ni] === COVERED && game.subjectMask[ni]) {
          queue.push(ni)
        }
      }
    }
  }
}

// Number colors for mine counts
const COUNT_COLORS: [number, number, number][] = [
  [0, 0, 0],         // 0 — not shown
  [100, 180, 255],    // 1 — blue
  [80, 200, 80],      // 2 — green
  [255, 80, 80],      // 3 — red
  [180, 80, 255],     // 4 — purple
  [255, 160, 0],      // 5 — orange
  [0, 200, 200],      // 6 — cyan
  [255, 255, 100],    // 7 — yellow
  [255, 100, 200],    // 8 — pink
]

interface PixelV9Props {
  hairMask: Uint8Array
  maskVersion: number
}

export function PixelV9({}: PixelV9Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState(() => initGame(0.15))
  const [pixelSize, setPixelSize] = useState(8)
  const [minePercent, setMinePercent] = useState(0.15)
  const [showCounts, setShowCounts] = useState(true)

  const bounds = useMemo(() => {
    let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (game.subjectMask[y * SIZE + x]) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    return { minX, maxX, minY, maxY }
  }, [game.subjectMask])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const px = pixelSize
    const cols = bounds.maxX - bounds.minX + 1
    const rows = bounds.maxY - bounds.minY + 1
    canvas.width = px * cols
    canvas.height = px * rows
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const pal = PALETTES[0].colors

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const i = y * SIZE + x
        if (!game.subjectMask[i]) continue

        const cx = (x - bounds.minX) * px
        const cy = (y - bounds.minY) * px
        const cellState = game.cells[i]

        if (cellState === REVEALED) {
          // Show portrait color
          const shade = grayPixels128[y][x]
          const [r, g, b] = pal[shade]
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(cx, cy, px, px)

          // Mine = show X
          if (game.mines[i]) {
            ctx.fillStyle = 'rgba(255,0,0,0.8)'
            ctx.fillRect(cx, cy, px, px)
            ctx.fillStyle = '#fff'
            ctx.font = `${px * 0.7}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('×', cx + px / 2, cy + px / 2)
          } else if (showCounts && game.counts[i] > 0) {
            // Show count number
            const [cr, cg, cb] = COUNT_COLORS[game.counts[i]] || [255, 255, 255]
            ctx.fillStyle = `rgb(${cr},${cg},${cb})`
            ctx.font = `bold ${px * 0.6}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(String(game.counts[i]), cx + px / 2, cy + px / 2 + 1)
          }
        } else if (cellState === FLAGGED) {
          // Flagged — dark with flag marker
          ctx.fillStyle = '#2a1a3a'
          ctx.fillRect(cx, cy, px, px)
          ctx.fillStyle = '#ff4466'
          ctx.font = `${px * 0.6}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('⚑', cx + px / 2, cy + px / 2)
        } else {
          // Covered — dark tile with subtle border
          ctx.fillStyle = '#1e1030'
          ctx.fillRect(cx, cy, px, px)
          ctx.fillStyle = '#2a1a42'
          ctx.fillRect(cx + 1, cy + 1, px - 2, px - 2)
        }
      }
    }

    // Win/lose overlay
    if (game.won) {
      ctx.fillStyle = 'rgba(0,255,100,0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    if (game.gameOver && !game.won) {
      ctx.fillStyle = 'rgba(255,0,0,0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [game, pixelSize, bounds, showCounts])

  useEffect(() => { render() }, [render])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (game.gameOver) return
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / pixelSize) + bounds.minX
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / pixelSize) + bounds.minY
    const idx = gy * SIZE + gx
    if (!game.subjectMask[idx] || game.cells[idx] !== COVERED) return

    const newGame = { ...game }

    if (newGame.mines[idx]) {
      // Hit a mine — reveal all mines
      newGame.gameOver = true
      for (let i = 0; i < SIZE * SIZE; i++) {
        if (newGame.mines[i]) newGame.cells[i] = REVEALED
      }
    } else {
      floodReveal(newGame, idx)
      if (newGame.revealedSafe >= newGame.totalSafe) {
        newGame.won = true
        newGame.gameOver = true
      }
    }
    setGame(newGame)
  }

  const handleRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (game.gameOver) return
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / pixelSize) + bounds.minX
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / pixelSize) + bounds.minY
    const idx = gy * SIZE + gx
    if (!game.subjectMask[idx] || game.cells[idx] === REVEALED) return

    const newGame = { ...game }
    newGame.cells[idx] = newGame.cells[idx] === FLAGGED ? COVERED : FLAGGED
    setGame(newGame)
  }

  const newGame = () => setGame(initGame(minePercent))

  const flagCount = useMemo(() => {
    let c = 0
    for (let i = 0; i < SIZE * SIZE; i++) if (game.cells[i] === FLAGGED) c++
    return c
  }, [game])

  return (
    <div className="v9-layout">
      <div className="v9-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="v9-canvas"
          onClick={handleClick}
          onContextMenu={handleRightClick}
        />
      </div>

      <aside className="v9-sidebar">
        <div className="v9-section">
          <span className="v9-heading">Minesweeper</span>
          <div className="v9-stats">
            <span>Mines: {game.mineCount - flagCount}</span>
            <span>Revealed: {game.revealedSafe}/{game.totalSafe}</span>
          </div>
          {game.won && <span className="v9-win">YOU WIN!</span>}
          {game.gameOver && !game.won && <span className="v9-lose">GAME OVER</span>}
          <button className="v9-btn" onClick={newGame}>New Game</button>
        </div>

        <div className="v9-section">
          <span className="v9-heading">Settings</span>
          <label className="v9-label">
            Pixel Size
            <input type="range" min={4} max={14} value={pixelSize}
              onChange={e => setPixelSize(+e.target.value)} className="v9-slider" />
            <span className="v9-value">{pixelSize}px</span>
          </label>
          <label className="v9-label">
            Mine Density
            <input type="range" min={0.05} max={0.3} step={0.01} value={minePercent}
              onChange={e => setMinePercent(+e.target.value)} className="v9-slider" />
            <span className="v9-value">{Math.round(minePercent * 100)}%</span>
          </label>
          <label className="v9-label">
            Show Numbers
            <div className="v9-btn-row">
              <button className={`v9-btn ${showCounts ? 'active' : ''}`}
                onClick={() => setShowCounts(c => !c)}>{showCounts ? 'ON' : 'OFF'}</button>
            </div>
          </label>
        </div>

        <div className="v9-section">
          <span className="v9-heading">Controls</span>
          <span className="v9-hint">Left click: Reveal</span>
          <span className="v9-hint">Right click: Flag</span>
        </div>
      </aside>
    </div>
  )
}
