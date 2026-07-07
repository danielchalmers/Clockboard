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

// One neutral anchor plus eleven hues spaced around the wheel, ordered
// spectrally so the picker reads as a gradient. Backgrounds carry a real wash
// of color, and accents sit at full saturation so progress bars, habit dots,
// and swatches pop instead of receding.
export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: "slate",
    label: "Slate",
    light: {
      bg: "hsl(220, 25%, 96%)",
      tint: "hsl(220, 15%, 42%)",
      border: "hsl(220, 20%, 87%)",
      accent: "hsl(220, 30%, 30%)"
    },
    dark: {
      bg: "hsl(220, 18%, 13%)",
      tint: "hsl(220, 12%, 68%)",
      border: "hsl(220, 14%, 22%)",
      accent: "hsl(220, 25%, 82%)"
    }
  },
  {
    id: "rose",
    label: "Rose",
    light: {
      bg: "hsl(347, 90%, 95%)",
      tint: "hsl(347, 60%, 42%)",
      border: "hsl(347, 75%, 87%)",
      accent: "hsl(347, 85%, 50%)"
    },
    dark: {
      bg: "hsl(347, 45%, 13%)",
      tint: "hsl(347, 65%, 73%)",
      border: "hsl(347, 40%, 22%)",
      accent: "hsl(347, 90%, 68%)"
    }
  },
  {
    id: "coral",
    label: "Coral",
    light: {
      bg: "hsl(14, 90%, 95%)",
      tint: "hsl(14, 60%, 40%)",
      border: "hsl(14, 75%, 85%)",
      accent: "hsl(14, 85%, 50%)"
    },
    dark: {
      bg: "hsl(14, 45%, 13%)",
      tint: "hsl(14, 65%, 72%)",
      border: "hsl(14, 40%, 22%)",
      accent: "hsl(14, 90%, 66%)"
    }
  },
  {
    id: "amber",
    label: "Amber",
    light: {
      bg: "hsl(38, 95%, 93%)",
      tint: "hsl(33, 70%, 36%)",
      border: "hsl(38, 80%, 82%)",
      accent: "hsl(33, 95%, 42%)"
    },
    dark: {
      bg: "hsl(35, 50%, 12%)",
      tint: "hsl(38, 70%, 68%)",
      border: "hsl(35, 45%, 20%)",
      accent: "hsl(40, 95%, 60%)"
    }
  },
  {
    id: "lemon",
    label: "Lemon",
    light: {
      bg: "hsl(52, 95%, 92%)",
      tint: "hsl(48, 80%, 30%)",
      border: "hsl(50, 80%, 78%)",
      accent: "hsl(46, 95%, 38%)"
    },
    dark: {
      bg: "hsl(50, 45%, 11%)",
      tint: "hsl(52, 65%, 65%)",
      border: "hsl(50, 40%, 19%)",
      accent: "hsl(54, 95%, 58%)"
    }
  },
  {
    id: "mint",
    label: "Mint",
    light: {
      bg: "hsl(130, 65%, 94%)",
      tint: "hsl(132, 60%, 28%)",
      border: "hsl(130, 55%, 82%)",
      accent: "hsl(134, 70%, 36%)"
    },
    dark: {
      bg: "hsl(132, 40%, 11%)",
      tint: "hsl(130, 50%, 68%)",
      border: "hsl(132, 35%, 19%)",
      accent: "hsl(134, 75%, 58%)"
    }
  },
  {
    id: "emerald",
    label: "Emerald",
    light: {
      bg: "hsl(158, 70%, 93%)",
      tint: "hsl(160, 75%, 25%)",
      border: "hsl(158, 55%, 80%)",
      accent: "hsl(160, 90%, 32%)"
    },
    dark: {
      bg: "hsl(160, 45%, 10%)",
      tint: "hsl(158, 55%, 62%)",
      border: "hsl(160, 40%, 18%)",
      accent: "hsl(158, 80%, 52%)"
    }
  },
  {
    id: "teal",
    label: "Teal",
    light: {
      bg: "hsl(183, 75%, 93%)",
      tint: "hsl(185, 80%, 26%)",
      border: "hsl(183, 60%, 79%)",
      accent: "hsl(186, 95%, 31%)"
    },
    dark: {
      bg: "hsl(185, 50%, 10%)",
      tint: "hsl(183, 55%, 62%)",
      border: "hsl(185, 45%, 18%)",
      accent: "hsl(183, 85%, 52%)"
    }
  },
  {
    id: "sky",
    label: "Sky",
    light: {
      bg: "hsl(206, 95%, 95%)",
      tint: "hsl(208, 70%, 38%)",
      border: "hsl(206, 80%, 85%)",
      accent: "hsl(208, 95%, 46%)"
    },
    dark: {
      bg: "hsl(208, 55%, 12%)",
      tint: "hsl(206, 65%, 70%)",
      border: "hsl(208, 48%, 21%)",
      accent: "hsl(204, 95%, 62%)"
    }
  },
  {
    id: "indigo",
    label: "Indigo",
    light: {
      bg: "hsl(240, 90%, 96%)",
      tint: "hsl(242, 55%, 47%)",
      border: "hsl(240, 75%, 89%)",
      accent: "hsl(243, 80%, 56%)"
    },
    dark: {
      bg: "hsl(242, 40%, 14%)",
      tint: "hsl(240, 65%, 76%)",
      border: "hsl(242, 35%, 24%)",
      accent: "hsl(238, 90%, 72%)"
    }
  },
  {
    id: "violet",
    label: "Violet",
    light: {
      bg: "hsl(275, 90%, 96%)",
      tint: "hsl(275, 55%, 44%)",
      border: "hsl(275, 70%, 88%)",
      accent: "hsl(275, 80%, 52%)"
    },
    dark: {
      bg: "hsl(275, 40%, 14%)",
      tint: "hsl(275, 55%, 75%)",
      border: "hsl(275, 35%, 23%)",
      accent: "hsl(275, 85%, 70%)"
    }
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    light: {
      bg: "hsl(315, 85%, 95%)",
      tint: "hsl(315, 60%, 40%)",
      border: "hsl(315, 70%, 87%)",
      accent: "hsl(317, 85%, 48%)"
    },
    dark: {
      bg: "hsl(315, 45%, 13%)",
      tint: "hsl(315, 60%, 73%)",
      border: "hsl(315, 40%, 22%)",
      accent: "hsl(315, 90%, 67%)"
    }
  }
]

// A random hue for newly created widgets, so every new card arrives already
// looking at home on the board. Neutral slate is skipped — it reads as "no
// color chosen" — but stays available in the picker as a deliberate choice.
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
