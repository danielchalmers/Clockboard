import { describe, expect, it } from "vitest"

import {
  dateTimeInputValueToIsoInstant,
  formatRelativeCountdown,
  getCountdownParts,
  getCountdownProgress,
  getLastElapsedCountdownTarget,
  getTimeZoneOffsetMinutes,
  isSameLocalDay,
  isoInstantToDateTimeInputValue,
  resolveCountdown
} from "./time"
import type { CountdownRepeat, CountdownWidget } from "./types"

const countdownWidget = (
  targetAt: string,
  settings: Partial<CountdownWidget["settings"]> = {}
): CountdownWidget => ({
  id: "launch",
  kind: "countdown",
  title: "Launch",
  colorPreset: "slate",
  settings: {
    targetAt,
    ...settings
  }
})

const nextCountdownTarget = (
  targetAt: string,
  repeat: CountdownRepeat | undefined,
  now: Date
): string =>
  resolveCountdown(countdownWidget(targetAt, { repeat }), now).settings.targetAt

describe("isSameLocalDay", () => {
  it("is true for two instants on the same local day", () => {
    expect(
      isSameLocalDay(new Date(2026, 2, 2, 0, 0, 0), new Date(2026, 2, 2, 23, 59, 59))
    ).toBe(true)
  })

  it("is false a minute either side of local midnight", () => {
    expect(
      isSameLocalDay(new Date(2026, 2, 2, 23, 59, 0), new Date(2026, 2, 3, 0, 1, 0))
    ).toBe(false)
  })

  it("separates the same day number in different months and years", () => {
    expect(
      isSameLocalDay(new Date(2026, 2, 2, 12, 0, 0), new Date(2026, 3, 2, 12, 0, 0))
    ).toBe(false)
    expect(
      isSameLocalDay(new Date(2025, 2, 2, 12, 0, 0), new Date(2026, 2, 2, 12, 0, 0))
    ).toBe(false)
  })
})

describe("resolveCountdown", () => {
  const now = new Date(2026, 5, 19, 12, 0, 0)
  const DAY = 24 * 60 * 60 * 1000

  it("leaves a non-repeating or still-future target unchanged", () => {
    const past = new Date(2020, 0, 1, 9, 0, 0).toISOString()
    const future = new Date(2026, 11, 25, 9, 0, 0).toISOString()

    expect(nextCountdownTarget(past, "none", now)).toBe(past)
    expect(nextCountdownTarget(past, undefined, now)).toBe(past)
    expect(nextCountdownTarget(future, "weekly", now)).toBe(future)
  })

  it("rolls a daily target to the next future day, keeping the time", () => {
    const target = new Date(2026, 5, 17, 9, 0, 0).toISOString()
    const next = new Date(nextCountdownTarget(target, "daily", now))

    expect(next.getTime()).toBeGreaterThan(now.getTime())
    expect(next.getHours()).toBe(9)
    expect(next.getTime() - now.getTime()).toBeLessThanOrEqual(DAY)
  })

  it("rolls a weekly target to within a week", () => {
    const target = new Date(2026, 4, 4, 8, 0, 0).toISOString()
    const next = new Date(nextCountdownTarget(target, "weekly", now))

    expect(next.getTime()).toBeGreaterThan(now.getTime())
    expect(next.getDay()).toBe(new Date(target).getDay())
    expect(next.getTime() - now.getTime()).toBeLessThanOrEqual(7 * DAY)
  })

  it("rolls a yearly target to the same month and day next year", () => {
    const target = new Date(2025, 11, 25, 9, 0, 0).toISOString()
    const next = new Date(nextCountdownTarget(target, "yearly", now))

    expect(next.getTime()).toBeGreaterThan(now.getTime())
    expect(next.getMonth()).toBe(11)
    expect(next.getDate()).toBe(25)
    expect(next.getFullYear()).toBe(2026)
  })

  it("rolls an hourly target to the top of the coming hour", () => {
    // Years of missed occurrences resolve in one step rather than iterating.
    const target = new Date(2024, 0, 1, 8, 30, 0).toISOString()
    const next = new Date(nextCountdownTarget(target, "hourly", now))

    expect(next.getTime()).toBeGreaterThan(now.getTime())
    expect(next.getMinutes()).toBe(30)
    expect(next.getTime() - now.getTime()).toBeLessThanOrEqual(60 * 60 * 1000)
  })

  it("moves a repeating span's start with its target so the bar keeps its length", () => {
    const widget = countdownWidget(new Date(2026, 5, 17, 9, 0, 0).toISOString(), {
      startAt: new Date(2026, 5, 16, 9, 0, 0).toISOString(),
      repeat: "daily"
    })

    const resolved = resolveCountdown(widget, now)
    const start = new Date(resolved.settings.startAt!).getTime()
    const target = new Date(resolved.settings.targetAt).getTime()

    expect(target).toBeGreaterThan(now.getTime())
    expect(target - start).toBe(DAY)
  })

  it("drops a start that cannot fill a span", () => {
    const backwards = countdownWidget("2026-01-11T00:00:00.000Z", {
      startAt: "2026-02-01T00:00:00.000Z"
    })

    expect(resolveCountdown(backwards, now).settings.startAt).toBeUndefined()

    const unreadable = countdownWidget("2026-01-11T00:00:00.000Z", {
      startAt: "not a date"
    })
    expect(resolveCountdown(unreadable, now).settings.startAt).toBeUndefined()
  })
})

describe("getCountdownProgress", () => {
  const progressWidget = countdownWidget("2026-01-11T00:00:00.000Z", {
    startAt: "2026-01-01T00:00:00.000Z"
  })

  it("is the fraction of the span elapsed", () => {
    expect(
      getCountdownProgress(progressWidget, new Date("2026-01-06T00:00:00.000Z"))
    ).toBeCloseTo(0.5)
  })

  it("clamps before the start and after the target", () => {
    expect(
      getCountdownProgress(progressWidget, new Date("2025-12-01T00:00:00.000Z"))
    ).toBe(0)
    expect(
      getCountdownProgress(progressWidget, new Date("2027-01-01T00:00:00.000Z"))
    ).toBe(1)
  })

  it("falls back when no start is set", () => {
    const noStart = countdownWidget("2026-01-11T00:00:00.000Z")
    expect(
      getCountdownProgress(noStart, new Date("2026-01-01T00:00:00.000Z"))
    ).toBe(0)
    expect(
      getCountdownProgress(noStart, new Date("2026-02-01T00:00:00.000Z"))
    ).toBe(1)
  })
})

describe("datetime-local countdown conversions", () => {
  it("converts a local input value into an ISO instant", () => {
    expect(dateTimeInputValueToIsoInstant("2026-01-02T03:04")).toBe(
      new Date(2026, 0, 2, 3, 4, 0, 0).toISOString()
    )
  })

  it("converts an ISO instant into a datetime-local value", () => {
    expect(
      isoInstantToDateTimeInputValue(new Date(2026, 0, 2, 3, 4, 0, 0).toISOString())
    ).toBe("2026-01-02T03:04")
  })
})

describe("getCountdownParts", () => {
  it("returns the status and natural-language label for a future target", () => {
    const parts = getCountdownParts(
      countdownWidget("2026-01-02T03:04:00.000Z"),
      new Date("2026-01-01T00:00:00.000Z")
    )

    expect(parts.status).toBe("future")
    expect(parts.label).toBe("1 day, 3 hours from now")
  })

  it("marks just-passed targets as due", () => {
    const parts = getCountdownParts(
      countdownWidget("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-01T00:00:30.000Z")
    )

    expect(parts.status).toBe("due")
    expect(parts.label).toBe("just now")
  })
})

describe("formatRelativeCountdown", () => {
  it("uses the two most useful units", () => {
    expect(formatRelativeCountdown(2 * 86_400_000 + 5 * 3_600_000 + 9 * 60_000)).toBe(
      "2 days, 5 hours from now"
    )
  })

  it("describes past targets without configuration", () => {
    expect(formatRelativeCountdown(-(3 * 3_600_000 + 12 * 60_000))).toBe(
      "3 hours, 12 minutes ago"
    )
  })
})

describe("getLastElapsedCountdownTarget", () => {
  const now = new Date(2026, 5, 19, 12, 0, 0)

  it("is null while a countdown is still ahead, its target once it is not", () => {
    const future = new Date(2026, 8, 1).toISOString()
    const past = new Date(2026, 0, 1).toISOString()

    expect(getLastElapsedCountdownTarget(countdownWidget(future), now)).toBeNull()
    expect(getLastElapsedCountdownTarget(countdownWidget(past), now)).toBe(past)
    expect(getLastElapsedCountdownTarget(countdownWidget("nonsense"), now)).toBeNull()
  })

  it("tracks the occurrence a repeating countdown most recently rolled off", () => {
    const weekly = countdownWidget(new Date(2024, 0, 3, 8, 0, 0).toISOString(), {
      repeat: "weekly"
    })

    // The anchor is a Wednesday, so this is the Wednesday on or before `now`.
    expect(getLastElapsedCountdownTarget(weekly, now)).toBe(
      new Date(2026, 5, 17, 8, 0, 0).toISOString()
    )

    // Crossing the next occurrence moves the value, which is what makes it
    // usable as a "this card moved on" marker.
    expect(
      getLastElapsedCountdownTarget(weekly, new Date(2026, 5, 25, 12, 0, 0))
    ).toBe(new Date(2026, 5, 24, 8, 0, 0).toISOString())
  })
})

describe("getTimeZoneOffsetMinutes", () => {
  it("follows a zone across its daylight saving changeover", () => {
    expect(
      getTimeZoneOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "America/Chicago")
    ).toBe(-360)
    expect(
      getTimeZoneOffsetMinutes(new Date("2026-07-15T12:00:00Z"), "America/Chicago")
    ).toBe(-300)
  })

  it("reads a bare-GMT zone, a half-hour zone, and junk", () => {
    const at = new Date("2026-01-15T12:00:00Z")

    expect(getTimeZoneOffsetMinutes(at, "UTC")).toBe(0)
    expect(getTimeZoneOffsetMinutes(at, "Asia/Kolkata")).toBe(330)
    expect(getTimeZoneOffsetMinutes(at, "Not/AZone")).toBe(0)
  })
})
