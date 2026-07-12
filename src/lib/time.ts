import {
  toDateTimeInputValue,
  type ClockWidget,
  type CountdownRepeat,
  type CountdownWidget
} from "./types"

export interface CountdownParts {
  status: "future" | "due" | "past"
  label: string
}

export const dateTimeInputValueToIsoInstant = (
  localDateTime: string
): string | null => {
  const match = localDateTime.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  )

  if (!match) {
    return null
  }

  const year = Number(match[1]!)
  const month = Number(match[2]!)
  const day = Number(match[3]!)
  const hour = Number(match[4]!)
  const minute = Number(match[5]!)

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString()
}

export const isoInstantToDateTimeInputValue = (instant: string): string => {
  const date = new Date(instant)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return toDateTimeInputValue(date)
}

// Whether two instants land on the same day of the user's local calendar.
// Widgets that only care which day it is compare ticks with this, so they notice
// midnight without re-rendering on every second in between.
export const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear()

// Intl.DateTimeFormat construction parses options on every call and is among the
// pricier locale operations; format() itself is cheap. Cache instances by their
// options so repeated renders (and ticking clocks) reuse one formatter.
const formatterCache = new Map<string, Intl.DateTimeFormat>()

const getFormatter = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const key = JSON.stringify(options)
  let formatter = formatterCache.get(key)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, options)
    formatterCache.set(key, formatter)
  }

  return formatter
}

export const formatClockTime = (date: Date, widget: ClockWidget): string =>
  getFormatter({
    timeZone: widget.settings.timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(date)

export const formatClockDate = (date: Date, timeZone: string): string =>
  getFormatter({
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date)

export const formatTimeZoneName = (date: Date, timeZone: string): string => {
  const parts = getFormatter({
    timeZone,
    timeZoneName: "short"
  }).formatToParts(date)

  return parts.find((part) => part.type === "timeZoneName")?.value || timeZone
}

const daysInMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate()

// Move `date` forward by whole months, always re-deriving the day from `base`
// and clamping it to the destination month's length. Plain Date.setMonth would
// spill a day-of-month that doesn't exist into the next month (Jan 31 + 1 month
// -> Mar 3), permanently drifting the anchor; clamping instead lands "monthly
// on the 31st" on each month's last day, and because the day is re-derived from
// `base` every step, a Feb-29 anchor snaps back to Feb 29 on the next leap year
// rather than sticking at Mar 1. The time of day is preserved.
const advanceByMonths = (date: Date, base: Date, months: number): void => {
  const monthIndex = date.getFullYear() * 12 + date.getMonth() + months
  const year = Math.floor(monthIndex / 12)
  const month = ((monthIndex % 12) + 12) % 12

  date.setFullYear(year, month, Math.min(base.getDate(), daysInMonth(year, month)))
}

// For a repeating countdown, roll the target forward to the next occurrence
// strictly after now. Non-repeating or still-future targets are returned
// unchanged. Each occurrence is built in calendar steps so the local time of day
// survives DST; a coarse arithmetic jump lands just short of now first, so even
// a target decades in the past resolves in a handful of steps.
export const nextCountdownTarget = (
  targetAt: string,
  repeat: CountdownRepeat | undefined,
  now = new Date()
): string => {
  const base = new Date(targetAt)

  if (
    Number.isNaN(base.getTime()) ||
    !repeat ||
    repeat === "none" ||
    base.getTime() > now.getTime()
  ) {
    return targetAt
  }

  const nowMs = now.getTime()
  const next = new Date(base)

  if (repeat === "monthly" || repeat === "yearly") {
    const step = repeat === "yearly" ? 12 : 1
    const monthsApart =
      (now.getFullYear() - base.getFullYear()) * 12 +
      (now.getMonth() - base.getMonth())
    const initialSteps = Math.max(0, Math.floor(monthsApart / step) - 1) * step

    if (initialSteps > 0) {
      advanceByMonths(next, base, initialSteps)
    }

    while (next.getTime() <= nowMs) {
      advanceByMonths(next, base, step)
    }

    return next.toISOString()
  }

  const stepDays = repeat === "weekly" ? 7 : 1
  const approxSteps = Math.floor((nowMs - base.getTime()) / 86_400_000 / stepDays)
  const initialDays = Math.max(0, approxSteps - 1) * stepDays

  if (initialDays > 0) {
    next.setDate(next.getDate() + initialDays)
  }

  while (next.getTime() <= nowMs) {
    next.setDate(next.getDate() + stepDays)
  }

  return next.toISOString()
}

export const getCountdownParts = (
  widget: CountdownWidget,
  now = new Date()
): CountdownParts => {
  const totalMs = new Date(widget.settings.targetAt).getTime() - now.getTime()

  return {
    status: getCountdownStatus(totalMs),
    label: formatRelativeCountdown(totalMs)
  }
}

export const formatRelativeCountdown = (totalMs: number): string => {
  if (Number.isNaN(totalMs) || Math.abs(totalMs) < 60_000) {
    return totalMs >= 0 || Number.isNaN(totalMs)
      ? "less than a minute from now"
      : "just now"
  }

  const suffix = totalMs >= 0 ? "from now" : "ago"
  const absoluteMinutes = Math.floor(Math.abs(totalMs) / 60_000)
  const days = Math.floor(absoluteMinutes / 1_440)
  const hours = Math.floor((absoluteMinutes % 1_440) / 60)
  const minutes = absoluteMinutes % 60
  const parts: string[] = []

  if (days > 0) {
    parts.push(pluralize(days, "day"))
  }

  if (hours > 0 && parts.length < 2) {
    parts.push(pluralize(hours, "hour"))
  }

  if (minutes > 0 && parts.length < 2) {
    parts.push(pluralize(minutes, "minute"))
  }

  return `${parts.join(", ")} ${suffix}`
}

const getCountdownStatus = (totalMs: number): CountdownParts["status"] => {
  if (Number.isNaN(totalMs) || Math.abs(totalMs) < 60_000) {
    return "due"
  }

  return totalMs > 0 ? "future" : "past"
}

const pluralize = (value: number, unit: string): string =>
  `${value} ${unit}${value === 1 ? "" : "s"}`

// Fraction (0..1) of the way from the widget's start to its target, for the
// progress display. Falls back gracefully when no usable start span exists.
export const getCountdownProgress = (
  widget: CountdownWidget,
  now = new Date()
): number => {
  const target = new Date(widget.settings.targetAt).getTime()
  const start = widget.settings.startAt
    ? new Date(widget.settings.startAt).getTime()
    : Number.NaN

  if (Number.isNaN(target)) {
    return 0
  }

  if (Number.isNaN(start) || start >= target) {
    return now.getTime() >= target ? 1 : 0
  }

  const fraction = (now.getTime() - start) / (target - start)
  return Math.min(1, Math.max(0, fraction))
}

export const formatCountdownTarget = (widget: CountdownWidget): string => {
  const target = new Date(widget.settings.targetAt)

  if (Number.isNaN(target.getTime())) {
    return "Invalid target"
  }

  return getFormatter({
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(target)
}

// Whether a string is an IANA zone the runtime's Intl accepts. A clock's stored
// zone flows straight into Intl.DateTimeFormat, which throws a RangeError on an
// unknown zone — so anything read from storage or typed by hand must be checked
// before it reaches a formatter.
export const isSupportedTimeZone = (value: unknown): value is string => {
  if (typeof value !== "string" || value === "") {
    return false
  }

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value })
    return true
  } catch {
    return false
  }
}

export const getTimeZoneOptions = (): string[] => {
  const supportedValuesOf = Intl.supportedValuesOf?.bind(Intl)

  if (supportedValuesOf) {
    return supportedValuesOf("timeZone")
  }

  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney"
  ]
}
