import { useState, useMemo, useRef } from 'react'
import { pixels } from './pixels'
import { pixelsV2 } from './pixelsV2'
import { computeMask } from './mask'
import { allShades, allHairs, hairs384 } from './canvasData'
import { PixelCanvas } from './PixelCanvas'
import { Toolkit } from './Toolkit'
import { PixelV5 } from './PixelV5'
import { PixelV6 } from './PixelV6'
import { PixelV7 } from './PixelV7'
import { PixelV8 } from './PixelV8'
import './App.css'

const SHADES = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'] as const

const SIZE = 384

const styles = [
  { id: 'mono', label: 'Mono' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'neon', label: 'Neon' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'forest', label: 'Forest' },
  { id: 'inverted', label: 'Inverted' },
]

const versions = [
  { id: 1, label: 'Version 1', description: 'Original' },
  { id: 2, label: 'Version 2', description: 'Subject only' },
  { id: 3, label: 'Version 3', description: 'Artistic' },
  { id: 4, label: 'Version 4', description: 'Toolkit' },
  { id: 5, label: 'Version 5', description: 'Hair mask' },
  { id: 6, label: 'Version 6', description: 'Particles' },
  { id: 7, label: 'Version 7', description: 'Pixel icons' },
  { id: 8, label: 'Version 8', description: 'Animated' },
]

function initHairMask(): Uint8Array {
  const mask = new Uint8Array(SIZE * SIZE)
  for (let i = 0; i < SIZE * SIZE; i++) {
    mask[i] = hairs384[i] === '1' ? 1 : 0
  }
  return mask
}

function App() {
  const [selected, setSelected] = useState(1)
  const [v3Style, setV3Style] = useState('mono')

  // Shared hair mask — edited in V5, read by V4 and V6
  const hairMask = useRef<Uint8Array>(initHairMask())
  // Bump this to force V4/V6 to re-read the mask
  const [maskVersion, setMaskVersion] = useState(0)
  const onMaskChange = () => setMaskVersion(v => v + 1)

  // V4 state
  const [density, setDensity] = useState(192)
  const [v4Palette, setV4Palette] = useState('mono')
  const [animEnabled, setAnimEnabled] = useState(false)
  const [animSpeed, setAnimSpeed] = useState(3)
  const [animAmplitude, setAnimAmplitude] = useState(1.5)

  // V2/V3 mask (192×192)
  const maskV2 = useMemo(() => computeMask(pixelsV2), [])

  return (
    <div className="app-layout">
      <nav className="sidebar">
        {versions.map(v => (
          <button
            key={v.id}
            className={`sidebar-item ${selected === v.id ? 'active' : ''}`}
            onClick={() => setSelected(v.id)}
          >
            <span className="sidebar-label">{v.label}</span>
            <span className="sidebar-desc">{v.description}</span>
          </button>
        ))}

        {selected === 3 && (
          <div className="style-picker">
            {styles.map(s => (
              <button
                key={s.id}
                className={`style-chip ${v3Style === s.id ? 'active' : ''}`}
                onClick={() => setV3Style(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className="main">
        {selected === 1 && (
          <div className="pixel-grid v1">
            {pixels.map((row, y) =>
              row.map((val, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`px ${SHADES[val]}`}
                />
              ))
            )}
          </div>
        )}

        {selected === 2 && (
          <div className="pixel-grid v2">
            {pixelsV2.map((row, y) =>
              row.map((val, x) => {
                const isBg = !maskV2[y][x]
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`px ${isBg ? 'bg' : SHADES[val]}`}
                  />
                )
              })
            )}
          </div>
        )}

        {selected === 3 && (
          <div className={`pixel-grid v3 palette-${v3Style}`}>
            {pixelsV2.map((row, y) =>
              row.map((val, x) => {
                const isBg = !maskV2[y][x]
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`px ${isBg ? 'bg' : SHADES[val]}`}
                  />
                )
              })
            )}
          </div>
        )}

        {selected === 8 && (
          <PixelV8 hairMask={hairMask.current} maskVersion={maskVersion} />
        )}

        {selected === 7 && (
          <PixelV7 hairMask={hairMask.current} maskVersion={maskVersion} />
        )}

        {selected === 6 && (
          <PixelV6 hairMask={hairMask.current} maskVersion={maskVersion} />
        )}

        {selected === 5 && (
          <PixelV5 hairMask={hairMask.current} onMaskChange={onMaskChange} />
        )}

        {selected === 4 && (
          <PixelCanvas
            shades={allShades[density]}
            hairs={allHairs[density]}
            hairMask={hairMask.current}
            maskVersion={maskVersion}
            size={density}
            palette={v4Palette}
            animEnabled={animEnabled}
            animSpeed={animSpeed}
            animAmplitude={animAmplitude}
            showSubjectOnly={true}
          />
        )}
      </main>

      {selected === 4 && (
        <Toolkit
          density={density}
          onDensityChange={setDensity}
          palette={v4Palette}
          onPaletteChange={setV4Palette}
          animEnabled={animEnabled}
          onAnimToggle={() => setAnimEnabled(e => !e)}
          animSpeed={animSpeed}
          onAnimSpeedChange={setAnimSpeed}
          animAmplitude={animAmplitude}
          onAnimAmplitudeChange={setAnimAmplitude}
        />
      )}
    </div>
  )
}

export default App
