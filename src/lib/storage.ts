import {
  DEFAULT_SETTINGS,
  createDefaultState,
  type CountdownWidget,
  type DayboardSettings,
  type DayboardState,
  type Widget
} from "./types"
import { normalizeHistory } from "./habit"
import { normalizeTasks } from "./todo"
import { widgetRegistry } from "./widgets"

export const STORAGE_KEY = "dayboard-state"
export const CACHE_KEY = "dayboard-state-cache"
export const ATTENTION_KEY = "dayboard-attention-seen"

const hasWidgets = (value: unknown): value is { widgets: unknown[] } =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { widgets?: unknown }).widgets)

// Keep only entries that look like widgets of a known kind, so a hand-edited or imported file with junk rows renders the valid widgets instead of blank cards.
const isValidWidget = (value: unknown): value is Widget =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Widget).id === "string" &&
  (value as Widget).kind in widgetRegistry

// Fill any missing or malformed fields with their defaults so a partial or hand-edited imported board still loads cleanly.
const normalizeSettings = (value: unknown): DayboardSettings => {
  const stored = (typeof value === "object" && value !== null
    ? value
    : {}) as Partial<DayboardSettings>

  return {
    name: typeof stored.name === "string" ? stored.name : DEFAULT_SETTINGS.name
  }
}

// Countdowns used to carry a `display` setting choosing between the remaining time and a progress bar; a start date is now the only switch.
// Boards written before that still carry the key, so retire it on read, dropping the start alongside it when the card was set to text, which would otherwise come back as a bar the owner never asked for.
const normalizeCountdown = (widget: CountdownWidget): CountdownWidget => {
  const { display, startAt, ...settings } = widget.settings as
    CountdownWidget["settings"] & { display?: string }

  if (display === undefined) {
    return widget
  }

  return display === "progress"
    ? { ...widget, settings: { ...settings, startAt } }
    : { ...widget, settings }
}

// Habit history used to be stored unbounded, every completed day key, which after a year or two of use is large enough that two habits blow the sync per-item quota and every save of the board fails.
// Prune to the visible week on read so existing boards shrink the first time they load.
// Todo lists are held to the same limits the card enforces, so an imported file cannot arrive carrying more than a board can save.
const normalizeWidget = (widget: Widget): Widget => {
  if (widget.kind === "habit") {
    return {
      ...widget,
      settings: { history: normalizeHistory(widget.settings.history) }
    }
  }

  if (widget.kind === "todo") {
    return {
      ...widget,
      settings: { tasks: normalizeTasks(widget.settings.tasks) }
    }
  }

  return widget.kind === "countdown" ? normalizeCountdown(widget) : widget
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

// chrome.storage.sync reads are async IPC, so every new tab would open blank for a few frames while waiting on them.
// Mirroring the last-known board into localStorage lets the first render hydrate synchronously; the authoritative sync read then reconciles anything that changed on another device.
const cacheDayboardState = (state: DayboardState) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    // Best effort: an unavailable or full localStorage only costs speed.
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

// What each card looked like the last time this browser saw it, so a card can say "something moved here" on the next new tab.
// Device-local on purpose: "have I seen this" is a per-machine question (the system time zone signal literally is), and it changes far too often to spend the sync write budget the board itself needs.
// Losing it costs one extra flagged card, so both directions are best effort.
export const readSeenAttention = (): Record<string, string> => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(ATTENTION_KEY) || "")

    return typeof stored === "object" && stored !== null
      ? (Object.fromEntries(
          Object.entries(stored).filter(([, token]) => typeof token === "string")
        ) as Record<string, string>)
      : {}
  } catch {
    return {}
  }
}

export const writeSeenAttention = (seen: Record<string, string>) => {
  try {
    localStorage.setItem(ATTENTION_KEY, JSON.stringify(seen))
  } catch {
    // Best effort: a full or unavailable localStorage only costs a re-flag.
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

// Parse an exported file back into state for the Import option.
// Throws on invalid JSON or a payload that is not a board, so callers can reject the file rather than silently replacing the board with defaults.
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
