import { describe, expect, test } from "bun:test"
import { type Background, type CardProps, clip, OG_HEIGHT, OG_WIDTH, renderCard, renderCardSvg } from "./index"

const BACKGROUNDS: Background[] = ["grid", "dots", "matrix", "plain", "mountains", "waves", "city"]

function size(png: Uint8Array<ArrayBuffer>) {
  const view = new DataView(png.buffer)
  return { signature: Array.from(png.subarray(1, 4)), width: view.getUint32(16), height: view.getUint32(20) }
}

describe("renderCard", () => {
  test("renders a 1200×630 PNG", async () => {
    const png = await renderCard({
      title: "Every secrets manager,",
      subtitle: "one command.",
      chip: "rsec run -- bun dev",
    })
    expect(size(png)).toEqual({ signature: [0x50, 0x4e, 0x47], width: OG_WIDTH, height: OG_HEIGHT })
  })

  for (const background of BACKGROUNDS) {
    test(`renders every variant on ${background}`, async () => {
      const cards: CardProps[] = [
        { background, title: "Short links,", subtitle: "and click analytics.", chip: "rin.ci/your-slug" },
        {
          background,
          title: "Every secrets manager,",
          subtitle: "one command.",
          stats: [{ value: "11", label: "providers" }],
          repo: "rinci-labs/secrets",
          license: "MIT",
        },
        { variant: "mark", background, tagline: "We build apps and websites.", url: "rin.ci" },
      ]
      for (const props of cards) expect(size(await renderCard(props)).width).toBe(OG_WIDTH)
    })
  }

  test("matrix is the same on every render", async () => {
    const props: CardProps = { background: "matrix", title: "Same,", subtitle: "every time.", chip: "rinci-og" }
    expect(await renderCardSvg(props)).toBe(await renderCardSvg(props))
  })

  test("shortens the chip so it never meets the repo", async () => {
    const svg = await renderCardSvg({
      title: "A title",
      subtitle: "and more.",
      chip: "secrets.rin.ci/docs/providers/azure-key-vault/managed-identity",
      repo: "rinci-labs/secrets",
    })
    expect(svg).not.toContain("managed-identity")
  })
})

describe("accent", () => {
  test("takes a preset or a hex colour", async () => {
    const base = { background: "matrix", title: "Same,", subtitle: "other colour.", chip: "rinci-og" } as const
    const blue = await renderCardSvg({ ...base, accent: "blue" })
    expect(blue).toContain("#6b9cf5")
    expect(await renderCardSvg({ ...base, accent: "#6b9cf5" })).toBe(blue)
    expect(await renderCardSvg({ ...base, accent: "#abc" })).toContain("#abc")
  })

  test("rejects anything else", async () => {
    expect(renderCardSvg({ title: "a", subtitle: "b", chip: "c", accent: "#nothex" })).rejects.toThrow(/Unknown accent/)
  })
})

describe("clip", () => {
  test("keeps short text", () => {
    expect(clip("one command.", 20)).toBe("one command.")
  })

  test("cuts at a word boundary", () => {
    expect(clip("Short links, custom domains, and click analytics", 30)).toBe("Short links, custom domains…")
  })
})
