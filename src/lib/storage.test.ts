import { afterEach, describe, expect, it, vi } from "vitest"

import { STORED_DAYS, toDayKey } from "./habit"
import type {
  CountdownWidget,
  DayboardState,
  HabitWidget,
  TodoWidget
} from "./types"

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

  it("prunes a legacy unbounded habit history down to the visible week", async () => {
    // Ten months of daily completions, the shape old versions accumulated.
    const base = new Date(2026, 6, 9)
    const days = Array.from({ length: 300 }, (_, offset) => {
      const d = new Date(base)
      d.setDate(d.getDate() - offset)
      return toDayKey(d)
    })
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, {
      widgets: [
        {
          id: "habit-1",
          kind: "habit",
          title: "Read",
          colorPreset: "amber",
          settings: { history: days }
        }
      ]
    })

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    const habit = state.widgets[0] as HabitWidget
    expect(habit.settings.history).toHaveLength(STORED_DAYS)
    expect(habit.settings.history).toContain("2026-07-09")
    expect(habit.settings.history).toContain("2026-07-03")
    expect(habit.settings.history).not.toContain("2026-07-02")
  })

  it("cleans up a todo list from an imported or hand-edited board", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, {
      widgets: [
        {
          id: "todo-1",
          kind: "todo",
          title: "Today",
          colorPreset: "mint",
          settings: {
            tasks: [{ id: "a", text: "  Buy milk  ", done: true }, "not a task"]
          }
        }
      ]
    })

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()

    expect((state.widgets[0] as TodoWidget).settings.tasks).toEqual([
      { id: "a", text: "Buy milk", done: true }
    ])
  })

  it("retires a legacy countdown display setting", async () => {
    const { store } = stubChromeStorage()
    store.set(STORAGE_KEY, {
      widgets: [
        {
          id: "kept",
          kind: "countdown",
          title: "Year",
          colorPreset: "rose",
          settings: {
            targetAt: "2026-12-31T00:00:00.000Z",
            startAt: "2026-01-01T00:00:00.000Z",
            display: "progress"
          }
        },
        {
          id: "dropped",
          kind: "countdown",
          title: "Launch",
          colorPreset: "indigo",
          settings: {
            targetAt: "2026-12-31T00:00:00.000Z",
            startAt: "2026-01-01T00:00:00.000Z",
            display: "text"
          }
        }
      ]
    })

    const { readDayboardState } = await import("./storage")
    const state = await readDayboardState()
    const [kept, dropped] = state.widgets as CountdownWidget[]

    // The old key goes either way; a card that was showing text keeps showing
    // it rather than turning into a bar it never had.
    expect(kept!.settings).toEqual({
      targetAt: "2026-12-31T00:00:00.000Z",
      startAt: "2026-01-01T00:00:00.000Z"
    })
    expect(dropped!.settings).toEqual({
      targetAt: "2026-12-31T00:00:00.000Z"
    })
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

describe("writeDayboardState", () => {
  it("stores the state object under the storage key", async () => {
    const { store } = stubChromeStorage()

    const { writeDayboardState } = await import("./storage")
    await writeDayboardState(sampleState)

    expect(store.get(STORAGE_KEY)).toEqual(sampleState)
  })

  // chrome.storage.sync rejects any single item over QUOTA_BYTES_PER_ITEM
  // (8192 bytes of key + serialized value), and the whole board lives under
  // one key — so even a board packed with habits at their fullest must stay
  // under it or every save starts failing.
  it("keeps a board of full habit histories under the sync per-item quota", async () => {
    const QUOTA_BYTES_PER_ITEM = 8192
    const fullHistory = Array.from({ length: STORED_DAYS }, (_, offset) => {
      const d = new Date(2026, 6, 9)
      d.setDate(d.getDate() - offset)
      return toDayKey(d)
    })
    const habits: HabitWidget[] = Array.from({ length: 10 }, (_, index) => ({
      id: crypto.randomUUID(),
      kind: "habit",
      title: `A habit with a fairly long title ${index}`,
      colorPreset: "amber",
      settings: { history: fullHistory }
    }))
    const state: DayboardState = {
      widgets: habits,
      settings: { name: "Dan" }
    }

    const { store } = stubChromeStorage()
    const { writeDayboardState } = await import("./storage")
    await writeDayboardState(state)

    const stored = JSON.stringify(store.get(STORAGE_KEY))
    expect(STORAGE_KEY.length + stored.length).toBeLessThan(
      QUOTA_BYTES_PER_ITEM
    )
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
