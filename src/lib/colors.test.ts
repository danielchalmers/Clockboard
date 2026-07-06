import { describe, expect, it } from "vitest"
import { COLOR_PRESETS, getPresetById, getPresetCssVars } from "./colors"

describe("colors presets", () => {
  it("defines exactly 12 accessible presets in spectral order", () => {
    expect(COLOR_PRESETS.length).toBe(12)

    const expectedPresetIds = [
      "slate",
      "rose",
      "coral",
      "amber",
      "lemon",
      "mint",
      "emerald",
      "teal",
      "sky",
      "indigo",
      "violet",
      "fuchsia"
    ]

    expect(COLOR_PRESETS.map((p) => p.id)).toEqual(expectedPresetIds)
  })

  it("retrieves a preset by ID or falls back to slate", () => {
    const rose = getPresetById("rose")
    expect(rose.label).toBe("Rose")

    // @ts-expect-error - testing invalid preset argument
    const fallback = getPresetById("invalid-preset-id")
    expect(fallback.id).toBe("slate")
  })

  it("generates correct CSS variable custom property mappings", () => {
    const cssVars = getPresetCssVars("emerald")

    expect(cssVars).toEqual({
      "--card-bg-light": "hsl(158, 70%, 93%)",
      "--card-tint-light": "hsl(160, 75%, 25%)",
      "--card-border-light": "hsl(158, 55%, 80%)",
      "--card-accent-light": "hsl(160, 90%, 32%)",
      "--card-bg-dark": "hsl(160, 45%, 10%)",
      "--card-tint-dark": "hsl(158, 55%, 62%)",
      "--card-border-dark": "hsl(160, 40%, 18%)",
      "--card-accent-dark": "hsl(158, 80%, 52%)"
    })
  })
})
