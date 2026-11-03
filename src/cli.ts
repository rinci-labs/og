#!/usr/bin/env node
import { writeFile } from "node:fs/promises"
import { parseArgs } from "node:util"
import { renderCard } from "./index.js"

const usage = `Usage: rinci-og --title <text> --subtitle <text> --chip <text> [--label <text>] [--out og.png]

  --title     First line of the headline
  --subtitle  Second line; over 44 characters it becomes a paragraph
  --chip      Monospace text in the chip, e.g. a command or a URL
  --label     Small uppercase label top right (optional)
  --out       Where to write the PNG (default: og.png)
`

const { values } = parseArgs({
  options: {
    title: { type: "string" },
    subtitle: { type: "string" },
    chip: { type: "string" },
    label: { type: "string" },
    out: { type: "string", default: "og.png" },
    help: { type: "boolean", short: "h" },
  },
})

if (values.help) {
  process.stdout.write(usage)
  process.exit(0)
}

const { title, subtitle, chip, label, out } = values
if (!title || !subtitle || !chip) {
  process.stderr.write(`Missing --title, --subtitle or --chip.\n\n${usage}`)
  process.exit(1)
}

await writeFile(out, await renderCard({ title, subtitle, chip, label }))
process.stdout.write(`Wrote ${out}\n`)
