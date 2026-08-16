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
// The palette is pastel in the pigment-plus-white sense: light mode keeps each hue's saturation and raises lightness, so washes read as milky color rather than gray.
// Dark mode inverts where the pastel lives: grounds are dusty near-neutrals (a whisper of hue over charcoal) and the accents are the milky chips — light and clearly hued — so dots and buttons carry the pastel feeling.
// Dark tints and accents are tuned to at least 4.5:1 against their ground (most sit well above), so meta text and chips stay crisp on the dark washes.
// Tints are the exception in both modes — they set body text, so they stay contrast-first.
export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: "slate",
    label: "Slate",
    light: {
      bg: "hsl(220, 24%, 96%)",
      tint: "hsl(220, 14%, 43%)",
      border: "hsl(220, 18%, 88%)",
      accent: "hsl(220, 22%, 44%)"
    },
    dark: {
      bg: "hsl(220, 12%, 14%)",
      tint: "hsl(220, 14%, 75%)",
      border: "hsl(220, 14%, 27%)",
      accent: "hsl(220, 26%, 84%)"
    }
  },
  {
    id: "rose",
    label: "Rose",
    light: {
      bg: "hsl(347, 85%, 94%)",
      tint: "hsl(347, 50%, 42%)",
      border: "hsl(347, 70%, 86%)",
      accent: "hsl(347, 80%, 67%)"
    },
    dark: {
      bg: "hsl(347, 20%, 13%)",
      tint: "hsl(347, 55%, 80%)",
      border: "hsl(347, 24%, 28%)",
      accent: "hsl(347, 75%, 80%)"
    }
  },
  {
    id: "coral",
    label: "Coral",
    light: {
      bg: "hsl(14, 88%, 93%)",
      tint: "hsl(14, 50%, 40%)",
      border: "hsl(14, 72%, 85%)",
      accent: "hsl(14, 80%, 65%)"
    },
    dark: {
      bg: "hsl(14, 20%, 13%)",
      tint: "hsl(14, 50%, 78%)",
      border: "hsl(14, 24%, 27%)",
      accent: "hsl(14, 72%, 78%)"
    }
  },
  {
    id: "amber",
    label: "Amber",
    light: {
      bg: "hsl(39, 90%, 92%)",
      tint: "hsl(33, 60%, 36%)",
      border: "hsl(39, 75%, 82%)",
      accent: "hsl(35, 80%, 55%)"
    },
    dark: {
      bg: "hsl(36, 20%, 13%)",
      tint: "hsl(38, 55%, 78%)",
      border: "hsl(36, 24%, 27%)",
      accent: "hsl(42, 75%, 78%)"
    }
  },
  {
    id: "lemon",
    label: "Lemon",
    light: {
      bg: "hsl(52, 90%, 90%)",
      tint: "hsl(48, 65%, 30%)",
      border: "hsl(50, 75%, 79%)",
      accent: "hsl(46, 75%, 48%)"
    },
    dark: {
      bg: "hsl(50, 18%, 12%)",
      tint: "hsl(52, 50%, 76%)",
      border: "hsl(50, 22%, 26%)",
      accent: "hsl(54, 70%, 75%)"
    }
  },
  {
    id: "mint",
    label: "Mint",
    light: {
      bg: "hsl(130, 60%, 92%)",
      tint: "hsl(132, 48%, 30%)",
      border: "hsl(130, 48%, 82%)",
      accent: "hsl(134, 50%, 58%)"
    },
    dark: {
      bg: "hsl(132, 16%, 12%)",
      tint: "hsl(130, 40%, 78%)",
      border: "hsl(132, 20%, 26%)",
      accent: "hsl(134, 55%, 76%)"
    }
  },
  {
    id: "emerald",
    label: "Emerald",
    light: {
      bg: "hsl(158, 62%, 92%)",
      tint: "hsl(160, 58%, 27%)",
      border: "hsl(158, 50%, 81%)",
      accent: "hsl(160, 60%, 48%)"
    },
    dark: {
      bg: "hsl(160, 20%, 12%)",
      tint: "hsl(158, 45%, 76%)",
      border: "hsl(160, 24%, 26%)",
      accent: "hsl(158, 55%, 74%)"
    }
  },
  {
    id: "teal",
    label: "Teal",
    light: {
      bg: "hsl(183, 68%, 92%)",
      tint: "hsl(185, 62%, 28%)",
      border: "hsl(183, 55%, 80%)",
      accent: "hsl(186, 60%, 48%)"
    },
    dark: {
      bg: "hsl(185, 22%, 12%)",
      tint: "hsl(183, 45%, 76%)",
      border: "hsl(185, 26%, 26%)",
      accent: "hsl(183, 55%, 74%)"
    }
  },
  {
    id: "sky",
    label: "Sky",
    light: {
      bg: "hsl(206, 88%, 93%)",
      tint: "hsl(208, 55%, 40%)",
      border: "hsl(206, 72%, 85%)",
      accent: "hsl(208, 78%, 64%)"
    },
    dark: {
      bg: "hsl(208, 24%, 13%)",
      tint: "hsl(206, 50%, 79%)",
      border: "hsl(208, 28%, 28%)",
      accent: "hsl(204, 75%, 79%)"
    }
  },
  {
    id: "indigo",
    label: "Indigo",
    light: {
      bg: "hsl(240, 85%, 95%)",
      tint: "hsl(242, 45%, 48%)",
      border: "hsl(240, 68%, 88%)",
      accent: "hsl(243, 72%, 70%)"
    },
    dark: {
      bg: "hsl(242, 20%, 14%)",
      tint: "hsl(240, 52%, 82%)",
      border: "hsl(242, 24%, 29%)",
      accent: "hsl(238, 72%, 82%)"
    }
  },
  {
    id: "violet",
    label: "Violet",
    light: {
      bg: "hsl(275, 85%, 95%)",
      tint: "hsl(275, 48%, 44%)",
      border: "hsl(275, 65%, 87%)",
      accent: "hsl(275, 70%, 68%)"
    },
    dark: {
      bg: "hsl(275, 20%, 14%)",
      tint: "hsl(275, 46%, 81%)",
      border: "hsl(275, 24%, 28%)",
      accent: "hsl(275, 65%, 81%)"
    }
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    light: {
      bg: "hsl(315, 80%, 94%)",
      tint: "hsl(315, 50%, 40%)",
      border: "hsl(315, 65%, 86%)",
      accent: "hsl(316, 72%, 64%)"
    },
    dark: {
      bg: "hsl(315, 20%, 13%)",
      tint: "hsl(315, 48%, 79%)",
      border: "hsl(315, 24%, 27%)",
      accent: "hsl(315, 68%, 79%)"
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
