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

// Widget bodies destructure their settings during render, so every widget must
// come out of normalization with the fields its kind relies on — otherwise a
// hand-edited or imported file blanks the whole new tab.
describe("widget settings repair", () => {
  const importWidgets = async (widgets: unknown[]) => {
    const { parseDayboardState } = await import("./storage")

    return parseDayboardState(JSON.stringify({ widgets })).widgets
  }

  const widget = (kind: string, settings?: unknown) => ({
    id: `${kind}-1`,
    kind,
    title: "Widget",
    colorPreset: "sky",
    settings
  })

  it("fills every kind's missing settings with renderable defaults", async () => {
    const kinds = [
      "clock",
      "countdown",
      "note",
      "quote",
      "stopwatch",
      "timer",
      "habit"
    ]
    const widgets = await importWidgets(kinds.map((kind) => widget(kind)))

    expect(widgets.map(({ settings }) => settings)).toMatchObject([
      { timeZone: DEFAULT_TIME_ZONE },
      { targetAt: expect.any(String) },
      { text: "" },
      { quotes: expect.any(Array), rotation: "daily" },
      { running: false, elapsedMs: 0, startedAt: null },
      { durationMs: 300_000, running: false, remainingMs: 300_000, endsAt: null },
      { history: [] }
    ])
  })

  it("replaces junk-typed fields with defaults and keeps the usable ones", async () => {
    const [habit, clock, timer, note] = await importWidgets([
      widget("habit", { history: "2026-01-01" }),
      widget("clock", { timeZone: "Mars/Olympus_Mons" }),
      widget("timer", { durationMs: "soon", remainingMs: 30_000 }),
      widget("note", null)
    ])

    expect(habit!.settings).toEqual({ history: [] })
    expect(clock!.settings).toEqual({ timeZone: DEFAULT_TIME_ZONE })
    expect(timer!.settings).toMatchObject({
      durationMs: 300_000,
      remainingMs: 30_000
    })
    expect(note!.settings).toEqual({ text: "" })
  })

  it("blanks a title that is not a string", async () => {
    const [habit] = await importWidgets([
      { ...widget("habit", { history: [] }), title: { nested: "junk" } }
    ])

    expect(habit).toMatchObject({ title: "", settings: { history: [] } })
  })

  it("passes valid widgets through untouched, optional fields included", async () => {
    const widgets: DayboardState["widgets"] = [
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
        id: "s",
        kind: "stopwatch",
        title: "Stopwatch",
        colorPreset: "sky",
        settings: { running: true, elapsedMs: 1000, startedAt: 1_700_000_000_000 }
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
