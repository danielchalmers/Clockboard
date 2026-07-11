import { describe, expect, it } from "vitest"

import {
  isDoneOn,
  normalizeHistory,
  recentDays,
  toDayKey,
  toggleToday,
  VISIBLE_DAYS
} from "./habit"

const now = new Date(2026, 5, 19, 9, 0, 0)
const key = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return toDayKey(d)
}
const day = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return d
}

describe("toggleToday", () => {
  it("adds today when missing and removes it when present", () => {
    const added = toggleToday([], now)
    expect(added).toEqual([key(0)])
    expect(toggleToday(added, now)).toEqual([])
  })

  it("keeps only the newest week of entries", () => {
    const crowded = Array.from({ length: 10 }, (_, offset) => key(-offset - 1))

    const result = toggleToday(crowded, now)

    expect(result).toHaveLength(VISIBLE_DAYS)
    expect(result).toContain(key(0))
    expect(result).not.toContain(key(-10))
  })
})

describe("isDoneOn", () => {
  it("is true only for days in the history", () => {
    const history = [key(-2), key(0)]

    expect(isDoneOn(history, day(0))).toBe(true)
    expect(isDoneOn(history, day(-2))).toBe(true)
    expect(isDoneOn(history, day(-1))).toBe(false)
    expect(isDoneOn([], day(0))).toBe(false)
  })
})

describe("normalizeHistory", () => {
  it("prunes a legacy unbounded history to the visible week", () => {
    const years = Array.from({ length: 400 }, (_, offset) => key(-offset))

    const result = normalizeHistory(years)

    expect(result).toEqual(
      Array.from({ length: VISIBLE_DAYS }, (_, i) => key(i - VISIBLE_DAYS + 1))
    )
  })

  it("drops entries that are not day keys and deduplicates", () => {
    expect(normalizeHistory([42, "junk", key(0), key(0), "2026-1-2"])).toEqual([
      key(0)
    ])
  })

  it("normalizes junk to an empty history", () => {
    expect(normalizeHistory(undefined)).toEqual([])
    expect(normalizeHistory("garbage")).toEqual([])
    expect(normalizeHistory({ streakStart: key(0) })).toEqual([])
  })
})

describe("recentDays", () => {
  it("returns the last N days, oldest first, ending today", () => {
    const days = recentDays(now, 7).map(toDayKey)
    expect(days).toHaveLength(7)
    expect(days[6]).toBe(key(0))
    expect(days[0]).toBe(key(-6))
  })
})
