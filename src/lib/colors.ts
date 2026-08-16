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
// The whole palette is pastel: washes and accents alike sit at softened saturation and raised lightness, so a full board reads as one gentle surface.
// Tints are the exception — they set body text on the wash, so they stay dark enough to read even where everything around them is soft.
export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: "slate",
    label: "Slate",
    light: {
      bg: "hsl(220, 20%, 96%)",
      tint: "hsl(220, 12%, 44%)",
      border: "hsl(220, 16%, 88%)",
      accent: "hsl(220, 18%, 52%)"
    },
    dark: {
      bg: "hsl(220, 14%, 13%)",
      tint: "hsl(220, 10%, 70%)",
      border: "hsl(220, 12%, 22%)",
      accent: "hsl(220, 20%, 80%)"
    }
  },
  {
    id: "rose",
    label: "Rose",
    light: {
      bg: "hsl(347, 65%, 95%)",
      tint: "hsl(347, 35%, 44%)",
      border: "hsl(347, 50%, 88%)",
      accent: "hsl(347, 60%, 68%)"
    },
    dark: {
      bg: "hsl(347, 28%, 14%)",
      tint: "hsl(347, 40%, 76%)",
      border: "hsl(347, 24%, 23%)",
      accent: "hsl(347, 60%, 76%)"
    }
  },
  {
    id: "coral",
    label: "Coral",
    light: {
      bg: "hsl(14, 70%, 94%)",
      tint: "hsl(14, 35%, 42%)",
      border: "hsl(14, 55%, 86%)",
      accent: "hsl(14, 62%, 66%)"
    },
    dark: {
      bg: "hsl(14, 28%, 14%)",
      tint: "hsl(14, 40%, 75%)",
      border: "hsl(14, 24%, 23%)",
      accent: "hsl(14, 60%, 74%)"
    }
  },
  {
    id: "amber",
    label: "Amber",
    light: {
      bg: "hsl(40, 75%, 93%)",
      tint: "hsl(33, 45%, 38%)",
      border: "hsl(40, 60%, 84%)",
      accent: "hsl(35, 60%, 58%)"
    },
    dark: {
      bg: "hsl(36, 30%, 13%)",
      tint: "hsl(38, 45%, 72%)",
      border: "hsl(36, 26%, 21%)",
      accent: "hsl(40, 60%, 70%)"
    }
  },
  {
    id: "lemon",
    label: "Lemon",
    light: {
      bg: "hsl(52, 75%, 92%)",
      tint: "hsl(48, 50%, 33%)",
      border: "hsl(50, 60%, 81%)",
      accent: "hsl(47, 55%, 52%)"
    },
    dark: {
      bg: "hsl(50, 30%, 12%)",
      tint: "hsl(52, 40%, 70%)",
      border: "hsl(50, 26%, 20%)",
      accent: "hsl(54, 55%, 68%)"
    }
  },
  {
    id: "mint",
    label: "Mint",
    light: {
      bg: "hsl(130, 48%, 93%)",
      tint: "hsl(132, 35%, 33%)",
      border: "hsl(130, 38%, 84%)",
      accent: "hsl(134, 42%, 58%)"
    },
    dark: {
      bg: "hsl(132, 26%, 12%)",
      tint: "hsl(130, 34%, 72%)",
      border: "hsl(132, 22%, 20%)",
      accent: "hsl(134, 48%, 70%)"
    }
  },
  {
    id: "emerald",
    label: "Emerald",
    light: {
      bg: "hsl(158, 50%, 93%)",
      tint: "hsl(160, 40%, 30%)",
      border: "hsl(158, 40%, 83%)",
      accent: "hsl(160, 45%, 54%)"
    },
    dark: {
      bg: "hsl(160, 28%, 11%)",
      tint: "hsl(158, 35%, 68%)",
      border: "hsl(160, 24%, 19%)",
      accent: "hsl(158, 48%, 66%)"
    }
  },
  {
    id: "teal",
    label: "Teal",
    light: {
      bg: "hsl(183, 55%, 93%)",
      tint: "hsl(185, 45%, 30%)",
      border: "hsl(183, 45%, 82%)",
      accent: "hsl(186, 48%, 54%)"
    },
    dark: {
      bg: "hsl(185, 30%, 11%)",
      tint: "hsl(183, 35%, 68%)",
      border: "hsl(185, 26%, 19%)",
      accent: "hsl(183, 48%, 66%)"
    }
  },
  {
    id: "sky",
    label: "Sky",
    light: {
      bg: "hsl(206, 70%, 94%)",
      tint: "hsl(208, 40%, 42%)",
      border: "hsl(206, 55%, 86%)",
      accent: "hsl(208, 60%, 66%)"
    },
    dark: {
      bg: "hsl(208, 32%, 13%)",
      tint: "hsl(206, 40%, 74%)",
      border: "hsl(208, 28%, 22%)",
      accent: "hsl(204, 58%, 74%)"
    }
  },
  {
    id: "indigo",
    label: "Indigo",
    light: {
      bg: "hsl(240, 65%, 96%)",
      tint: "hsl(242, 35%, 48%)",
      border: "hsl(240, 50%, 89%)",
      accent: "hsl(243, 55%, 70%)"
    },
    dark: {
      bg: "hsl(242, 26%, 15%)",
      tint: "hsl(240, 45%, 78%)",
      border: "hsl(242, 22%, 24%)",
      accent: "hsl(238, 58%, 78%)"
    }
  },
  {
    id: "violet",
    label: "Violet",
    light: {
      bg: "hsl(275, 65%, 96%)",
      tint: "hsl(275, 35%, 46%)",
      border: "hsl(275, 50%, 88%)",
      accent: "hsl(275, 55%, 70%)"
    },
    dark: {
      bg: "hsl(275, 26%, 15%)",
      tint: "hsl(275, 38%, 78%)",
      border: "hsl(275, 22%, 24%)",
      accent: "hsl(275, 58%, 78%)"
    }
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    light: {
      bg: "hsl(315, 60%, 95%)",
      tint: "hsl(315, 35%, 42%)",
      border: "hsl(315, 50%, 88%)",
      accent: "hsl(317, 55%, 68%)"
    },
    dark: {
      bg: "hsl(315, 28%, 14%)",
      tint: "hsl(315, 40%, 76%)",
      border: "hsl(315, 24%, 23%)",
      accent: "hsl(315, 58%, 76%)"
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
