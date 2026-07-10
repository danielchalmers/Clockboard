import { afterEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_TIME_ZONE, type DayboardState } from "./types"

const STORAGE_KEY = "dayboard-state"

const sampleState: DayboardState = {
  widgets: [
    {
      id: "clock-1",
      kind: "clock",
      title: "Tokyo",
      colorPreset: "teal",
      settings: {
        timeZone: "Asia/Tokyo"
      }
    }
  ],
  settings: {
    name: ""
  }
}

const stubChromeStorage = () => {
  const store = new Map<string, unknown>()
  const addListener = vi.fn()
  const removeListener = vi.fn()

  vi.stubGlobal("chrome", {
    storage: {
      sync: {
        get: vi.fn(async (key: string) => ({ [key]: store.get(key) })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.entries(items).forEach(([key, value]) => store.set(key, value))
        })
      },
      onChanged: {
        addListener,
        removeListener
      }
    }
  })

  return { store, addListener, removeListener }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  localStorage.clear()
})

describe("readDayboardState", () => {
  it("returns the default widgets when nothing is stored", async () => {
    stubChromeStorage()

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    expect(state.widgets.map((widget) => widget.kind)).toEqual([
      "clock",
      "countdown",
      "note",
      "quote",
      "habit",
      "countdown"
    ])
  })

  it("returns the stored state when present", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, sampleState)

    const { readDayboardState } = await import("./storage")

    expect(await readDayboardState()).toEqual(sampleState)
  })

  it("falls back to defaults when the stored value is malformed", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, "not-an-object")

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    expect(state.widgets).toHaveLength(6)
    expect(state.settings).toEqual({ name: "" })
  })

  it("fills in default settings for state stored before settings existed", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, { widgets: sampleState.widgets })

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    expect(state.widgets).toEqual(sampleState.widgets)
    expect(state.settings).toEqual({ name: "" })
  })

  it("drops malformed widget entries while keeping valid ones", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, {
      widgets: [
        sampleState.widgets[0],
        { id: "x", kind: "totally-unknown", settings: {} },
        { kind: "clock" },
        "nonsense"
      ]
    })

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    expect(state.widgets).toEqual(sampleState.widgets)
  })

  it("sanitizes malformed settings fields back to their defaults", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, {
      widgets: sampleState.widgets,
      settings: { name: 7 }
    })

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    expect(state.settings).toEqual({ name: "" })
  })
})

describe("serializeDayboardState / parseDayboardState", () => {
  it("round-trips a board through JSON", async () => {
    const { serializeDayboardState, parseDayboardState } = await import(
      "./storage"
    )

    expect(parseDayboardState(serializeDayboardState(sampleState))).toEqual(
      sampleState
    )
  })

  it("fills defaults for a board missing settings", async () => {
    const { parseDayboardState } = await import("./storage")

    const parsed = parseDayboardState(
      JSON.stringify({ widgets: sampleState.widgets })
    )

    expect(parsed.widgets).toEqual(sampleState.widgets)
    expect(parsed.settings).toEqual(sampleState.settings)
  })

  it("rejects invalid JSON and non-board payloads", async () => {
    const { parseDayboardState } = await import("./storage")

    expect(() => parseDayboardState("{ not json")).toThrow()
    expect(() => parseDayboardState(JSON.stringify({ nope: true }))).toThrow()
  })
})

// Widget bodies destructure their settings during render, so every repaired
// widget must come out of normalization with the full shape its kind expects —
// otherwise a hand-edited or imported file blanks the whole new tab.
describe("widget settings repair", () => {
  const importWidgets = async (widgets: unknown[]) => {
    const { parseDayboardState } = await import("./storage")

    return parseDayboardState(JSON.stringify({ widgets })).widgets
  }

  it("rebuilds settings for a widget imported without any", async () => {
    const [habit] = await importWidgets([
      { id: "x", kind: "habit", title: "t", colorPreset: "amber" }
    ])

    expect(habit).toMatchObject({
      id: "x",
      kind: "habit",
      settings: { history: [] }
    })
  })

  it("rebuilds settings when they are null", async () => {
    const [note] = await importWidgets([
      { id: "n", kind: "note", title: "Note", colorPreset: "mint", settings: null }
    ])

    expect(note).toMatchObject({ settings: { text: "" } })
  })

  it("resets a habit history that is not an array and drops non-string days", async () => {
    const [notArray, mixed] = await importWidgets([
      {
        id: "h1",
        kind: "habit",
        title: "Habit",
        colorPreset: "amber",
        settings: { history: "2026-01-01" }
      },
      {
        id: "h2",
        kind: "habit",
        title: "Habit",
        colorPreset: "amber",
        settings: { history: ["2026-01-01", 5, null] }
      }
    ])

    expect(notArray).toMatchObject({ settings: { history: [] } })
    expect(mixed).toMatchObject({ settings: { history: ["2026-01-01"] } })
  })

  it("fills each kind's missing required fields with defaults", async () => {
    const bare = (id: string, kind: string) => ({
      id,
      kind,
      title: "Widget",
      colorPreset: "sky",
      settings: {}
    })

    const [clock, countdown, note, quote, stopwatch, timer] =
      await importWidgets([
        bare("c", "clock"),
        bare("cd", "countdown"),
        bare("n", "note"),
        bare("q", "quote"),
        bare("s", "stopwatch"),
        bare("t", "timer")
      ])

    expect(clock).toMatchObject({ settings: { timeZone: DEFAULT_TIME_ZONE } })
    expect(note).toMatchObject({ settings: { text: "" } })
    expect(quote).toMatchObject({ settings: { quotes: [], rotation: "daily" } })
    expect(stopwatch).toMatchObject({
      settings: { running: false, elapsedMs: 0, startedAt: null }
    })
    expect(timer).toMatchObject({
      settings: {
        durationMs: 5 * 60 * 1000,
        running: false,
        remainingMs: 5 * 60 * 1000,
        endsAt: null,
        chime: false
      }
    })

    const targetAt = (
      countdown as Extract<DayboardState["widgets"][number], { kind: "countdown" }>
    ).settings.targetAt
    expect(Number.isNaN(new Date(targetAt).getTime())).toBe(false)
  })

  it("replaces a time zone Intl cannot format with the local default", async () => {
    const [clock] = await importWidgets([
      {
        id: "c",
        kind: "clock",
        title: "Clock",
        colorPreset: "sky",
        settings: { timeZone: "Mars/Olympus_Mons" }
      }
    ])

    expect(clock).toMatchObject({ settings: { timeZone: DEFAULT_TIME_ZONE } })
  })

  it("pauses a running stopwatch or timer that lost its time anchor", async () => {
    const [stopwatch, timer] = await importWidgets([
      {
        id: "s",
        kind: "stopwatch",
        title: "Stopwatch",
        colorPreset: "teal",
        settings: { running: true, elapsedMs: 1500 }
      },
      {
        id: "t",
        kind: "timer",
        title: "Timer",
        colorPreset: "rose",
        settings: { running: true, durationMs: 60_000, remainingMs: 30_000 }
      }
    ])

    expect(stopwatch).toMatchObject({
      settings: { running: false, elapsedMs: 1500, startedAt: null }
    })
    expect(timer).toMatchObject({
      settings: {
        running: false,
        durationMs: 60_000,
        remainingMs: 30_000,
        endsAt: null
      }
    })
  })

  it("blanks a title that is not a string", async () => {
    const [habit] = await importWidgets([
      {
        id: "h",
        kind: "habit",
        title: { nested: "junk" },
        colorPreset: "amber",
        settings: { history: [] }
      }
    ])

    expect(habit).toMatchObject({ title: "", settings: { history: [] } })
  })

  it("passes fully valid widgets of every kind through untouched", async () => {
    const widgets: DayboardState["widgets"] = [
      {
        id: "c",
        kind: "clock",
        title: "Tokyo",
        colorPreset: "teal",
        settings: { timeZone: "Asia/Tokyo" }
      },
      {
        id: "cd",
        kind: "countdown",
        title: "Launch",
        colorPreset: "rose",
        settings: {
          targetAt: "2027-01-01T00:00:00.000Z",
          startAt: "2026-01-01T00:00:00.000Z",
          display: "progress",
          repeat: "yearly"
        }
      },
      {
        id: "n",
        kind: "note",
        title: "Note",
        colorPreset: "mint",
        settings: { text: "hello" }
      },
      {
        id: "q",
        kind: "quote",
        title: "Quotes",
        colorPreset: "violet",
        settings: { quotes: ["one", "two"], rotation: "open" }
      },
      {
        id: "s",
        kind: "stopwatch",
        title: "Stopwatch",
        colorPreset: "sky",
        settings: { running: true, elapsedMs: 1000, startedAt: 1_700_000_000_000 }
      },
      {
        id: "t",
        kind: "timer",
        title: "Timer",
        colorPreset: "amber",
        settings: {
          durationMs: 60_000,
          running: true,
          remainingMs: 45_000,
          endsAt: 1_700_000_045_000,
          chime: true
        }
      },
      {
        id: "h",
        kind: "habit",
        title: "Habit",
        colorPreset: "emerald",
        settings: { history: ["2026-07-08"] }
      }
    ]

    expect(await importWidgets(widgets)).toEqual(widgets)
  })
})

describe("writeDayboardState", () => {
  it("stores the state object under the storage key", async () => {
    const { store } = stubChromeStorage()

    const { writeDayboardState } = await import("./storage")
    await writeDayboardState(sampleState)

    expect(store.get(STORAGE_KEY)).toEqual(sampleState)
  })
})

describe("readCachedDayboardState", () => {
  it("returns null before anything has been cached", async () => {
    stubChromeStorage()

    const { readCachedDayboardState } = await import("./storage")

    expect(readCachedDayboardState()).toBeNull()
  })

  it("mirrors reads and writes so the next load is synchronous", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, sampleState)

    const { readCachedDayboardState, readDayboardState, writeDayboardState } =
      await import("./storage")

    await readDayboardState()
    expect(readCachedDayboardState()).toEqual(sampleState)

    const renamed = {
      ...sampleState,
      settings: { ...sampleState.settings, name: "Dan" }
    }
    await writeDayboardState(renamed)
    expect(readCachedDayboardState()).toEqual(renamed)
  })

  it("returns null when the cached value is corrupt", async () => {
    stubChromeStorage()

    const { CACHE_KEY, readCachedDayboardState } = await import("./storage")
    localStorage.setItem(CACHE_KEY, "{ not json")

    expect(readCachedDayboardState()).toBeNull()
  })
})

describe("watchDayboardState", () => {
  it("notifies on sync changes and unsubscribes on stop", async () => {
    const { addListener, removeListener } = stubChromeStorage()

    const { watchDayboardState } = await import("./storage")
    const handleChange = vi.fn()
    const stopWatching = watchDayboardState(handleChange)

    const listener = addListener.mock.calls[0]?.[0]
    expect(listener).toBeTypeOf("function")

    listener?.({ [STORAGE_KEY]: { newValue: sampleState } }, "sync")
    expect(handleChange).toHaveBeenCalledWith(sampleState)

    handleChange.mockClear()
    listener?.({ [STORAGE_KEY]: { newValue: sampleState } }, "local")
    expect(handleChange).not.toHaveBeenCalled()

    stopWatching()
    expect(removeListener).toHaveBeenCalledWith(listener)
  })
})
