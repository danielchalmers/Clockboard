import { describe, expect, it } from "vitest"

import {
  currentStreak,
  decodeHistory,
  encodeHistory,
  normalizeHistory,
  recentDays,
  toDayKey,
  toggleToday
} from "./habit"

const now = new Date(2026, 5, 19, 9, 0, 0)
const key = (offset: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  return toDayKey(d)
}

describe("encodeHistory / decodeHistory", () => {
  it("round-trips a sparse set of days, sorted and deduplicated", () => {
    const days = [key(0), key(-3), key(-40), key(-3)]

    expect(decodeHistory(encodeHistory(days))).toEqual([
      key(-40),
      key(-3),
      key(0)
    ])
  })

  it("round-trips an empty history as the empty string", () => {
    expect(encodeHistory([])).toBe("")
    expect(decodeHistory("")).toEqual([])
  })

  it("drops entries that are not day keys when encoding", () => {
    expect(decodeHistory(encodeHistory(["junk", key(0), "2026-1-2"]))).toEqual([
      key(0)
    ])
  })

  it("decodes malformed input to an empty history instead of throwing", () => {
    expect(decodeHistory("not-encoded")).toEqual([])
    expect(decodeHistory("2026-06-19|???not-base64???")).toEqual([])
    expect(decodeHistory("junk|AQ==")).toEqual([])
  })

  it("keeps a full 400-day history tiny", () => {
    const days = Array.from({ length: 400 }, (_, offset) => key(-offset))

    const encoded = encodeHistory(days)

    expect(encoded.length).toBeLessThan(90)
    expect(decodeHistory(encoded)).toHaveLength(400)
  })
})

describe("normalizeHistory", () => {
  it("migrates the legacy day-key array form", () => {
    expect(normalizeHistory([key(-1), key(0)])).toBe(
      encodeHistory([key(-1), key(0)])
    )
  })

  it("keeps an already-encoded history as is", () => {
    const encoded = encodeHistory([key(-2), key(0)])

    expect(normalizeHistory(encoded)).toBe(encoded)
  })

  it("normalizes junk to an empty history", () => {
    expect(normalizeHistory(undefined)).toBe("")
    expect(normalizeHistory(7)).toBe("")
    expect(normalizeHistory("garbage")).toBe("")
    expect(normalizeHistory([42, null])).toBe("")
  })
})

describe("toggleToday", () => {
  it("adds today when missing and removes it when present", () => {
    const added = toggleToday("", now)
    expect(decodeHistory(added)).toEqual([key(0)])
    expect(toggleToday(added, now)).toBe("")
  })

  it("prunes history older than the retention window", () => {
    const result = decodeHistory(
      toggleToday(encodeHistory([key(-500), key(-10)]), now)
    )

    expect(result).toContain(key(-10))
    expect(result).toContain(key(0))
    expect(result).not.toContain(key(-500))
  })
})

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(encodeHistory([key(-2), key(-1), key(0)]), now)).toBe(
      3
    )
  })

  it("keeps yesterday's streak alive before today is done", () => {
    expect(currentStreak(encodeHistory([key(-2), key(-1)]), now)).toBe(2)
  })

  it("breaks when the most recent day is older than yesterday", () => {
    expect(currentStreak(encodeHistory([key(-3), key(-2)]), now)).toBe(0)
  })

  it("ignores gaps further back", () => {
    expect(currentStreak(encodeHistory([key(-5), key(-1), key(0)]), now)).toBe(
      2
    )
  })

  it("is zero with no history", () => {
    expect(currentStreak("", now)).toBe(0)
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
