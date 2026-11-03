import { describe, expect, test } from "bun:test"
import { clip, OG_HEIGHT, OG_WIDTH, renderCard } from "./index"

describe("renderCard", () => {
  test("renders a 1200×630 PNG", async () => {
    const png = await renderCard({
      title: "Every secrets manager,",
      subtitle: "one command.",
      chip: "rsec run -- bun dev",
    })
    const view = new DataView(png.buffer)
    expect(Array.from(png.subarray(1, 4))).toEqual([0x50, 0x4e, 0x47]) // "PNG"
    expect(view.getUint32(16)).toBe(OG_WIDTH)
    expect(view.getUint32(20)).toBe(OG_HEIGHT)
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
