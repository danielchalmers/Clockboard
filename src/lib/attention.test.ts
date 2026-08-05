import { describe, expect, it } from "vitest"

import {
  formatAttentionSummary,
  getAttentionIds,
  getAttentionToken,
  reconcileSeen
} from "./attention"
import { toDayKey } from "./habit"
import type { Widget } from "./types"

const now = new Date(2026, 5, 19, 9, 0, 0)
const ZONE = "America/Chicago"
const today = toDayKey(now)

const habit = (history: string[] = []): Widget => ({
  id: "walk",
  kind: "habit",
  title: "Daily walk",
  colorPreset: "amber",
  settings: { history }
})

const clock = (): Widget => ({
  id: "utc",
  kind: "clock",
  title: "UTC",
  colorPreset: "sky",
  settings: { timeZone: "UTC" }
})

const countdown = (targetAt: Date, repeat?: "weekly"): Widget => ({
  id: "launch",
  kind: "countdown",
  title: "Launch",
  colorPreset: "rose",
  settings: { targetAt: targetAt.toISOString(), repeat }
})

const ids = (widgets: Widget[], seen: Record<string, string> = {}, at = now) => [
  ...getAttentionIds(widgets, seen, at, ZONE)
]

describe("getAttentionIds", () => {
  it("flags a habit until today is marked", () => {
    expect(ids([habit()])).toEqual(["walk"])
    expect(ids([habit([today])])).toEqual([])
  })

  it("flags a countdown once it has run out, not before", () => {
    expect(ids([countdown(new Date(2026, 8, 1))])).toEqual([])
    expect(ids([countdown(new Date(2026, 0, 1))])).toEqual(["launch"])
  })

  it("re-flags a repeating countdown each time it rolls over", () => {
    const weekly = countdown(new Date(2026, 5, 1, 8, 0, 0), "weekly")
    const seen = { launch: getAttentionToken(weekly, now, ZONE)! }

    expect(ids([weekly], seen)).toEqual([])
    expect(ids([weekly], seen, new Date(2026, 5, 23))).toEqual(["launch"])
  })

  it("stays quiet for kinds that only change when the user changes them", () => {
    const quiet: Widget[] = [
      { id: "n", kind: "note", title: "N", colorPreset: "slate", settings: { text: "hi" } },
      {
        id: "q",
        kind: "quote",
        title: "Q",
        colorPreset: "sky",
        settings: { quotes: ["One"], rotation: "daily" }
      },
      {
        id: "s",
        kind: "stopwatch",
        title: "S",
        colorPreset: "slate",
        settings: { running: false, elapsedMs: 0, startedAt: null }
      },
      {
        id: "t",
        kind: "timer",
        title: "T",
        colorPreset: "slate",
        settings: { durationMs: 60_000, running: false, remainingMs: 0, endsAt: null }
      },
      // Archived cards are deliberately out of sight; they must not sit behind
      // the toggle asking to be looked at.
      { ...habit(), id: "archived", archived: true }
    ]

    expect(ids(quiet)).toEqual([])
  })

  it("stays quiet for a countdown whose target cannot be read", () => {
    const broken = {
      ...countdown(now),
      settings: { targetAt: "nonsense" }
    } as Widget

    expect(ids([broken])).toEqual([])
  })

  // A clock is a baseline: only a change to its offset (a daylight saving shift, or a machine that moved zones) is worth saying, so a first sighting is not.
  it("flags a clock only against a different recorded offset", () => {
    expect(ids([clock()])).toEqual([])
    expect(ids([clock()], { utc: `${ZONE}|0` })).toEqual([])
    expect(ids([clock()], { utc: `${ZONE}|60` })).toEqual(["utc"])
  })

  it("flags an acknowledged habit again once the day turns over", () => {
    const seen = { walk: today }

    expect(ids([habit()], seen)).toEqual([])
    expect(ids([habit()], seen, new Date(2026, 5, 20, 9, 0, 0))).toEqual(["walk"])
  })
})

describe("reconcileSeen", () => {
  it("records a baseline on first sight and leaves conditions alone", () => {
    expect(reconcileSeen([habit(), clock()], {}, now, ZONE)).toEqual({
      utc: `${ZONE}|0`
    })
  })

  it("never overwrites an existing record", () => {
    expect(reconcileSeen([clock()], { utc: `${ZONE}|60` }, now, ZONE)).toBeNull()
  })

  it("forgets widgets that no longer exist", () => {
    const seen = { walk: today, gone: "whatever" }

    expect(reconcileSeen([habit()], seen, now, ZONE)).toEqual({ walk: today })
    expect(reconcileSeen([], seen, now, ZONE)).toEqual({})
  })

  it("returns null when there is nothing to write", () => {
    expect(reconcileSeen([habit()], {}, now, ZONE)).toBeNull()
    expect(reconcileSeen([], {}, now, ZONE)).toBeNull()
  })
})

describe("formatAttentionSummary", () => {
  it("counts the cards, and says nothing when the board is settled", () => {
    expect(formatAttentionSummary(0)).toBeNull()
    expect(formatAttentionSummary(1)).toBe("1 card needs a look")
    expect(formatAttentionSummary(3)).toBe("3 cards need a look")
  })
})
