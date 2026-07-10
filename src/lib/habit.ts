// Helpers for the habit widget. History is the set of local days on which the
// habit was marked done, stored encoded as "<first day key>|<base64 bitmap>"
// with one bit per day from that anchor. A year-plus of daily completions fits
// in ~70 characters, where the old array-of-day-keys form grew to ~5 KB and two
// habits together blew chrome.storage.sync's 8 KB per-item quota, making every
// save of the whole board fail.

const pad = (value: number) => String(value).padStart(2, "0")

export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const MS_PER_DAY = 24 * 60 * 60 * 1000

const parseDayKey = (key: string): [number, number, number] => [
  Number(key.slice(0, 4)),
  Number(key.slice(5, 7)),
  Number(key.slice(8, 10))
]

// Calendar days between two day keys, computed in UTC so the answer is exact
// even when the local zone has a DST transition inside the span.
const dayKeyDiff = (a: string, b: string): number => {
  const toUtcMs = (key: string) => {
    const [year, month, day] = parseDayKey(key)
    return Date.UTC(year, month - 1, day)
  }

  return Math.round((toUtcMs(a) - toUtcMs(b)) / MS_PER_DAY)
}

export const encodeHistory = (dayKeys: string[]): string => {
  const days = [
    ...new Set(dayKeys.filter((key) => DAY_KEY_PATTERN.test(key)))
  ].sort()

  const anchor = days[0]
  if (anchor === undefined) {
    return ""
  }

  const span = dayKeyDiff(days[days.length - 1] ?? anchor, anchor) + 1
  const bytes = new Uint8Array(Math.ceil(span / 8))

  for (const day of days) {
    const offset = dayKeyDiff(day, anchor)
    bytes[offset >> 3] = (bytes[offset >> 3] ?? 0) | (1 << (offset & 7))
  }

  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return `${anchor}|${btoa(binary)}`
}

// Tolerant of malformed input (hand-edited imports, older versions) by
// decoding to an empty history rather than throwing mid-render.
export const decodeHistory = (encoded: string): string[] => {
  const separator = encoded.indexOf("|")
  if (separator === -1) {
    return []
  }

  const anchor = encoded.slice(0, separator)
  if (!DAY_KEY_PATTERN.test(anchor)) {
    return []
  }

  let binary: string
  try {
    binary = atob(encoded.slice(separator + 1))
  } catch {
    return []
  }

  const [year, month, day] = parseDayKey(anchor)
  const days: string[] = []

  for (let offset = 0; offset < binary.length * 8; offset += 1) {
    if (binary.charCodeAt(offset >> 3) & (1 << (offset & 7))) {
      days.push(toDayKey(new Date(year, month - 1, day + offset)))
    }
  }

  return days
}

// Accept whatever shape a stored or imported board carries — the original
// array-of-day-keys form, an already-encoded string, or junk — and return the
// canonical encoding, so old boards migrate the first time they load.
export const normalizeHistory = (value: unknown): string => {
  if (Array.isArray(value)) {
    return encodeHistory(
      value.filter((entry): entry is string => typeof entry === "string")
    )
  }

  return typeof value === "string" ? encodeHistory(decodeHistory(value)) : ""
}

export const isDoneOn = (history: string, date: Date): boolean =>
  decodeHistory(history).includes(toDayKey(date))

export const isDoneToday = (history: string, now: Date): boolean =>
  isDoneOn(history, now)

// History only ever feeds the current streak and the 7-day dot row, so keep a
// generous recent window and let older days fall off. The window also caps the
// longest reportable streak, so keep it comfortably past a year.
const HISTORY_WINDOW_DAYS = 400

const pruneHistory = (dayKeys: string[], now: Date): string[] => {
  const cutoff = toDayKey(addDays(now, -HISTORY_WINDOW_DAYS))
  // YYYY-MM-DD keys sort chronologically as strings.
  return dayKeys.filter((key) => key >= cutoff)
}

// Mark or unmark today.
export const toggleToday = (history: string, now: Date): string => {
  const key = toDayKey(now)
  const days = decodeHistory(history)
  const next = days.includes(key)
    ? days.filter((entry) => entry !== key)
    : [...days, key]

  return encodeHistory(pruneHistory(next, now))
}

// Consecutive completed days counting back from today. Today still counts as
// part of the streak until it ends, so a streak built through yesterday stays
// alive until the user either completes today or the day passes.
export const currentStreak = (history: string, now: Date): number => {
  const done = new Set(decodeHistory(history))
  let cursor = new Date(now)

  if (!done.has(toDayKey(cursor))) {
    cursor = addDays(cursor, -1)
  }

  let streak = 0
  while (done.has(toDayKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

// The last `count` days, oldest first, for the at-a-glance dot row.
export const recentDays = (now: Date, count: number): Date[] => {
  const days: Date[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDays(now, -offset))
  }
  return days
}
