import { pixels } from './pixels'
import './App.css'

const SHADES = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'] as const

function App() {
  return (
    <div className="pixel-grid">
      {pixels.map((row, y) =>
        row.map((val, x) => (
          <div
            key={`${x}-${y}`}
            className={`px ${SHADES[val]}`}
          />
        ))
      )}
    </div>
  )
}

export default App
