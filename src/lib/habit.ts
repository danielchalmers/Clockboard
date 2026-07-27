// Helpers for the habit widget. The card shows the current week as a row of
// dots above a dimmed row for the week before, and nothing else — deliberately
// no streak counter, because a number that can reset to zero (or be lost to a
// bug) turns a gentle nudge into a source of anxiety. History therefore keeps
// only the days those two rows can show, which also keeps it far under the
// chrome.storage.sync per-item quota that the whole board shares; the original
// unbounded list eventually blew it and made every save fail.

const pad = (value: number) => String(value).padStart(2, "0")

export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const DAYS_PER_WEEK = 7

// The current week plus the dimmed one above it.
export const VISIBLE_WEEKS = 2

// The widest span the card can ever draw: the previous week's first day through
// today. Days older than that can never render again and don't need to be kept.
export const STORED_DAYS = DAYS_PER_WEEK * VISIBLE_WEEKS

const prune = (dayKeys: string[]): string[] =>
  // YYYY-MM-DD keys sort chronologically as strings.
  [...new Set(dayKeys)].sort().slice(-STORED_DAYS)

export const isDoneOn = (history: string[], date: Date): boolean =>
  history.includes(toDayKey(date))

export const isDoneToday = (history: string[], now: Date): boolean =>
  isDoneOn(history, now)

// Mark or unmark a single day — today from the card's button, any earlier day
// from its own dot.
export const toggleDay = (history: string[], date: Date): string[] => {
  const key = toDayKey(date)
  const next = history.includes(key)
    ? history.filter((entry) => entry !== key)
    : [...history, key]

  return prune(next)
}

// Accept whatever shape a stored or imported board carries — the current
// pruned list, the original unbounded array of every completed day, or junk —
// so old boards shrink to what the dot rows can show the first time they load.
export const normalizeHistory = (value: unknown): string[] =>
  Array.isArray(value)
    ? prune(
        value.filter(
          (entry): entry is string =>
            typeof entry === "string" && DAY_KEY_PATTERN.test(entry)
        )
      )
    : []

interface WeekInfo {
  firstDay?: number
}

type LocaleWithWeekInfo = Intl.Locale & {
  getWeekInfo?: () => WeekInfo
  weekInfo?: WeekInfo
}

// Which weekday the user's week rolls over on: Sunday in the US, Monday across
// most of Europe. `Intl.Locale` reports it as 1 (Monday) through 7 (Sunday),
// which `% 7` turns into the 0-is-Sunday numbering `Date.getDay` uses. Older
// engines expose the same data as a `weekInfo` property instead of a method,
// and anything that has neither falls back to Sunday.
export const weekStartDay = (
  locale = typeof navigator === "undefined" ? "en-US" : navigator.language
): number => {
  try {
    const resolved = new Intl.Locale(locale) as LocaleWithWeekInfo
    const info = resolved.getWeekInfo?.() ?? resolved.weekInfo

    return typeof info?.firstDay === "number" ? info.firstDay % 7 : 0
  } catch {
    return 0
  }
}

// Midnight on the first day of the week `date` falls in.
export const startOfWeek = (date: Date, firstDay = weekStartDay()): Date => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return addDays(start, -((start.getDay() - firstDay + DAYS_PER_WEEK) % DAYS_PER_WEEK))
}

// The weeks the card draws, oldest first, each one running from the week's
// first day to its last. The current week is always the final row, so it holds
// its shape as the days fill in rather than sliding a day left every midnight.
export const weekGrid = (
  now: Date,
  weeks = VISIBLE_WEEKS,
  firstDay = weekStartDay()
): Date[][] => {
  const thisWeek = startOfWeek(now, firstDay)

  return Array.from({ length: weeks }, (_, week) => {
    const start = addDays(thisWeek, (week - weeks + 1) * DAYS_PER_WEEK)

    return Array.from({ length: DAYS_PER_WEEK }, (_, day) => addDays(start, day))
  })
}

// A habit card redraws with every tick of the board's clock, and each one
// formats a fortnight of dates, so the formatters are built once rather than
// per render — the locale can't change without a reload anyway.
const rangeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric"
})

const dayLabelFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric"
})

const initialFormat = new Intl.DateTimeFormat(undefined, { weekday: "narrow" })

// A quiet label for the week beside the button, such as `Jul 26 – Aug 1`.
export const formatWeekRange = (days: Date[]): string => {
  const first = days[0]
  const last = days[days.length - 1]

  return first && last ? rangeFormat.formatRange(first, last) : ""
}

// The full date a dot stands for, for its accessible name.
export const formatDayLabel = (date: Date): string => dayLabelFormat.format(date)

// The column headers above the dots: one narrow letter per weekday.
export const weekdayInitials = (firstDay = weekStartDay()): string[] => {
  // Any week works for the headers; 2024-01-07 was a Sunday.
  const sunday = new Date(2024, 0, 7)

  return Array.from({ length: DAYS_PER_WEEK }, (_, day) =>
    initialFormat.format(addDays(sunday, (firstDay + day) % DAYS_PER_WEEK))
  )
}
