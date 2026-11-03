import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import { type CardProps, card, OG_HEIGHT, OG_WIDTH } from "./card.js"

export { type CardProps, clip, color, OG_HEIGHT, OG_WIDTH } from "./card.js"

type Fonts = Parameters<typeof satori>[1]["fonts"]

// Satori loads TTF/OTF only; the brand ships woff2, so the static cuts ship with this package.
const font = (file: string) => readFile(fileURLToPath(new URL(`../fonts/${file}`, import.meta.url)))

let fonts: Promise<Fonts> | undefined
function loadFonts(): Promise<Fonts> {
  fonts ??= Promise.all([font("Geist-Regular.ttf"), font("Geist-Medium.ttf"), font("GeistMono-Regular.ttf")]).then(
    ([regular, medium, mono]) => [
      { name: "Geist", data: regular, weight: 400, style: "normal" },
      { name: "Geist", data: medium, weight: 500, style: "normal" },
      { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
    ],
  )
  return fonts
}

/** The card as an SVG string. */
export async function renderCardSvg(props: CardProps): Promise<string> {
  return satori(card(props) as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  })
}

/** The card as a 1200×630 PNG. */
export async function renderCard(props: CardProps): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await renderCardSvg(props)
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng())
}
