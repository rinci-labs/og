import { LOGO_TEXT_RATIO, LOGO_TEXT_SVG, SCRAMBLE_GLYPHS } from "@rinci/brand"
import { random, type Scene, scene, TONES, type Tone } from "./scenes.js"

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630

/** The brand palette, as in `@rinci/brand/components.css`. Satori cannot read CSS variables. */
export const color = {
  ink: "#0a0b0a",
  ink2: "#101210",
  paper: "#f4f5f3",
  dim: "#9aa09a",
  faint: "#62675f",
  line: "#1e211e",
  signal: "#6fbf95",
} as const

/** Accent presets. `signal` is the brand accent; the others let each product's cards tell apart. */
export const accents = {
  signal: "#6fbf95",
  blue: "#6b9cf5",
  amber: "#e4a853",
  rose: "#e8798d",
  violet: "#a48af0",
  cyan: "#5cc8d6",
} as const

/** A preset name or a hex colour such as `#6b9cf5`. */
export type Accent = keyof typeof accents | `#${string}`

type Tint = { solid: string; alpha: (a: string) => string }

/** Resolves an accent to its hex and an `rgba()` helper for glows and fades. */
function tint(accent: Accent = "signal"): Tint {
  const hex = accent.startsWith("#") ? accent : accents[accent as keyof typeof accents]
  const match = hex?.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!hex || !match?.[1])
    throw new Error(`Unknown accent "${accent}". Use a preset (${Object.keys(accents).join(", ")}) or a hex colour.`)
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1]
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(digits.slice(i, i + 2), 16))
  return { solid: hex, alpha: (a) => `rgba(${r}, ${g}, ${b}, ${a})` }
}

export type Stat = {
  /** The figure, e.g. `11` or `0`. */
  value: string
  /** What it counts, e.g. `providers`. */
  label: string
}

/**
 * What sits behind the card. `grid` is the default. `matrix` and the scenes
 * (`mountains`, `waves`, `city`) are ASCII art on the right side, seeded by the
 * card's text and faded out before they reach it.
 */
export type Background = "grid" | "dots" | "matrix" | "plain" | Scene

/** The default card: a two-line headline over a chip. Used for home pages and docs. */
export type HeadlineCardProps = {
  variant?: "headline"
  background?: Background
  /** A preset from `accents` or a hex colour. Defaults to the brand's signal green. */
  accent?: Accent
  /** First line, in paper. */
  title: string
  /** Second line, in dim. Short text continues the headline; long text becomes a paragraph. */
  subtitle: string
  /** Monospace text in the chip, e.g. a command or a URL. */
  chip?: string
  /** Up to three figures shown in place of the chip. */
  stats?: Stat[]
  /** Small label top right, e.g. the docs section. */
  label?: string
  /** GitHub `owner/name`, shown bottom right for open source projects. */
  repo?: string
  /** Licence shown next to the repo, e.g. `MIT`. */
  license?: string
}

/** The wordmark on its own, for the company site, fallbacks and error pages. */
export type MarkCardProps = {
  variant: "mark"
  background?: Background
  /** A preset from `accents` or a hex colour. Defaults to the brand's signal green. */
  accent?: Accent
  /** One line under the wordmark. */
  tagline: string
  /** Shown at the bottom, e.g. `rin.ci`. */
  url?: string
}

export type CardProps = HeadlineCardProps | MarkCardProps

type Style = Record<string, string | number>
export interface Node {
  type: string
  props: { style?: Style; children?: Child | Child[]; [key: string]: unknown }
}
type Child = Node | string

const h = (type: string, style: Style, children?: Child | Child[], props: Record<string, unknown> = {}): Node => ({
  type,
  props: { ...props, style: { display: "flex", ...style }, children },
})

const svgUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`

const logo = svgUrl(LOGO_TEXT_SVG.replace("<path ", `<path fill="${color.paper}" `))

// The GitHub mark from Primer Octicons (MIT).
const github = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="${color.dim}" d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>`,
)

/** Shortens at a word boundary, so a card never ends in half a word. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(" ")
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, "")}…`
}

const glow = (t: Tint) =>
  `radial-gradient(circle at 0% 0%, ${t.alpha("0.20")} 0%, ${t.alpha("0.06")} 40%, rgba(10, 11, 10, 0) 70%)`

/** CSS backgrounds for each pattern. The glow comes first so it tints the pattern beneath it. */
const patterns = (t: Tint): Record<"grid" | "plain", Style> => ({
  grid: {
    backgroundImage: [
      glow(t),
      `linear-gradient(${color.line} 1px, rgba(0, 0, 0, 0) 1px)`,
      `linear-gradient(90deg, ${color.line} 1px, rgba(0, 0, 0, 0) 1px)`,
    ].join(", "),
    backgroundSize: `${OG_WIDTH}px ${OG_HEIGHT}px, 56px 56px, 56px 56px`,
  },
  plain: { backgroundImage: glow(t) },
})

// Satori does not tile radial gradients, so the dots are an SVG pattern laid under the content.
const dots = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}"><defs><pattern id="d" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1.6" fill="#323832"/></pattern></defs><rect width="100%" height="100%" fill="url(#d)"/></svg>`,
)

const layer = (style: Style, children?: Child[]) =>
  h("div", { position: "absolute", left: 0, top: 0, width: OG_WIDTH, height: OG_HEIGHT, ...style }, children)

const CELL = 24
const COLUMNS = Math.ceil(OG_WIDTH / CELL)
const ROWS = Math.ceil(OG_HEIGHT / CELL)

/** Fades ASCII art out towards the headline and the footer, so text never sits on top of it. */
const fade = () =>
  layer({
    backgroundImage: [
      `linear-gradient(0deg, ${color.ink} 0%, ${color.ink} 16%, rgba(10, 11, 10, 0) 34%)`,
      `linear-gradient(180deg, ${color.ink} 0%, ${color.ink} 12%, rgba(10, 11, 10, 0) 26%)`,
      `linear-gradient(90deg, ${color.ink} 0%, ${color.ink} 48%, rgba(10, 11, 10, 0.6) 74%, rgba(10, 11, 10, 0.1) 100%)`,
    ].join(", "),
  })

const SCENE_TEXT = 18
const toneColor = (t: Tint): Record<Tone, string> => ({
  far: "#262b26",
  mid: color.faint,
  near: color.dim,
  glow: t.solid,
})

/** One text layer per tone, so a scene costs four nodes however detailed it is. */
function sceneLayers(kind: Scene, seed: string, t: Tint): Node[] {
  const columns = Math.ceil(OG_WIDTH / (SCENE_TEXT * 0.6))
  const rows = Math.ceil(OG_HEIGHT / SCENE_TEXT)
  const grid = scene(kind, columns, rows, seed)
  return [
    ...TONES.map((tone) =>
      layer(
        {
          whiteSpace: "pre",
          fontFamily: "Geist Mono",
          fontSize: SCENE_TEXT,
          lineHeight: `${SCENE_TEXT}px`,
          color: toneColor(t)[tone],
        },
        [grid.text[tone]],
      ),
    ),
    fade(),
  ]
}

/**
 * Columns of the brand's ASCII glyphs falling down the right of the card, each
 * with a signal head and a fading trail. Runs of one colour share a text node,
 * which keeps the tree to a few hundred nodes.
 */
function matrix(seed: string, t: Tint): Node[] {
  const next = random(seed)
  const glyph = () => SCRAMBLE_GLYPHS.charAt(Math.floor(next() * SCRAMBLE_GLYPHS.length))
  const run = (length: number) => Array.from({ length }, glyph).join("\n")
  const text = (rows: number, style: Style) =>
    h("div", { whiteSpace: "pre", height: rows * CELL, ...style }, rows > 0 ? run(rows) : "")

  const columns: Node[] = []
  for (let column = Math.floor(COLUMNS * 0.5); column < COLUMNS; column++) {
    if (next() < 0.3) continue
    const head = Math.floor(next() * (ROWS + 6))
    const trail = Math.min(head, 4 + Math.floor(next() * 12))
    const above = head - trail
    columns.push(
      h(
        "div",
        {
          position: "absolute",
          left: column * CELL,
          top: 0,
          width: CELL,
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Geist Mono",
          fontSize: 17,
          lineHeight: `${CELL}px`,
        },
        [
          text(above, { color: color.line }),
          text(trail, { color: color.faint }),
          ...(head < ROWS ? [text(1, { color: t.solid })] : []),
        ],
      ),
    )
  }

  columns.push(fade())
  return columns
}

/** Ink, a background pattern, a signal glow from one corner and the signal bar along the bottom. */
function frame(style: Style, children: Child[], background: Background, seed: string, t: Tint): Node {
  return h(
    "div",
    {
      position: "relative",
      boxSizing: "border-box",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      flexDirection: "column",
      padding: "72px 80px",
      backgroundColor: color.ink,
      ...(background === "grid" ? patterns(t).grid : patterns(t).plain),
      fontFamily: "Geist",
      color: color.paper,
      ...style,
    },
    [
      ...backdrop(background, seed, t),
      h("div", {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 4,
        backgroundImage: `linear-gradient(90deg, ${t.solid} 0%, ${t.alpha("0.35")} 55%, ${t.alpha("0")} 100%)`,
      }),
      // Positioned layers paint over in-flow content, so the content is positioned too.
      ...(background === "grid" || background === "plain"
        ? children
        : children.map((child) =>
            typeof child === "string"
              ? child
              : { ...child, props: { ...child.props, style: { position: "relative", ...child.props.style } } },
          )),
    ],
  )
}

/** Layers drawn under the content for the patterns CSS cannot express. */
function backdrop(background: Background, seed: string, t: Tint): Node[] {
  if (background === "dots")
    return [
      layer({}, [
        h("img", { width: OG_WIDTH, height: OG_HEIGHT }, undefined, { src: dots, width: OG_WIDTH, height: OG_HEIGHT }),
      ]),
    ]
  if (background === "matrix") return matrix(seed, t)
  if (background === "mountains" || background === "waves" || background === "city")
    return sceneLayers(background, seed, t)
  return []
}

const wordmark = (height: number) =>
  h("img", { width: height * LOGO_TEXT_RATIO, height }, undefined, {
    src: logo,
    width: height * LOGO_TEXT_RATIO,
    height,
  })

// Geist Mono advances 0.6em per character, which lets the footer budget its width.
const MONO_ADVANCE = 0.6
const CONTENT_WIDTH = OG_WIDTH - 160
const FOOTER_GAP = 40
const REPO_TEXT = 22

/** Characters that fit in `width` at a mono `size`. */
const monoChars = (width: number, size: number) => Math.floor(width / (size * MONO_ADVANCE))

function repoText(repo: string, license?: string): string {
  return license ? `${clip(repo, 28)} · ${clip(license, 10)}` : clip(repo, 28)
}

/** Icon, gap and text. */
const repoWidth = (text: string) => 40 + text.length * REPO_TEXT * MONO_ADVANCE

/** Label characters per stat when `count` stats share `width`, 56px apart. */
const statChars = (width: number, count: number) => Math.min(18, monoChars((width - 56 * (count - 1)) / count, 18))

function chipNode(text: string, t: Tint, maxChars = 56): Node {
  return h(
    "div",
    {
      alignSelf: "flex-start",
      alignItems: "center",
      gap: 16,
      padding: "16px 24px",
      backgroundColor: color.ink2,
      border: `1px solid ${color.line}`,
      borderRadius: 10,
    },
    [
      h("div", { width: 14, height: 14, backgroundColor: t.solid }),
      h("div", { fontFamily: "Geist Mono", fontSize: 26, color: color.paper }, clip(text, maxChars)),
    ],
  )
}

function statsNode(stats: Stat[], labelChars = 18): Node {
  return h(
    "div",
    { gap: 56 },
    stats
      .slice(0, 3)
      .map(({ value, label }) =>
        h("div", { flexDirection: "column", gap: 6 }, [
          h("div", { fontSize: 44, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em" }, clip(value, 8)),
          h(
            "div",
            { fontFamily: "Geist Mono", fontSize: 18, color: color.dim, letterSpacing: "0.06em" },
            clip(label, labelChars).toUpperCase(),
          ),
        ]),
      ),
  )
}

function repoNode(text: string): Node {
  return h("div", { alignItems: "center", gap: 14, fontFamily: "Geist Mono", fontSize: REPO_TEXT, color: color.dim }, [
    h("img", { width: 26, height: 26 }, undefined, { src: github, width: 26, height: 26 }),
    text,
  ])
}

function headlineCard({
  background = "grid",
  accent,
  title,
  subtitle,
  chip,
  stats,
  label,
  repo,
  license,
}: HeadlineCardProps): Node {
  const t = tint(accent)
  const headline = title.length > 30 ? 64 : 76
  const continues = subtitle.length <= 44
  const repoLine = repo ? repoText(repo, license) : undefined
  // What the left of the footer may use without running into the repo. The chip has 78px of padding and marker.
  const room = repoLine ? CONTENT_WIDTH - repoWidth(repoLine) - FOOTER_GAP : CONTENT_WIDTH
  const left = stats?.length
    ? statsNode(stats, statChars(room, Math.min(stats.length, 3)))
    : chip
      ? chipNode(chip, t, Math.min(56, monoChars(room - 78, 26)))
      : undefined

  // Without a repo the left node sits on its own, as it did before repos existed.
  const footer = repoLine
    ? h("div", { justifyContent: "space-between", alignItems: "flex-end" }, [left ?? h("div", {}), repoNode(repoLine)])
    : (left ?? h("div", {}))

  return frame(
    { justifyContent: "space-between" },
    [
      h("div", { justifyContent: "space-between", alignItems: "center" }, [
        wordmark(44),
        h(
          "div",
          { fontFamily: "Geist Mono", fontSize: 22, color: color.dim, letterSpacing: "0.06em" },
          label ? clip(label, 40).toUpperCase() : "",
        ),
      ]),

      h("div", { flexDirection: "column", gap: continues ? 0 : 22, maxWidth: 1000 }, [
        h("div", { fontSize: headline, fontWeight: 500, lineHeight: 1.08, letterSpacing: "-0.035em" }, clip(title, 60)),
        h(
          "div",
          continues
            ? { fontSize: headline, fontWeight: 500, lineHeight: 1.08, letterSpacing: "-0.035em", color: color.dim }
            : { fontSize: 32, lineHeight: 1.4, color: color.dim, maxWidth: 960 },
          clip(subtitle, 150),
        ),
      ]),

      footer,
    ],
    background,
    title + subtitle,
    t,
  )
}

function markCard({ background = "grid", accent, tagline, url }: MarkCardProps): Node {
  const t = tint(accent)
  return frame(
    { justifyContent: "center", gap: 44 },
    [
      wordmark(120),
      h(
        "div",
        { fontSize: 44, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.025em", color: color.dim },
        clip(tagline, 48),
      ),
      ...(url
        ? [
            h(
              "div",
              {
                position: "absolute",
                left: 80,
                bottom: 64,
                fontFamily: "Geist Mono",
                fontSize: 22,
                color: t.solid,
                letterSpacing: "0.06em",
              },
              clip(url, 40).toUpperCase(),
            ),
          ]
        : []),
    ],
    background,
    tagline,
    t,
  )
}

export function card(props: CardProps): Node {
  return props.variant === "mark" ? markCard(props) : headlineCard(props)
}
