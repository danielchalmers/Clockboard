import { randomColorPreset } from "./colors"
import {
  DEFAULT_TIME_ZONE,
  type ClockWidget,
  type CountdownRepeat,
  type CountdownWidget,
  type NoteWidget,
  type QuoteWidget,
  type HabitWidget,
  type StopwatchWidget,
  type TimerWidget,
  type Widget,
  type WidgetKind
} from "./types"

const DEFAULT_TIMER_DURATION_MS = 5 * 60 * 1000

export interface WidgetDefinition<K extends WidgetKind> {
  kind: K
  editor: {
    targetLabel?: string
  }
  createDefault: (now?: Date) => Extract<Widget, { kind: K }>
  /**
   * Rebuild this kind's settings from an untrusted stored value, keeping every
   * usable field and falling back to defaults for the rest, so a hand-edited or
   * imported board renders instead of crashing a widget body mid-render.
   */
  normalizeSettings: (value: unknown) => Extract<Widget, { kind: K }>["settings"]
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}

const finiteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const finiteNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null

const createClockWidget = (): ClockWidget => ({
  id: crypto.randomUUID(),
  kind: "clock",
  title: "New clock",
  colorPreset: randomColorPreset(),
  settings: {
    timeZone: DEFAULT_TIME_ZONE
  }
})

// A time zone must be one Intl actually accepts — the formatter constructor
// throws on anything else, which would take down the whole render.
const isUsableTimeZone = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return true
  } catch {
    return false
  }
}

const normalizeClockSettings = (value: unknown): ClockWidget["settings"] => {
  const stored = asRecord(value)

  return {
    timeZone: isUsableTimeZone(stored.timeZone)
      ? stored.timeZone
      : DEFAULT_TIME_ZONE
  }
}

const createCountdownWidget = (now = new Date()): CountdownWidget => {
  const target = new Date(now)
  target.setHours(target.getHours() + 1, 0, 0, 0)

  return {
    id: crypto.randomUUID(),
    kind: "countdown",
    title: "New countdown",
    colorPreset: randomColorPreset(),
    settings: {
      targetAt: target.toISOString()
    }
  }
}

const COUNTDOWN_REPEATS: CountdownRepeat[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly"
]

const normalizeCountdownSettings = (
  value: unknown
): CountdownWidget["settings"] => {
  const stored = asRecord(value)

  // A string target is kept even when it isn't a parseable date — the display
  // helpers already degrade to "Invalid target" — so only a missing or
  // non-string target falls back to the default anchor.
  const settings: CountdownWidget["settings"] = {
    targetAt:
      typeof stored.targetAt === "string"
        ? stored.targetAt
        : createCountdownWidget().settings.targetAt
  }

  if (stored.display === "text" || stored.display === "progress") {
    settings.display = stored.display
  }

  if (typeof stored.startAt === "string") {
    settings.startAt = stored.startAt
  }

  if (COUNTDOWN_REPEATS.includes(stored.repeat as CountdownRepeat)) {
    settings.repeat = stored.repeat as CountdownRepeat
  }

  return settings
}

const createNoteWidget = (): NoteWidget => ({
  id: crypto.randomUUID(),
  kind: "note",
  title: "New note",
  colorPreset: randomColorPreset(),
  settings: {
    text: ""
  }
})

const normalizeNoteSettings = (value: unknown): NoteWidget["settings"] => {
  const stored = asRecord(value)

  return {
    text: typeof stored.text === "string" ? stored.text : ""
  }
}

const createQuoteWidget = (): QuoteWidget => ({
  id: crypto.randomUUID(),
  kind: "quote",
  title: "Daily quote",
  colorPreset: randomColorPreset(),
  settings: {
    quotes: [
      "The secret of getting ahead is getting started.",
      "Small steps every day.",
      "Done is better than perfect."
    ],
    rotation: "daily"
  }
})

const normalizeQuoteSettings = (value: unknown): QuoteWidget["settings"] => {
  const stored = asRecord(value)

  return {
    // An unusable list becomes empty rather than the starter quotes — the
    // widget then invites the user to add their own instead of showing lines
    // they never wrote.
    quotes: Array.isArray(stored.quotes)
      ? stored.quotes.filter((quote): quote is string => typeof quote === "string")
      : [],
    rotation: stored.rotation === "open" ? "open" : "daily"
  }
}

const createStopwatchWidget = (): StopwatchWidget => ({
  id: crypto.randomUUID(),
  kind: "stopwatch",
  title: "Stopwatch",
  colorPreset: randomColorPreset(),
  settings: {
    running: false,
    elapsedMs: 0,
    startedAt: null
  }
})

const normalizeStopwatchSettings = (
  value: unknown
): StopwatchWidget["settings"] => {
  const stored = asRecord(value)
  const startedAt = finiteNumberOrNull(stored.startedAt)
  // "Running" without a valid start moment is unrecoverable, so such a
  // stopwatch lands paused at its banked time instead.
  const running = stored.running === true && startedAt !== null

  return {
    running,
    elapsedMs: Math.max(0, finiteNumber(stored.elapsedMs, 0)),
    startedAt: running ? startedAt : null
  }
}

const createHabitWidget = (): HabitWidget => ({
  id: crypto.randomUUID(),
  kind: "habit",
  title: "New habit",
  colorPreset: randomColorPreset(),
  settings: {
    history: []
  }
})

const normalizeHabitSettings = (value: unknown): HabitWidget["settings"] => {
  const stored = asRecord(value)

  return {
    history: Array.isArray(stored.history)
      ? stored.history.filter((day): day is string => typeof day === "string")
      : []
  }
}

const createTimerWidget = (): TimerWidget => ({
  id: crypto.randomUUID(),
  kind: "timer",
  title: "Timer",
  colorPreset: randomColorPreset(),
  settings: {
    durationMs: DEFAULT_TIMER_DURATION_MS,
    running: false,
    remainingMs: DEFAULT_TIMER_DURATION_MS,
    endsAt: null,
    chime: false
  }
})

const normalizeTimerSettings = (value: unknown): TimerWidget["settings"] => {
  const stored = asRecord(value)
  const storedDuration = finiteNumber(stored.durationMs, 0)
  const durationMs = storedDuration > 0 ? storedDuration : DEFAULT_TIMER_DURATION_MS
  const endsAt = finiteNumberOrNull(stored.endsAt)
  // "Running" without a valid end moment is unrecoverable, so such a timer
  // lands paused with its remaining time intact.
  const running = stored.running === true && endsAt !== null

  return {
    durationMs,
    running,
    remainingMs: Math.max(0, finiteNumber(stored.remainingMs, durationMs)),
    endsAt: running ? endsAt : null,
    chime: stored.chime === true
  }
}

export const widgetRegistry: {
  [K in WidgetKind]: WidgetDefinition<K>
} = {
  clock: {
    kind: "clock",
    editor: {},
    createDefault: createClockWidget,
    normalizeSettings: normalizeClockSettings
  },
  countdown: {
    kind: "countdown",
    editor: {
      targetLabel: "When"
    },
    createDefault: createCountdownWidget,
    normalizeSettings: normalizeCountdownSettings
  },
  note: {
    kind: "note",
    editor: {},
    createDefault: createNoteWidget,
    normalizeSettings: normalizeNoteSettings
  },
  quote: {
    kind: "quote",
    editor: {},
    createDefault: createQuoteWidget,
    normalizeSettings: normalizeQuoteSettings
  },
  stopwatch: {
    kind: "stopwatch",
    editor: {},
    createDefault: createStopwatchWidget,
    normalizeSettings: normalizeStopwatchSettings
  },
  timer: {
    kind: "timer",
    editor: {},
    createDefault: createTimerWidget,
    normalizeSettings: normalizeTimerSettings
  },
  habit: {
    kind: "habit",
    editor: {},
    createDefault: createHabitWidget,
    normalizeSettings: normalizeHabitSettings
  }
}

export const createWidget = <K extends WidgetKind>(
  kind: K,
  now = new Date()
): Extract<Widget, { kind: K }> => widgetRegistry[kind].createDefault(now)

export const moveWidgetToIndex = (
  widgets: Widget[],
  fromIndex: number,
  toIndex: number
): Widget[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= widgets.length ||
    toIndex >= widgets.length
  ) {
    return widgets
  }

  const nextWidgets = [...widgets]
  const [widget] = nextWidgets.splice(fromIndex, 1)

  if (!widget) {
    return widgets
  }

  nextWidgets.splice(toIndex, 0, widget)
  return nextWidgets
}

// Move an active (non-archived) widget one step up or down relative to the
// other active widgets. The board only shows active widgets, and archived ones
// are not guaranteed to sit after them in storage — a widget added once
// something is archived lands past it — so the menu's Move back/next must
// against the visible neighbor rather than the raw array neighbor (which could
// be a hidden archived widget, making the move a silent no-op).
export const moveActiveWidget = (
  widgets: Widget[],
  id: string,
  direction: -1 | 1
): Widget[] => {
  const active = widgets.filter((widget) => !widget.archived)
  const fromIndex = active.findIndex((widget) => widget.id === id)

  if (fromIndex === -1) {
    return widgets
  }

  const neighbor = active[fromIndex + direction]

  if (!neighbor) {
    return widgets
  }

  return reorderWidgets(widgets, id, neighbor.id)
}

export const reorderWidgets = (
  widgets: Widget[],
  activeId: string,
  overId: string
): Widget[] => {
  if (activeId === overId) {
    return widgets
  }

  const fromIndex = widgets.findIndex((widget) => widget.id === activeId)
  const toIndex = widgets.findIndex((widget) => widget.id === overId)

  return moveWidgetToIndex(widgets, fromIndex, toIndex)
}

// Archiving moves the widget to the end so the active widgets stay a contiguous
// block at the front. That keeps index-based moves (the menu's Move back/next)
// lined up with what is actually on the board.
export const archiveWidget = (widgets: Widget[], id: string): Widget[] => {
  const target = widgets.find((widget) => widget.id === id)

  if (!target || target.archived) {
    return widgets
  }

  return [
    ...widgets.filter((widget) => widget.id !== id),
    { ...target, archived: true }
  ]
}

// Restoring drops the widget back in just after the last active widget, so it
// rejoins the bottom of the board rather than the top. When `beforeId` names an
// active widget — the board card an archived one was dropped onto — the widget
// takes that card's slot instead, pushing it and everything after one step down.
export const restoreWidget = (
  widgets: Widget[],
  id: string,
  beforeId?: string
): Widget[] => {
  const target = widgets.find((widget) => widget.id === id)

  if (!target || !target.archived) {
    return widgets
  }

  const rest = widgets.filter((widget) => widget.id !== id)
  const restored = { ...target, archived: false }

  let insertAt = beforeId
    ? rest.findIndex((widget) => widget.id === beforeId && !widget.archived)
    : -1

  if (insertAt === -1) {
    insertAt = 0
    rest.forEach((widget, index) => {
      if (!widget.archived) {
        insertAt = index + 1
      }
    })
  }

  return [...rest.slice(0, insertAt), restored, ...rest.slice(insertAt)]
}
