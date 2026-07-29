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
// Widgets that only care which day it is compare ticks with this, so they notice midnight without re-rendering on every second in between.
export const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear()

// Intl.DateTimeFormat construction parses options on every call and is among the pricier locale operations; format() itself is cheap.
// Cache instances by their options so repeated renders (and ticking clocks) reuse one formatter.
const formatterCache = new Map<string, Intl.DateTimeFormat>()

const getFormatter = (
  options: Intl.DateTimeFormatOptions,
  // Display formatting follows the browser's locale; only a machine-read value pins one.
  locale?: string
): Intl.DateTimeFormat => {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`
  let formatter = formatterCache.get(key)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    formatterCache.set(key, formatter)
  }

  return formatter
}

// How far a zone sits from UTC, in minutes.
// A zone changes offset under a card without the widget changing at all, as a daylight saving changeover does, so reading it as a number makes "it moved" a plain comparison.
// The locale is pinned because the display of an offset is localized while the value is not.
export const getTimeZoneOffsetMinutes = (
  date: Date,
  timeZone: string
): number => {
  let name: string

  try {
    name =
      getFormatter({ timeZone, timeZoneName: "longOffset" }, "en-US")
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value || ""
  } catch {
    // An unreadable zone has no offset to compare; call it UTC so a bad value reads as unchanged rather than flagging its card forever.
    return 0
  }

  // A zone sitting exactly on UTC formats as a bare "GMT", with no offset.
  const match = name.match(/([+-])(\d{1,2})(?::(\d{2}))?/)

  if (!match) {
    return 0
  }

  const minutes = Number(match[2]) * 60 + Number(match[3] || 0)

  return match[1] === "-" ? -minutes : minutes
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

// Move an instant forward by whole repeat steps, using calendar arithmetic so the time of day survives DST and a monthly countdown keeps its day number instead of drifting the way repeated single steps would.
const advanceByRepeat = (
  base: Date,
  repeat: CountdownRepeat | undefined,
  steps: number
): Date => {
  const next = new Date(base)

  if (!repeat || repeat === "none" || steps <= 0) {
    return next
  }

  if (repeat === "hourly") {
    next.setHours(next.getHours() + steps)
  } else if (repeat === "daily") {
    next.setDate(next.getDate() + steps)
  } else if (repeat === "weekly") {
    next.setDate(next.getDate() + steps * 7)
  } else if (repeat === "monthly") {
    next.setMonth(next.getMonth() + steps)
  } else {
    next.setFullYear(next.getFullYear() + steps)
  }

  return next
}

const APPROXIMATE_STEP_MS: Record<Exclude<CountdownRepeat, "none">, number> = {
  hourly: 3_600_000,
  daily: 86_400_000,
  weekly: 604_800_000,
  monthly: 2_629_746_000,
  yearly: 31_556_952_000
}

// How many repeat steps a stored target has to move to land on its first occurrence after now.
// The count is estimated from the elapsed span and then nudged into place, so an hourly countdown left alone for a year costs a couple of comparisons rather than thousands of iterations.
const countdownRepeatSteps = (
  targetAt: string,
  repeat: CountdownRepeat | undefined,
  now: Date
): number => {
  const base = new Date(targetAt)

  if (
    Number.isNaN(base.getTime()) ||
    !repeat ||
    repeat === "none" ||
    base.getTime() > now.getTime()
  ) {
    return 0
  }

  let steps = Math.max(
    0,
    Math.floor((now.getTime() - base.getTime()) / APPROXIMATE_STEP_MS[repeat])
  )

  while (advanceByRepeat(base, repeat, steps).getTime() <= now.getTime()) {
    steps += 1
  }

  while (
    steps > 0 &&
    advanceByRepeat(base, repeat, steps - 1).getTime() > now.getTime()
  ) {
    steps -= 1
  }

  return steps
}

// The most recent occurrence a countdown has already passed, or null while it is still counting down to its first.
// A repeating countdown returns the occurrence it rolled off, which changes every cycle, so the value doubles as a marker for "this card moved on since you last looked".
export const getLastElapsedCountdownTarget = (
  widget: CountdownWidget,
  now = new Date()
): string | null => {
  const { targetAt, repeat } = widget.settings
  const target = new Date(targetAt)

  if (Number.isNaN(target.getTime())) {
    return null
  }

  if (!repeat || repeat === "none") {
    return target.getTime() <= now.getTime() ? target.toISOString() : null
  }

  // Steps count to the first occurrence after now, so the one before it is the last that elapsed.
  // Zero means the anchor itself is still ahead of us.
  const steps = countdownRepeatSteps(targetAt, repeat, now)

  return steps === 0
    ? null
    : advanceByRepeat(target, repeat, steps - 1).toISOString()
}

// Resolve what a countdown means right now: a repeating one shows its next occurrence, and a start that cannot fill a bar is dropped.
// Both ends of a repeating span move together so the bar keeps its length each cycle instead of stretching from the original start forever.
// The result is computed on the fly, so the stored widget stays the anchor and every tab agrees without writes.
export const resolveCountdown = (
  widget: CountdownWidget,
  now = new Date()
): CountdownWidget => {
  const { targetAt, startAt, repeat } = widget.settings
  const target = new Date(targetAt)

  // Nothing to resolve against an unreadable target; the card says so instead.
  if (Number.isNaN(target.getTime())) {
    return widget
  }

  const start = startAt ? new Date(startAt) : null
  const steps = countdownRepeatSteps(targetAt, repeat, now)

  // A start that does not parse, or that does not sit before the target, is not a span a bar can fill; the card falls back to the remaining-time text.
  const hasSpan =
    start !== null &&
    !Number.isNaN(start.getTime()) &&
    start.getTime() < target.getTime()

  if (steps === 0 && hasSpan === Boolean(startAt)) {
    return widget
  }

  return {
    ...widget,
    settings: {
      ...widget.settings,
      targetAt: advanceByRepeat(target, repeat, steps).toISOString(),
      startAt:
        hasSpan && start
          ? advanceByRepeat(start, repeat, steps).toISOString()
          : undefined
    }
  }
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

// Fraction (0..1) of the way from the widget's start to its target, for the progress display.
// Falls back gracefully when no usable start span exists.
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
