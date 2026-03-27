function computeMask(pixels: number[][]): boolean[][] {
  const ROWS = pixels.length
  const COLS = pixels[0].length

  const isBackground: boolean[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  )

  const queue: [number, number][] = []

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
        if (pixels[y][x] >= 4) {
          isBackground[y][x] = true
          queue.push([y, x])
        }
      }
    }
  }

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  let head = 0
  while (head < queue.length) {
    const [cy, cx] = queue[head++]
    for (const [dy, dx] of dirs) {
      const ny = cy + dy
      const nx = cx + dx
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !isBackground[ny][nx] && pixels[ny][nx] >= 4) {
        isBackground[ny][nx] = true
        queue.push([ny, nx])
      }
    }
  }

  return isBackground.map(row => row.map(bg => !bg))
}

export { computeMask }
