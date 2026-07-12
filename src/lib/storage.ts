import {
  DEFAULT_SETTINGS,
  DEFAULT_TIME_ZONE,
  createDefaultState,
  type DayboardSettings,
  type DayboardState,
  type Widget
} from "./types"
import { normalizeHistory } from "./habit"
import { isSupportedTimeZone } from "./time"
import { DEFAULT_TIMER_DURATION_MS, widgetRegistry } from "./widgets"

export const STORAGE_KEY = "dayboard-state"
export const CACHE_KEY = "dayboard-state-cache"

const hasWidgets = (value: unknown): value is { widgets: unknown[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { widgets?: unknown }).widgets)

// Keep only entries that look like widgets of a known kind, so a hand-edited or
// imported file with junk rows renders the valid widgets instead of blank cards.
const isValidWidget = (value: unknown): value is Widget =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Widget).id === "string" &&
  (value as Widget).kind in widgetRegistry

// Fill any missing or malformed fields with their defaults so a partial or
// hand-edited imported board still loads cleanly.
const normalizeSettings = (value: unknown): DayboardSettings => {
  const stored = (typeof value === "object" && value !== null
    ? value
    : {}) as Partial<DayboardSettings>

  return {
    name: typeof stored.name === "string" ? stored.name : DEFAULT_SETTINGS.name
  }
}

const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback

const asEpochOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null

const asEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T => (allowed.includes(value as T) ? (value as T) : fallback)

// The raw settings bag, tolerant of a missing or non-object value so a widget
// with no settings at all normalizes instead of throwing at read time.
const rawSettings = (widget: Widget): Record<string, unknown> => {
  const value = (widget as { settings?: unknown }).settings
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

// Repair each kind's settings so a hand-edited, corrupted, or cross-version
// board renders instead of crashing. isValidWidget only checks id + kind, so a
// known-kind widget can arrive with missing or wrong-typed settings; every card
// then reads those fields unconditionally (e.g. cleanQuotes(settings.quotes),
// destructuring settings, Intl with settings.timeZone) and a bad value throws,
// unmounting the whole board. Unknown fields are spread through first to keep
// newer boards forward-compatible; the fields the app relies on are then forced
// to safe values. Habit history is additionally pruned to the visible week (an
// unbounded legacy list eventually blew the sync per-item quota).
const normalizeWidget = (widget: Widget): Widget => {
  const s = rawSettings(widget)

  switch (widget.kind) {
    case "clock":
      return {
        ...widget,
        settings: {
          ...s,
          timeZone: isSupportedTimeZone(s.timeZone) ? s.timeZone : DEFAULT_TIME_ZONE
        }
      }
    case "countdown":
      return {
        ...widget,
        settings: {
          ...s,
          targetAt: asString(s.targetAt, new Date().toISOString()),
          display: asEnum(s.display, ["text", "progress"] as const, "text"),
          repeat: asEnum(
            s.repeat,
            ["none", "daily", "weekly", "monthly", "yearly"] as const,
            "none"
          )
        }
      }
    case "note":
      return { ...widget, settings: { ...s, text: asString(s.text, "") } }
    case "quote":
      return {
        ...widget,
        settings: {
          ...s,
          quotes: Array.isArray(s.quotes)
            ? s.quotes.filter((quote): quote is string => typeof quote === "string")
            : [],
          rotation: asEnum(s.rotation, ["daily", "open"] as const, "daily")
        }
      }
    case "stopwatch":
      return {
        ...widget,
        settings: {
          ...s,
          running: asBoolean(s.running, false),
          elapsedMs: asFiniteNumber(s.elapsedMs, 0),
          startedAt: asEpochOrNull(s.startedAt)
        }
      }
    case "timer": {
      const durationMs = asFiniteNumber(s.durationMs, DEFAULT_TIMER_DURATION_MS)
      return {
        ...widget,
        settings: {
          ...s,
          durationMs,
          running: asBoolean(s.running, false),
          remainingMs: asFiniteNumber(s.remainingMs, durationMs),
          endsAt: asEpochOrNull(s.endsAt),
          chime: asBoolean(s.chime, false)
        }
      }
    }
    case "habit":
      return { ...widget, settings: { ...s, history: normalizeHistory(s.history) } }
  }
}

const normalizeState = (value: unknown): DayboardState => {
  if (!hasWidgets(value)) {
    return createDefaultState()
  }

  return {
    widgets: value.widgets.filter(isValidWidget).map(normalizeWidget),
    settings: normalizeSettings((value as { settings?: unknown }).settings)
  }
}

// chrome.storage.sync reads are async IPC, so every new tab would open blank
// for a few frames while waiting on them. Mirroring the last-known board into
// localStorage lets the first render hydrate synchronously; the authoritative
// sync read then reconciles anything that changed on another device.
const cacheDayboardState = (state: DayboardState) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    // Best effort — an unavailable or full localStorage only costs speed.
  }
}

export const readCachedDayboardState = (): DayboardState | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)

    return cached === null ? null : normalizeState(JSON.parse(cached))
  } catch {
    return null
  }
}

export const readDayboardState = async (): Promise<DayboardState> => {
  const result = await chrome.storage.sync.get(STORAGE_KEY)
  const state = normalizeState(result[STORAGE_KEY])

  cacheDayboardState(state)

  return state
}

// Pretty-printed JSON for the Export option.
export const serializeDayboardState = (state: DayboardState): string =>
  JSON.stringify(state, null, 2)

// Parse an exported file back into state for the Import option. Throws on
// invalid JSON or a payload that is not a board, so callers can reject the file
// rather than silently replacing the board with defaults.
export const parseDayboardState = (text: string): DayboardState => {
  const parsed: unknown = JSON.parse(text)

  if (!hasWidgets(parsed)) {
    throw new Error("That file is not a Dayboard board.")
  }

  return normalizeState(parsed)
}

export const writeDayboardState = async (
  state: DayboardState
): Promise<void> => {
  await chrome.storage.sync.set({ [STORAGE_KEY]: state })
  cacheDayboardState(state)
}

export const watchDayboardState = (
  listener: (state: DayboardState) => void
): (() => void) => {
  const handleStorageChange = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "sync") {
      return
    }

    const change = changes[STORAGE_KEY]
    if (!change) {
      return
    }

    const state = normalizeState(change.newValue)

    cacheDayboardState(state)
    listener(state)
  }

  chrome.storage.onChanged.addListener(handleStorageChange)

  return () => chrome.storage.onChanged.removeListener(handleStorageChange)
}
