import { describe, expect, it } from "vitest"

import {
  dateTimeInputValueToIsoInstant,
  formatRelativeCountdown,
  getCountdownParts,
  getCountdownProgress,
  isSameLocalDay,
  isoInstantToDateTimeInputValue,
  nextCountdownTarget,
  resolveCountdownForDisplay
} from "./time"
import type { CountdownWidget } from "./types"

const countdownWidget = (targetAt: string): CountdownWidget => ({
  id: "launch",
  kind: "countdown",
  title: "Launch",
  colorPreset: "slate",
  settings: {
    targetAt
  }
})

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

describe("nextCountdownTarget", () => {
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

  it("keeps a monthly target on the 31st pinned to each month's last day", () => {
    const target = new Date(2026, 0, 31, 9, 0, 0).toISOString()

    // February (28 days in 2026) -> the 28th, not a spill into early March.
    const feb = new Date(nextCountdownTarget(target, "monthly", new Date(2026, 1, 15, 12, 0, 0)))
    expect(feb.getMonth()).toBe(1)
    expect(feb.getDate()).toBe(28)
    expect(feb.getHours()).toBe(9)

    // March keeps the full 31; April clamps to its 30.
    const mar = new Date(nextCountdownTarget(target, "monthly", new Date(2026, 2, 15, 12, 0, 0)))
    expect(mar.getMonth()).toBe(2)
    expect(mar.getDate()).toBe(31)

    const apr = new Date(nextCountdownTarget(target, "monthly", new Date(2026, 3, 15, 12, 0, 0)))
    expect(apr.getMonth()).toBe(3)
    expect(apr.getDate()).toBe(30)
  })

  it("recovers a yearly Feb-29 anchor on leap years and clamps otherwise", () => {
    const target = new Date(2024, 1, 29, 9, 0, 0).toISOString()

    // 2026 is not a leap year: clamp to Feb 28.
    const nonLeap = new Date(nextCountdownTarget(target, "yearly", new Date(2025, 5, 1, 12, 0, 0)))
    expect(nonLeap.getFullYear()).toBe(2026)
    expect(nonLeap.getMonth()).toBe(1)
    expect(nonLeap.getDate()).toBe(28)

    // 2028 is a leap year: the anchor snaps back to Feb 29 rather than drifting.
    const leap = new Date(nextCountdownTarget(target, "yearly", new Date(2028, 0, 15, 12, 0, 0)))
    expect(leap.getFullYear()).toBe(2028)
    expect(leap.getMonth()).toBe(1)
    expect(leap.getDate()).toBe(29)
  })

  it("rolls a daily target from decades ago up to the next future day", () => {
    const target = new Date(2000, 0, 1, 9, 0, 0).toISOString()
    const nowFar = new Date(2026, 6, 12, 12, 0, 0)
    const next = new Date(nextCountdownTarget(target, "daily", nowFar))

    expect(next.getTime()).toBeGreaterThan(nowFar.getTime())
    expect(next.getHours()).toBe(9)
    expect(next.getTime() - nowFar.getTime()).toBeLessThanOrEqual(DAY)
  })
})

describe("getCountdownProgress", () => {
  const progressWidget: CountdownWidget = {
    id: "year",
    kind: "countdown",
    title: "Year",
    colorPreset: "slate",
    settings: {
      display: "progress",
      startAt: "2026-01-01T00:00:00.000Z",
      targetAt: "2026-01-11T00:00:00.000Z"
    }
  }

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

describe("resolveCountdownForDisplay", () => {
  const DAY = 24 * 60 * 60 * 1000

  it("returns a still-future countdown unchanged", () => {
    const widget = countdownWidget(new Date(2030, 0, 1, 9, 0, 0).toISOString())
    expect(resolveCountdownForDisplay(widget, new Date(2026, 0, 1))).toBe(widget)
  })

  it("rolls a repeating progress span forward so the bar refills each period", () => {
    const widget: CountdownWidget = {
      id: "p",
      kind: "countdown",
      title: "Sprint",
      colorPreset: "slate",
      settings: {
        startAt: new Date(2026, 0, 1, 0, 0, 0).toISOString(),
        targetAt: new Date(2026, 0, 8, 0, 0, 0).toISOString(),
        display: "progress",
        repeat: "weekly"
      }
    }

    // A day into the second week: the first target already passed.
    const now = new Date(2026, 0, 9, 0, 0, 0)
    const resolved = resolveCountdownForDisplay(widget, now)

    // The span keeps its original length and slides forward with the target...
    const span =
      new Date(resolved.settings.targetAt).getTime() -
      new Date(resolved.settings.startAt!).getTime()
    expect(span).toBe(7 * DAY)

    // ...so the bar reads near the start of the new period, not pinned high.
    const progress = getCountdownProgress(resolved, now)
    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThan(0.2)
  })
})
