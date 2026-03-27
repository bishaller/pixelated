import { useState, useMemo } from 'react'
import { pixels } from './pixels'
import { pixelsV2 } from './pixelsV2'
import { computeMask } from './mask'
import { allShades, allHairs } from './canvasData'
import { PixelCanvas } from './PixelCanvas'
import { Toolkit } from './Toolkit'
import './App.css'

const SHADES = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'] as const

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
]

function App() {
  const [selected, setSelected] = useState(1)
  const [v3Style, setV3Style] = useState('mono')

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

        {selected === 4 && (
          <PixelCanvas
            shades={allShades[density]}
            hairs={allHairs[density]}
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
