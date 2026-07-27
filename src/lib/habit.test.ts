import { describe, expect, it } from "vitest"

import {
  formatWeekRange,
  isDoneOn,
  normalizeHistory,
  startOfWeek,
  STORED_DAYS,
  toDayKey,
  toggleDay,
  weekdayInitials,
  weekDays,
  weekStartDay
} from "./habit"

// A Friday, so the Sunday-first and Monday-first weeks start on different days.
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

describe("toggleDay", () => {
  it("adds a day when missing and removes it when present", () => {
    const added = toggleDay([], now)
    expect(added).toEqual([key(0)])
    expect(toggleDay(added, now)).toEqual([])
  })

  it("marks an earlier day without touching today", () => {
    const result = toggleDay([key(0)], day(-3))

    expect(result).toEqual([key(-3), key(0)])
  })

  it("keeps only the newest week of entries", () => {
    const crowded = Array.from({ length: 20 }, (_, offset) => key(-offset - 1))

    const result = toggleDay(crowded, now)

    expect(result).toHaveLength(STORED_DAYS)
    expect(result).toContain(key(0))
    expect(result).not.toContain(key(-20))
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
      Array.from({ length: STORED_DAYS }, (_, i) => key(i - STORED_DAYS + 1))
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

describe("weekStartDay", () => {
  it("reads the first weekday from the locale", () => {
    expect(weekStartDay("en-US")).toBe(0)
    expect(weekStartDay("en-GB")).toBe(1)
    expect(weekStartDay("fr-FR")).toBe(1)
  })

  it("falls back to Sunday for a locale it cannot parse", () => {
    expect(weekStartDay("not a locale")).toBe(0)
  })
})

describe("startOfWeek", () => {
  it("rolls back to the locale's first weekday at midnight", () => {
    expect(toDayKey(startOfWeek(now, 0))).toBe("2026-06-14")
    expect(toDayKey(startOfWeek(now, 1))).toBe("2026-06-15")
    expect(startOfWeek(now, 0).getHours()).toBe(0)
  })

  it("keeps a day that is already the first weekday", () => {
    const sunday = new Date(2026, 5, 14, 22, 0, 0)

    expect(toDayKey(startOfWeek(sunday, 0))).toBe("2026-06-14")
  })
})

describe("weekDays", () => {
  it("runs the whole week today falls in, past today", () => {
    expect(weekDays(now, 0).map(toDayKey)).toEqual([
      "2026-06-14",
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20"
    ])
  })

  it("shifts with a Monday-first locale", () => {
    const week = weekDays(now, 1).map(toDayKey)

    expect(week[0]).toBe("2026-06-15")
    expect(week[6]).toBe("2026-06-21")
  })

  it("never draws a day the history has already pruned", () => {
    expect(normalizeHistory(weekDays(now, 1).map(toDayKey))).toHaveLength(
      STORED_DAYS
    )
  })
})

describe("formatWeekRange", () => {
  it("reads as a date range and folds a shared month", () => {
    expect(formatWeekRange(weekDays(now, 0))).toMatch(/Jun 14\s*–\s*20/)
    expect(formatWeekRange(weekDays(new Date(2026, 6, 1), 0))).toMatch(
      /Jun 28\s*–\s*Jul 4/
    )
    expect(formatWeekRange([])).toBe("")
  })
})

describe("weekdayInitials", () => {
  it("starts on the locale's first weekday", () => {
    expect(weekdayInitials(0)).toEqual(["S", "M", "T", "W", "T", "F", "S"])
    expect(weekdayInitials(1)).toEqual(["M", "T", "W", "T", "F", "S", "S"])
  })
})
