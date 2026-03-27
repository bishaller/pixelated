import './Toolkit.css'

const styles = [
  { id: 'mono', label: 'Mono' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'neon', label: 'Neon' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'forest', label: 'Forest' },
  { id: 'inverted', label: 'Inverted' },
]

const densitySteps = [48, 96, 192, 384]

interface ToolkitProps {
  density: number
  onDensityChange: (d: number) => void
  palette: string
  onPaletteChange: (p: string) => void
  animEnabled: boolean
  onAnimToggle: () => void
  animSpeed: number
  onAnimSpeedChange: (s: number) => void
  animAmplitude: number
  onAnimAmplitudeChange: (a: number) => void
}

export function Toolkit({
  density,
  onDensityChange,
  palette,
  onPaletteChange,
  animEnabled,
  onAnimToggle,
  animSpeed,
  onAnimSpeedChange,
  animAmplitude,
  onAnimAmplitudeChange,
}: ToolkitProps) {
  const densityIndex = densitySteps.indexOf(density)

  return (
    <aside className="toolkit">
      <section className="tk-section">
        <h3 className="tk-heading">Density</h3>
        <input
          type="range"
          min={0}
          max={densitySteps.length - 1}
          step={1}
          value={densityIndex}
          onChange={e => onDensityChange(densitySteps[+e.target.value])}
          className="tk-slider"
        />
        <span className="tk-value">{density} × {density}</span>
      </section>

      <section className="tk-section">
        <h3 className="tk-heading">Style</h3>
        <div className="tk-palette-grid">
          {styles.map(s => (
            <button
              key={s.id}
              className={`tk-chip ${palette === s.id ? 'active' : ''}`}
              onClick={() => onPaletteChange(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="tk-section">
        <div className="tk-row">
          <h3 className="tk-heading">Hair Animation</h3>
          <button
            className={`tk-toggle ${animEnabled ? 'on' : ''}`}
            onClick={onAnimToggle}
          >
            {animEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {animEnabled && (
          <>
            <label className="tk-label">
              Speed
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.25}
                value={animSpeed}
                onChange={e => onAnimSpeedChange(+e.target.value)}
                className="tk-slider"
              />
              <span className="tk-value">{animSpeed}s</span>
            </label>

            <label className="tk-label">
              Amplitude
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.25}
                value={animAmplitude}
                onChange={e => onAnimAmplitudeChange(+e.target.value)}
                className="tk-slider"
              />
              <span className="tk-value">{animAmplitude}px</span>
            </label>
          </>
        )}
      </section>
    </aside>
  )
}
