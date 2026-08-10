// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CACHE_KEY } from "~/lib/storage"
import type { DayboardState } from "~/lib/types"

const stubChrome = ({
  get = async (key: string) => ({ [key]: undefined }),
  set = () => Promise.resolve()
}: {
  get?: (key: string) => Promise<Record<string, unknown>>
  set?: () => Promise<void>
} = {}) => {
  vi.stubGlobal("chrome", {
    storage: {
      sync: {
        get: vi.fn(get),
        set: vi.fn(set)
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
    }
  })
}

// Reads mirror themselves into localStorage, so without this a board cached by one test hydrates the next one's first render.
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  localStorage.clear()
})

describe("useDayboardState save failure handling", () => {
  it("rolls back the optimistic update and reports a save error", async () => {
    stubChrome({
      set: () => Promise.reject(new Error("QUOTA_BYTES quota exceeded"))
    })

    const { useDayboardState } = await import("./useDayboardState")
    const { result, unmount } = renderHook(() => useDayboardState())

    await waitFor(() => expect(result.current.state).not.toBeNull())
    const widgetsBefore = result.current.state!.widgets

    await act(async () => {
      await result.current.setWidgets([])
    })

    // The write rejected, so the board is restored and a notice is shown.
    expect(result.current.state!.widgets).toEqual(widgetsBefore)
    expect(result.current.saveError).toMatch(/save/i)

    act(() => result.current.dismissSaveError())
    expect(result.current.saveError).toBeNull()

    // Unmount while chrome is still stubbed so the watch cleanup is safe.
    unmount()
  })

  it("clears any prior save error on a successful write", async () => {
    stubChrome()

    const { useDayboardState } = await import("./useDayboardState")
    const { result, unmount } = renderHook(() => useDayboardState())

    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await result.current.setWidgets([])
    })

    expect(result.current.saveError).toBeNull()
    expect(result.current.state!.widgets).toEqual([])

    unmount()
  })
})

describe("useDayboardState load failure handling", () => {
  const cachedBoard: DayboardState = {
    widgets: [
      {
        id: "clock-1",
        kind: "clock",
        title: "Tokyo",
        colorPreset: "teal",
        settings: { timeZone: "Asia/Tokyo" }
      }
    ],
    settings: { name: "" }
  }

  it("reports a failed read when there is no cached board to show instead", async () => {
    stubChrome({ get: () => Promise.reject(new Error("Sync is unavailable")) })

    const { useDayboardState } = await import("./useDayboardState")
    const { result, unmount } = renderHook(() => useDayboardState())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.state).toBeNull()
    // What the read actually said is more use than the generic fallback, so it is carried through verbatim.
    expect(result.current.error).toBe("Sync is unavailable")

    unmount()
  })

  it("still has something to say when the read rejects with a non-Error", async () => {
    stubChrome({ get: () => Promise.reject("sync blew up") })

    const { useDayboardState } = await import("./useDayboardState")
    const { result, unmount } = renderHook(() => useDayboardState())

    await waitFor(() => expect(result.current.error).toBe("Unable to load data"))

    unmount()
  })

  it("keeps a cached board on screen when the read fails", async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedBoard))
    stubChrome({ get: () => Promise.reject(new Error("Sync is unavailable")) })

    const { useDayboardState } = await import("./useDayboardState")
    const { result, unmount } = renderHook(() => useDayboardState())

    // The localStorage mirror fills the first render, so the board never passes through a loading state.
    expect(result.current.isLoading).toBe(false)
    expect(result.current.state).toEqual(cachedBoard)

    // A timeout lands after every microtask the rejected read queues, so this is the earliest point an error could have been set.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // A transient sync failure with a board already on screen is not worth replacing that board with an error page.
    expect(result.current.error).toBeNull()
    expect(result.current.state).toEqual(cachedBoard)

    unmount()
  })
})
