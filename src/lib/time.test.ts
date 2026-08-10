import { describe, expect, it } from "vitest"

import {
  dateTimeInputValueToIsoInstant,
  formatRelativeCountdown,
  getCountdownParts,
  getCountdownPercent,
  getCountdownProgress,
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

  it("keeps a monthly target on its day number through a month too short to hold it", () => {
    // The 31st has no February to land on, and rolling the overflow forward would put this countdown on March 3.
    const target = new Date(2026, 0, 31, 9, 0, 0).toISOString()
    const february = new Date(resolveCountdown(
      countdownWidget(target, { repeat: "monthly" }),
      new Date(2026, 1, 15, 12, 0, 0)
    ).settings.targetAt)

    expect(february.getMonth()).toBe(1)
    expect(february.getDate()).toBe(28)
    expect(february.getHours()).toBe(9)

    // The clamp holds for one short month only; the day number comes back the moment a month is long enough.
    const march = new Date(resolveCountdown(
      countdownWidget(target, { repeat: "monthly" }),
      new Date(2026, 2, 15, 12, 0, 0)
    ).settings.targetAt)

    expect(march.getMonth()).toBe(2)
    expect(march.getDate()).toBe(31)
  })

  it("keeps a yearly target on February 29 in February", () => {
    const target = new Date(2024, 1, 29, 9, 0, 0).toISOString()
    const common = new Date(resolveCountdown(
      countdownWidget(target, { repeat: "yearly" }),
      new Date(2025, 0, 15, 12, 0, 0)
    ).settings.targetAt)

    expect(common.getMonth()).toBe(1)
    expect(common.getDate()).toBe(28)

    // The next leap year restores the 29th rather than staying clamped.
    const leap = new Date(resolveCountdown(
      countdownWidget(target, { repeat: "yearly" }),
      new Date(2028, 0, 15, 12, 0, 0)
    ).settings.targetAt)

    expect(leap.getMonth()).toBe(1)
    expect(leap.getDate()).toBe(29)
  })

  it("keeps hourly occurrences one real hour apart across a DST fall-back", () => {
    // America/Chicago replays 01:00-02:00 on 2026-11-01; stepping the local hour field would never land on the second pass.
    const target = new Date(2026, 10, 1, 0, 30, 0).toISOString()
    const first = new Date(resolveCountdown(
      countdownWidget(target, { repeat: "hourly" }),
      new Date(2026, 10, 1, 0, 45, 0)
    ).settings.targetAt)
    const second = new Date(resolveCountdown(
      countdownWidget(target, { repeat: "hourly" }),
      new Date(first.getTime() + 15 * 60 * 1000)
    ).settings.targetAt)

    expect(second.getTime() - first.getTime()).toBe(60 * 60 * 1000)
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

describe("getCountdownPercent", () => {
  it("rounds to the nearest percent through the middle", () => {
    expect(getCountdownPercent(0.5)).toBe(50)
    expect(getCountdownPercent(0.504)).toBe(50)
    expect(getCountdownPercent(0.506)).toBe(51)
  })

  it("holds short of the ends while any of the span is left", () => {
    expect(getCountdownPercent(0.997)).toBe(99)
    expect(getCountdownPercent(0.99999)).toBe(99)
    expect(getCountdownPercent(0.003)).toBe(1)
  })

  it("reaches the ends only when the span is complete or untouched", () => {
    expect(getCountdownPercent(1)).toBe(100)
    expect(getCountdownPercent(0)).toBe(0)
  })

  it("reads an unusable span as untouched", () => {
    expect(getCountdownPercent(Number.NaN)).toBe(0)
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
