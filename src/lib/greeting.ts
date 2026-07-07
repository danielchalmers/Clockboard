// The four moments of the day the greeting keys off.
export type Daypart = "morning" | "afternoon" | "evening" | "night"

export const getDaypart = (now: Date): Daypart => {
  const hour = now.getHours()

  if (hour >= 5 && hour < 12) {
    return "morning"
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon"
  }

  if (hour >= 17 && hour < 22) {
    return "evening"
  }

  return "night"
}

// A calm, time-of-day greeting for the board header.
export const getTimeOfDayGreeting = (now: Date): string => {
  switch (getDaypart(now)) {
    case "morning":
      return "Good morning"
    case "afternoon":
      return "Good afternoon"
    case "evening":
      return "Good evening"
    case "night":
      return "Good night"
  }
}

// Optionally personalize the greeting with a trimmed name.
export const getGreeting = (now: Date, name = ""): string => {
  const base = getTimeOfDayGreeting(now)
  const trimmed = name.trim()

  return trimmed ? `${base}, ${trimmed}` : base
}

// The friendly date line under the greeting, e.g. "Monday, July 7".
export const getHeaderDate = (now: Date): string =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now)
