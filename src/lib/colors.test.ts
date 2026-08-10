import { describe, expect, it } from "vitest"
import { COLOR_PRESETS, getPresetById, getPresetCssVars } from "./colors"

describe("colors presets", () => {
  it("defines twelve presets in spectral order with slate first", () => {
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

  it("maps each preset theme value to its light and dark custom property", () => {
    // The rule under test is which value lands on which property, so read the values
    // back from the preset. Copying the palette here would fail this test on a tweak
    // to a color that no widget behavior depends on.
    const emerald = getPresetById("emerald")

    expect(getPresetCssVars("emerald")).toEqual({
      "--card-bg-light": emerald.light.bg,
      "--card-tint-light": emerald.light.tint,
      "--card-border-light": emerald.light.border,
      "--card-accent-light": emerald.light.accent,
      "--card-bg-dark": emerald.dark.bg,
      "--card-tint-dark": emerald.dark.tint,
      "--card-border-dark": emerald.dark.border,
      "--card-accent-dark": emerald.dark.accent
    })
  })
})
