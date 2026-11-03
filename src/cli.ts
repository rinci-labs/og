#!/usr/bin/env node
import { writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { type Accent, accents, type Background, type CardProps, renderCard } from "./index.js"

const BACKGROUNDS: readonly string[] = [
  "grid",
  "dots",
  "matrix",
  "plain",
  "mountains",
  "waves",
  "city",
] satisfies Background[]

const usage = `Usage:
  rinci-og --title <text> --subtitle <text> [--chip <text> | --stat <value:label>...] [options]
  rinci-og --variant mark --tagline <text> [--url <text>] [--out og.png]

Headline card (default):
  --title     First line of the headline
  --subtitle  Second line; over 44 characters it becomes a paragraph
  --chip      Monospace text in the chip, e.g. a command or a URL
  --stat      A figure shown instead of the chip, as value:label (repeat up to 3 times)
  --label     Small uppercase label top right
  --repo      GitHub owner/name, shown bottom right
  --license   Licence next to the repo, e.g. MIT

Mark card:
  --tagline   One line under the wordmark
  --url       Shown at the bottom, e.g. rin.ci

Both:
  --background  grid (default), dots, matrix, plain, mountains, waves or city
  --accent      signal (default), ${Object.keys(accents).slice(1).join(", ")}, or a hex colour
  --out         Where to write the PNG (default: og.png)
`

const { values } = parseArgs({
  options: {
    variant: { type: "string", default: "headline" },
    background: { type: "string", default: "grid" },
    accent: { type: "string", default: "signal" },
    title: { type: "string" },
    subtitle: { type: "string" },
    chip: { type: "string" },
    stat: { type: "string", multiple: true },
    label: { type: "string" },
    repo: { type: "string" },
    license: { type: "string" },
    tagline: { type: "string" },
    url: { type: "string" },
    out: { type: "string", default: "og.png" },
    help: { type: "boolean", short: "h" },
  },
})

function fail(message: string): never {
  process.stderr.write(`${message}\n\n${usage}`)
  process.exit(1)
}

if (values.help) {
  process.stdout.write(usage)
  process.exit(0)
}

if (!BACKGROUNDS.includes(values.background)) fail(`Unknown --background "${values.background}".`)
const background = values.background as Background
const accent = values.accent as Accent

let props: CardProps
if (values.variant === "mark") {
  if (!values.tagline) fail("Missing --tagline.")
  props = { variant: "mark", background, accent, tagline: values.tagline, url: values.url }
} else if (values.variant === "headline") {
  const { title, subtitle, chip, label, repo, license } = values
  if (!title || !subtitle) fail("Missing --title or --subtitle.")
  const stats = (values.stat ?? []).map((stat) => {
    const at = stat.indexOf(":")
    if (at < 1) fail(`--stat must be value:label, got "${stat}".`)
    return { value: stat.slice(0, at), label: stat.slice(at + 1) }
  })
  if (!chip && stats.length === 0) fail("Pass --chip or at least one --stat.")
  props = { background, accent, title, subtitle, chip, stats, label, repo, license }
} else {
  fail(`Unknown --variant "${values.variant}". Use headline or mark.`)
}

try {
  await writeFile(values.out, await renderCard(props))
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
process.stdout.write(`Wrote ${values.out}\n`)
