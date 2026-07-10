// Helpers for the habit widget. The card shows the past week as a row of dots
// and nothing else — deliberately no streak counter, because a number that can
// reset to zero (or be lost to a bug) turns a gentle nudge into a source of
// anxiety. History therefore keeps only a handful of recent day keys, which
// also keeps it far under the chrome.storage.sync per-item quota that the
// whole board shares; the original unbounded list eventually blew it and made
// every save fail.

const pad = (value: number) => String(value).padStart(2, "0")

export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// The dot row covers a week, so days that fall further back than the newest
// seven entries can never render again and don't need to be kept.
export const VISIBLE_DAYS = 7

const prune = (dayKeys: string[]): string[] =>
  // YYYY-MM-DD keys sort chronologically as strings.
  [...new Set(dayKeys)].sort().slice(-VISIBLE_DAYS)

export const isDoneOn = (history: string[], date: Date): boolean =>
  history.includes(toDayKey(date))

export const isDoneToday = (history: string[], now: Date): boolean =>
  isDoneOn(history, now)

// Mark or unmark today.
export const toggleToday = (history: string[], now: Date): string[] => {
  const key = toDayKey(now)
  const next = history.includes(key)
    ? history.filter((entry) => entry !== key)
    : [...history, key]

  return prune(next)
}

// Accept whatever shape a stored or imported board carries — the current
// pruned list, the original unbounded array of every completed day, or junk —
// so old boards shrink to what the dot row can show the first time they load.
export const normalizeHistory = (value: unknown): string[] =>
  Array.isArray(value)
    ? prune(
        value.filter(
          (entry): entry is string =>
            typeof entry === "string" && DAY_KEY_PATTERN.test(entry)
        )
      )
    : []

// The last `count` days, oldest first, for the at-a-glance dot row.
export const recentDays = (now: Date, count: number): Date[] => {
  const days: Date[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDays(now, -offset))
  }
  return days
}
