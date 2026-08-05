import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useAttention } from "./useAttention"
import { ATTENTION_KEY, readSeenAttention } from "~/lib/storage"
import { toDayKey } from "~/lib/habit"
import type { Widget } from "~/lib/types"

const now = new Date(2026, 5, 19, 9, 0, 0)

const habit: Widget = {
  id: "walk",
  kind: "habit",
  title: "Daily walk",
  colorPreset: "amber",
  settings: { history: [] }
}

const clock: Widget = {
  id: "paris",
  kind: "clock",
  title: "Paris",
  colorPreset: "sky",
  settings: { timeZone: "Europe/Paris" }
}

const renderAt = (widgets: Widget[] | null, at = now) =>
  renderHook(({ items, when }: { items: Widget[] | null; when: Date }) =>
    useAttention(items, when), { initialProps: { items: widgets, when: at } })

afterEach(() => localStorage.clear())

describe("useAttention", () => {
  it("settles a card when acknowledged, and persists that", () => {
    const { result } = renderAt([habit])
    expect([...result.current.attentionIds]).toEqual(["walk"])

    act(() => result.current.acknowledge("walk"))

    expect([...result.current.attentionIds]).toEqual([])
    expect(readSeenAttention().walk).toBe(toDayKey(now))
  })

  it("records a clock quietly at first and flags it once its offset moves", () => {
    const { result, rerender } = renderAt([clock], new Date("2026-01-15T12:00Z"))

    expect([...result.current.attentionIds]).toEqual([])
    expect(readSeenAttention().paris).toContain("|60")

    // Summer time moves Paris an hour; that is the change worth saying.
    rerender({ items: [clock], when: new Date("2026-07-15T12:00Z") })
    expect([...result.current.attentionIds]).toEqual(["paris"])
  })

  it("ignores an acknowledgement for a card that is not asking for one", () => {
    const done: Widget = { ...habit, settings: { history: [toDayKey(now)] } }
    const { result } = renderAt([done])

    act(() => result.current.acknowledge("walk"))
    act(() => result.current.acknowledge("nonexistent"))

    expect(readSeenAttention()).toEqual({})
  })

  // The memoized board rows compare this by identity; one that changed per tick would re-render every card every second.
  it("keeps one acknowledge identity across renders", () => {
    const { result, rerender } = renderAt([habit])
    const first = result.current.acknowledge

    rerender({ items: [habit], when: new Date(now.getTime() + 1000) })

    expect(result.current.acknowledge).toBe(first)
  })

  it("writes nothing while the board is still loading", () => {
    renderAt(null)

    expect(localStorage.getItem(ATTENTION_KEY)).toBeNull()
  })
})
