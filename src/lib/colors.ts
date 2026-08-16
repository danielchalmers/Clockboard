import type { WidgetColorPreset } from "./types"

export interface ColorPresetTheme {
  bg: string
  tint: string
  border: string
  accent: string
}

export interface ColorPresetDefinition {
  id: WidgetColorPreset
  label: string
  light: ColorPresetTheme
  dark: ColorPresetTheme
}

// One neutral anchor plus eleven hues spaced around the wheel, ordered spectrally so the picker reads as a gradient.
// The palette is pastel with body: softer than full saturation so a full board reads as one gentle surface, but saturated enough that every card clearly owns its hue instead of washing out.
// Tints are the exception — they set body text on the wash, so they stay dark enough to read even where everything around them is soft.
export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: "slate",
    label: "Slate",
    light: {
      bg: "hsl(220, 22%, 96%)",
      tint: "hsl(220, 14%, 43%)",
      border: "hsl(220, 18%, 88%)",
      accent: "hsl(220, 24%, 41%)"
    },
    dark: {
      bg: "hsl(220, 16%, 13%)",
      tint: "hsl(220, 11%, 69%)",
      border: "hsl(220, 13%, 22%)",
      accent: "hsl(220, 22%, 81%)"
    }
  },
  {
    id: "rose",
    label: "Rose",
    light: {
      bg: "hsl(347, 78%, 95%)",
      tint: "hsl(347, 48%, 43%)",
      border: "hsl(347, 62%, 87%)",
      accent: "hsl(347, 72%, 59%)"
    },
    dark: {
      bg: "hsl(347, 36%, 13%)",
      tint: "hsl(347, 52%, 74%)",
      border: "hsl(347, 32%, 22%)",
      accent: "hsl(347, 75%, 72%)"
    }
  },
  {
    id: "coral",
    label: "Coral",
    light: {
      bg: "hsl(14, 80%, 94%)",
      tint: "hsl(14, 48%, 41%)",
      border: "hsl(14, 65%, 86%)",
      accent: "hsl(14, 74%, 58%)"
    },
    dark: {
      bg: "hsl(14, 36%, 13%)",
      tint: "hsl(14, 52%, 74%)",
      border: "hsl(14, 32%, 22%)",
      accent: "hsl(14, 75%, 70%)"
    }
  },
  {
    id: "amber",
    label: "Amber",
    light: {
      bg: "hsl(39, 85%, 93%)",
      tint: "hsl(33, 58%, 37%)",
      border: "hsl(39, 70%, 83%)",
      accent: "hsl(34, 78%, 50%)"
    },
    dark: {
      bg: "hsl(36, 40%, 13%)",
      tint: "hsl(38, 58%, 70%)",
      border: "hsl(36, 35%, 20%)",
      accent: "hsl(40, 78%, 65%)"
    }
  },
  {
    id: "lemon",
    label: "Lemon",
    light: {
      bg: "hsl(52, 85%, 92%)",
      tint: "hsl(48, 65%, 31%)",
      border: "hsl(50, 70%, 80%)",
      accent: "hsl(46, 75%, 45%)"
    },
    dark: {
      bg: "hsl(50, 38%, 12%)",
      tint: "hsl(52, 52%, 68%)",
      border: "hsl(50, 33%, 20%)",
      accent: "hsl(54, 75%, 63%)"
    }
  },
  {
    id: "mint",
    label: "Mint",
    light: {
      bg: "hsl(130, 56%, 93%)",
      tint: "hsl(132, 48%, 30%)",
      border: "hsl(130, 46%, 83%)",
      accent: "hsl(134, 56%, 47%)"
    },
    dark: {
      bg: "hsl(132, 33%, 12%)",
      tint: "hsl(130, 42%, 70%)",
      border: "hsl(132, 28%, 20%)",
      accent: "hsl(134, 62%, 64%)"
    }
  },
  {
    id: "emerald",
    label: "Emerald",
    light: {
      bg: "hsl(158, 60%, 93%)",
      tint: "hsl(160, 58%, 27%)",
      border: "hsl(158, 48%, 82%)",
      accent: "hsl(160, 68%, 43%)"
    },
    dark: {
      bg: "hsl(160, 36%, 11%)",
      tint: "hsl(158, 45%, 65%)",
      border: "hsl(160, 32%, 18%)",
      accent: "hsl(158, 64%, 59%)"
    }
  },
  {
    id: "teal",
    label: "Teal",
    light: {
      bg: "hsl(183, 65%, 93%)",
      tint: "hsl(185, 62%, 28%)",
      border: "hsl(183, 52%, 81%)",
      accent: "hsl(186, 72%, 42%)"
    },
    dark: {
      bg: "hsl(185, 40%, 11%)",
      tint: "hsl(183, 45%, 65%)",
      border: "hsl(185, 35%, 18%)",
      accent: "hsl(183, 66%, 59%)"
    }
  },
  {
    id: "sky",
    label: "Sky",
    light: {
      bg: "hsl(206, 82%, 94%)",
      tint: "hsl(208, 55%, 40%)",
      border: "hsl(206, 68%, 86%)",
      accent: "hsl(208, 78%, 56%)"
    },
    dark: {
      bg: "hsl(208, 44%, 13%)",
      tint: "hsl(206, 52%, 72%)",
      border: "hsl(208, 38%, 21%)",
      accent: "hsl(204, 76%, 68%)"
    }
  },
  {
    id: "indigo",
    label: "Indigo",
    light: {
      bg: "hsl(240, 78%, 96%)",
      tint: "hsl(242, 45%, 48%)",
      border: "hsl(240, 62%, 89%)",
      accent: "hsl(243, 68%, 63%)"
    },
    dark: {
      bg: "hsl(242, 33%, 14%)",
      tint: "hsl(240, 55%, 77%)",
      border: "hsl(242, 28%, 24%)",
      accent: "hsl(238, 74%, 75%)"
    }
  },
  {
    id: "violet",
    label: "Violet",
    light: {
      bg: "hsl(275, 78%, 96%)",
      tint: "hsl(275, 45%, 45%)",
      border: "hsl(275, 60%, 88%)",
      accent: "hsl(275, 68%, 61%)"
    },
    dark: {
      bg: "hsl(275, 33%, 14%)",
      tint: "hsl(275, 46%, 76%)",
      border: "hsl(275, 28%, 23%)",
      accent: "hsl(275, 72%, 74%)"
    }
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    light: {
      bg: "hsl(315, 72%, 95%)",
      tint: "hsl(315, 48%, 41%)",
      border: "hsl(315, 60%, 87%)",
      accent: "hsl(316, 70%, 58%)"
    },
    dark: {
      bg: "hsl(315, 36%, 13%)",
      tint: "hsl(315, 50%, 74%)",
      border: "hsl(315, 32%, 22%)",
      accent: "hsl(315, 74%, 71%)"
    }
  }
]

// A random hue for newly created widgets, so every new card arrives already looking at home on the board.
// Neutral slate is skipped because it reads as "no color chosen", but stays available in the picker as a deliberate choice.
export const randomColorPreset = (): WidgetColorPreset => {
  const hues = COLOR_PRESETS.filter((preset) => preset.id !== "slate")

  return hues[Math.floor(Math.random() * hues.length)]!.id
}

export const getPresetById = (id: WidgetColorPreset): ColorPresetDefinition => {
  return COLOR_PRESETS.find((preset) => preset.id === id) || COLOR_PRESETS[0]!
}

export const getPresetCssVars = (id: WidgetColorPreset): Record<string, string> => {
  const preset = getPresetById(id)
  return {
    "--card-bg-light": preset.light.bg,
    "--card-tint-light": preset.light.tint,
    "--card-border-light": preset.light.border,
    "--card-accent-light": preset.light.accent,
    "--card-bg-dark": preset.dark.bg,
    "--card-tint-dark": preset.dark.tint,
    "--card-border-dark": preset.dark.border,
    "--card-accent-dark": preset.dark.accent
  }
}
