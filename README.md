# @rinci/og

Open Graph cards for RINCI sites. Every site uses the same layout: the wordmark, a two-line headline, and a monospace chip, on the brand grid. Output is a 1200×630 PNG.

The layout started as the card on secrets.rin.ci and moved here so link.rin.ci and the rest match it.

## Install

```sh
bun add -d @rinci/og
```

## Use it in code

```ts
import { renderCard } from "@rinci/og"

const png = await renderCard({
  title: "Short links, custom domains,",
  subtitle: "and click analytics.",
  chip: "rin.ci/your-slug",
})
```

In Astro, render it from an endpoint at build time:

```ts
// src/pages/og.png.ts
import { renderCard } from "@rinci/og"

export const GET = async () =>
  new Response(
    await renderCard({
      title: "Every secrets manager,",
      subtitle: "one command.",
      chip: "rinci-secrets run -- bun dev",
    }),
    {
      headers: { "Content-Type": "image/png" },
    },
  )
```

`renderCardSvg` returns the SVG instead of the PNG.

## Use it from the terminal

```sh
bunx rinci-og --title "Short links, custom domains," --subtitle "and click analytics." --chip "rin.ci/your-slug" --out public/og.png
```

## Props

| Prop       | Required | Notes                                                                                                |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `title`    | yes      | First line, in paper. Over 30 characters the headline drops from 76px to 64px.                       |
| `subtitle` | yes      | Second line, in dim. Up to 44 characters it continues the headline; longer text becomes a paragraph. |
| `chip`     | yes      | Monospace text in the chip, such as a command or a URL.                                              |
| `label`    | no       | Small uppercase label top right, such as `Docs · Providers`.                                         |

Long text is cut at a word boundary with an ellipsis, so a card never overflows.

## Develop

```sh
bun install
bun test
bun run examples   # writes examples/*.png
```

Geist and Geist Mono are vendored as TTF in `fonts/` because Satori cannot read the woff2 files in `@rinci/brand`. They are under the SIL Open Font License (`fonts/OFL.txt`).
