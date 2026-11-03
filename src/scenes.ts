/**
 * ASCII scenes drawn into a character grid. Each cell holds a glyph and a tone;
 * the card renders one text layer per tone, so a whole scene is four nodes.
 */

export type Scene = "mountains" | "waves" | "city"

/** Far to near, then the signal highlight. */
export type Tone = "far" | "mid" | "near" | "glow"
export const TONES: Tone[] = ["far", "mid", "near", "glow"]

export type Grid = { columns: number; rows: number; text: Record<Tone, string> }

/** A small seeded PRNG (mulberry32), so a scene draws the same on every build. */
export function random(seed: string): () => number {
  let state = 0
  for (const char of seed) state = (Math.imul(state, 31) + char.charCodeAt(0)) | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Canvas {
  readonly cells: { glyph: string; tone: Tone }[][]

  constructor(
    readonly columns: number,
    readonly rows: number,
  ) {
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => ({ glyph: " ", tone: "far" as Tone })),
    )
  }

  set(x: number, y: number, glyph: string, tone: Tone) {
    const row = this.cells[Math.round(y)]
    const cell = row?.[Math.round(x)]
    if (cell) {
      cell.glyph = glyph
      cell.tone = tone
    }
  }

  /** A disc, stretched sideways because a cell is taller than it is wide. */
  disc(
    cx: number,
    cy: number,
    radius: number,
    glyph: (x: number, y: number, distance: number) => string | undefined,
    tone: Tone,
  ) {
    for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
      for (let x = Math.floor(cx - radius * 1.8); x <= cx + radius * 1.8; x++) {
        const dx = (x - cx) / 1.8
        const dy = y - cy
        const distance = Math.sqrt(dx * dx + dy * dy) / radius
        if (distance > 1) continue
        const g = glyph(x, y, distance)
        if (g) this.set(x, y, g, tone)
      }
    }
  }

  toGrid(): Grid {
    const text = {} as Record<Tone, string>
    for (const tone of TONES) {
      text[tone] = this.cells
        .map((row) => row.map((cell) => (cell.tone === tone ? cell.glyph : " ")).join(""))
        .join("\n")
    }
    return { columns: this.columns, rows: this.rows, text }
  }
}

/** A lit sphere: dense in the middle, thinning to the rim. */
const shade = (_x: number, _y: number, distance: number) => (distance < 0.55 ? "#" : distance < 0.8 ? "=" : ":")

/** Smooth 1D noise: a few sines with seeded phases. */
function ridge(next: () => number, octaves: number[]): (x: number) => number {
  const phases = octaves.map(() => next() * Math.PI * 2)
  return (x) => octaves.reduce((sum, frequency, i) => sum + Math.sin(x * frequency + (phases[i] ?? 0)) / (i + 1), 0)
}

function stars(canvas: Canvas, next: () => number, until: number, density: number) {
  for (let y = 0; y < until; y++) {
    for (let x = 0; x < canvas.columns; x++) {
      const roll = next()
      if (roll < density) canvas.set(x, y, roll < density / 6 ? "+" : ".", roll < density / 10 ? "near" : "far")
    }
  }
}

function mountains(canvas: Canvas, next: () => number) {
  const { columns, rows } = canvas
  stars(canvas, next, rows, 0.025)

  canvas.disc(columns * 0.84, rows * 0.15, 3, shade, "glow")

  const far = ridge(next, [0.05, 0.13, 0.31])
  const near = ridge(next, [0.035, 0.09, 0.23])
  for (let x = 0; x < columns; x++) {
    const farTop = Math.round(rows * 0.6 + far(x) * 3)
    const nearTop = Math.round(rows * 0.76 + near(x) * 3)
    for (let y = farTop; y < rows; y++) canvas.set(x, y, y === farTop ? "^" : (x + y) % 3 === 0 ? ":" : ".", "far")
    for (let y = nearTop; y < rows; y++) {
      const depth = y - nearTop
      canvas.set(
        x,
        y,
        depth === 0 ? "/" : depth < 3 ? "=" : (x + y) % 2 === 0 ? "#" : "+",
        depth === 0 ? "near" : "mid",
      )
    }
    // The crest catches the moonlight here and there.
    if (next() < 0.08) canvas.set(x, nearTop, "*", "glow")
  }
}

function waves(canvas: Canvas, next: () => number) {
  const { columns, rows } = canvas
  const horizon = Math.round(rows * 0.7)
  const sunX = columns * 0.86
  stars(canvas, next, horizon - 2, 0.012)

  // A setting sun, banded like an old print.
  canvas.disc(sunX, horizon - 1, 5, (_, y) => (y >= horizon || (horizon - y) % 3 === 0 ? undefined : "#"), "glow")

  for (let x = 0; x < columns; x++) canvas.set(x, horizon, "=", "mid")

  const swell = ridge(next, [0.21, 0.47, 0.83])
  for (let y = horizon + 1; y < rows; y++) {
    const depth = (y - horizon) / (rows - horizon)
    for (let x = 0; x < columns; x++) {
      const crest = swell(x * (1.2 - depth * 0.6) + y * 2.3)
      const reflection = Math.abs(x - sunX) < 7 * (1 - depth * 0.4) && (x + y) % 2 === 0
      if (reflection && crest > -0.3) canvas.set(x, y, "-", "glow")
      else if (crest > 0.9 - depth * 0.7) canvas.set(x, y, "~", depth > 0.45 ? "near" : "mid")
      else if (crest > 0.2) canvas.set(x, y, "-", "far")
    }
  }
}

function city(canvas: Canvas, next: () => number) {
  const { columns, rows } = canvas
  stars(canvas, next, Math.round(rows * 0.45), 0.02)
  canvas.disc(columns * 0.86, rows * 0.15, 2.6, shade, "glow")

  const skyline = (from: number, base: number, tone: Tone, lit: number) => {
    let x = from
    while (x < columns) {
      const width = 4 + Math.floor(next() * 7)
      const top = Math.round(rows - base - rows * 0.12 - next() * rows * 0.3)
      for (let y = top; y < rows; y++) {
        for (let dx = 0; dx < width && x + dx < columns; dx++) {
          const edge = dx === 0 || dx === width - 1
          if (y === top) canvas.set(x + dx, y, edge ? "+" : "-", tone)
          else if (edge) canvas.set(x + dx, y, "|", tone)
          else if (y % 2 === 0 && dx % 2 === 1) {
            const on = next() < lit
            canvas.set(x + dx, y, on ? "#" : ".", on && tone === "mid" ? "glow" : tone)
          } else canvas.set(x + dx, y, " ", tone)
        }
      }
      // The occasional antenna.
      if (next() < 0.25) for (let y = top - 3; y < top; y++) canvas.set(x + Math.floor(width / 2), y, "|", tone)
      x += width + Math.floor(next() * 2)
    }
  }

  skyline(0, rows * 0.28, "far", 0.25)
  skyline(2, 0, "mid", 0.22)
}

const draw: Record<Scene, (canvas: Canvas, next: () => number) => void> = { mountains, waves, city }

export function scene(kind: Scene, columns: number, rows: number, seed: string): Grid {
  const canvas = new Canvas(columns, rows)
  draw[kind](canvas, random(`${kind}:${seed}`))
  return canvas.toGrid()
}
