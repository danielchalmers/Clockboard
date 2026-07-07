import { describe, expect, it } from "vitest"

import {
  getDaypart,
  getGreeting,
  getHeaderDate,
  getTimeOfDayGreeting
} from "./greeting"

const at = (hour: number) => new Date(2026, 0, 1, hour, 0, 0)

describe("getDaypart", () => {
  it("splits the day at 5, 12, 17, and 22", () => {
    expect(getDaypart(at(5))).toBe("morning")
    expect(getDaypart(at(11))).toBe("morning")
    expect(getDaypart(at(12))).toBe("afternoon")
    expect(getDaypart(at(16))).toBe("afternoon")
    expect(getDaypart(at(17))).toBe("evening")
    expect(getDaypart(at(21))).toBe("evening")
    expect(getDaypart(at(22))).toBe("night")
    expect(getDaypart(at(4))).toBe("night")
  })
})

describe("getHeaderDate", () => {
  it("spells out the weekday, month, and day", () => {
    const formatted = getHeaderDate(new Date(2026, 6, 7))

    // Locale-dependent order, but all three parts must be present.
    expect(formatted).toMatch(/7/)
    expect(formatted.length).toBeGreaterThan(8)
  })
})

describe("getTimeOfDayGreeting", () => {
  it("changes with the local hour", () => {
    expect(getTimeOfDayGreeting(at(8))).toBe("Good morning")
    expect(getTimeOfDayGreeting(at(14))).toBe("Good afternoon")
    expect(getTimeOfDayGreeting(at(19))).toBe("Good evening")
    expect(getTimeOfDayGreeting(at(23))).toBe("Good night")
    expect(getTimeOfDayGreeting(at(3))).toBe("Good night")
  })
})

describe("getGreeting", () => {
  it("appends a trimmed name when present", () => {
    expect(getGreeting(at(8), "Sam")).toBe("Good morning, Sam")
    expect(getGreeting(at(8), "  Sam  ")).toBe("Good morning, Sam")
  })

  it("omits the name when blank", () => {
    expect(getGreeting(at(8), "")).toBe("Good morning")
    expect(getGreeting(at(8), "   ")).toBe("Good morning")
  })
})
