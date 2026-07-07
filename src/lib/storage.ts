import {
  DEFAULT_SETTINGS,
  createDefaultState,
  type DayboardSettings,
  type DayboardState,
  type Widget
} from "./types"
import { widgetRegistry } from "./widgets"

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

const normalizeState = (value: unknown): DayboardState => {
  if (!hasWidgets(value)) {
    return createDefaultState()
  }

  return {
    widgets: value.widgets.filter(isValidWidget),
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
