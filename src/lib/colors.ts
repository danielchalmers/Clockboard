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
// Both modes share one warm temperament: light washes sit a touch creamier than full pastel, and dark washes carry real chroma over the charcoal ground instead of fading to gray.
// Accents have body without reaching neon — saturated enough to clearly own their hue, soft enough not to glow against a dark card.
export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: "slate",
    label: "Slate",
    light: {
      bg: "hsl(220, 18%, 96%)",
      tint: "hsl(220, 14%, 42%)",
      border: "hsl(220, 15%, 86%)",
      accent: "hsl(220, 28%, 31%)"
    },
    dark: {
      bg: "hsl(222, 12%, 15%)",
      tint: "hsl(220, 12%, 70%)",
      border: "hsl(222, 11%, 24%)",
      accent: "hsl(220, 22%, 82%)"
    }
  },
  {
    id: "rose",
    label: "Rose",
    light: {
      bg: "hsl(347, 78%, 94%)",
      tint: "hsl(347, 56%, 42%)",
      border: "hsl(347, 60%, 86%)",
      accent: "hsl(347, 78%, 50%)"
    },
    dark: {
      bg: "hsl(348, 38%, 15%)",
      tint: "hsl(347, 62%, 76%)",
      border: "hsl(348, 34%, 25%)",
      accent: "hsl(347, 82%, 69%)"
    }
  },
  {
    id: "coral",
    label: "Coral",
    light: {
      bg: "hsl(15, 80%, 93.5%)",
      tint: "hsl(14, 58%, 40%)",
      border: "hsl(15, 64%, 84%)",
      accent: "hsl(14, 80%, 50%)"
    },
    dark: {
      bg: "hsl(14, 40%, 15%)",
      tint: "hsl(14, 65%, 75%)",
      border: "hsl(14, 36%, 25%)",
      accent: "hsl(13, 85%, 66%)"
    }
  },
  {
    id: "amber",
    label: "Amber",
    light: {
      bg: "hsl(38, 86%, 92%)",
      tint: "hsl(34, 64%, 36%)",
      border: "hsl(38, 70%, 80%)",
      accent: "hsl(35, 90%, 44%)"
    },
    dark: {
      bg: "hsl(36, 42%, 14%)",
      tint: "hsl(38, 60%, 70%)",
      border: "hsl(36, 38%, 23%)",
      accent: "hsl(40, 88%, 60%)"
    }
  },
  {
    id: "lemon",
    label: "Lemon",
    light: {
      bg: "hsl(51, 82%, 91%)",
      tint: "hsl(48, 72%, 30%)",
      border: "hsl(50, 66%, 77%)",
      accent: "hsl(46, 88%, 38%)"
    },
    dark: {
      bg: "hsl(49, 38%, 13%)",
      tint: "hsl(52, 58%, 68%)",
      border: "hsl(49, 34%, 22%)",
      accent: "hsl(52, 85%, 58%)"
    }
  },
  {
    id: "mint",
    label: "Mint",
    light: {
      bg: "hsl(134, 52%, 92%)",
      tint: "hsl(134, 56%, 28%)",
      border: "hsl(134, 44%, 80%)",
      accent: "hsl(138, 64%, 36%)"
    },
    dark: {
      bg: "hsl(142, 30%, 13%)",
      tint: "hsl(134, 45%, 70%)",
      border: "hsl(140, 28%, 22%)",
      accent: "hsl(140, 62%, 60%)"
    }
  },
  {
    id: "emerald",
    label: "Emerald",
    light: {
      bg: "hsl(159, 56%, 92%)",
      tint: "hsl(160, 68%, 25%)",
      border: "hsl(158, 45%, 78%)",
      accent: "hsl(160, 82%, 32%)"
    },
    dark: {
      bg: "hsl(162, 32%, 12%)",
      tint: "hsl(158, 50%, 66%)",
      border: "hsl(161, 29%, 21%)",
      accent: "hsl(158, 68%, 55%)"
    }
  },
  {
    id: "teal",
    label: "Teal",
    light: {
      bg: "hsl(183, 60%, 92%)",
      tint: "hsl(185, 72%, 26%)",
      border: "hsl(183, 48%, 78%)",
      accent: "hsl(186, 86%, 31%)"
    },
    dark: {
      bg: "hsl(187, 36%, 12%)",
      tint: "hsl(183, 50%, 66%)",
      border: "hsl(186, 32%, 21%)",
      accent: "hsl(183, 72%, 55%)"
    }
  },
  {
    id: "sky",
    label: "Sky",
    light: {
      bg: "hsl(206, 80%, 94%)",
      tint: "hsl(208, 62%, 38%)",
      border: "hsl(206, 62%, 84%)",
      accent: "hsl(207, 82%, 46%)"
    },
    dark: {
      bg: "hsl(209, 38%, 15%)",
      tint: "hsl(206, 60%, 74%)",
      border: "hsl(209, 34%, 25%)",
      accent: "hsl(205, 85%, 66%)"
    }
  },
  {
    id: "indigo",
    label: "Indigo",
    light: {
      bg: "hsl(240, 72%, 95%)",
      tint: "hsl(242, 50%, 47%)",
      border: "hsl(240, 58%, 88%)",
      accent: "hsl(243, 72%, 56%)"
    },
    dark: {
      bg: "hsl(244, 30%, 16%)",
      tint: "hsl(240, 60%, 79%)",
      border: "hsl(243, 28%, 26%)",
      accent: "hsl(238, 80%, 74%)"
    }
  },
  {
    id: "violet",
    label: "Violet",
    light: {
      bg: "hsl(276, 72%, 95%)",
      tint: "hsl(276, 50%, 44%)",
      border: "hsl(276, 56%, 87%)",
      accent: "hsl(275, 72%, 52%)"
    },
    dark: {
      bg: "hsl(278, 30%, 16%)",
      tint: "hsl(275, 55%, 78%)",
      border: "hsl(277, 28%, 26%)",
      accent: "hsl(274, 75%, 72%)"
    }
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    light: {
      bg: "hsl(315, 70%, 94%)",
      tint: "hsl(315, 56%, 40%)",
      border: "hsl(315, 56%, 86%)",
      accent: "hsl(317, 78%, 48%)"
    },
    dark: {
      bg: "hsl(316, 38%, 15%)",
      tint: "hsl(315, 58%, 76%)",
      border: "hsl(316, 34%, 25%)",
      accent: "hsl(315, 82%, 68%)"
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
