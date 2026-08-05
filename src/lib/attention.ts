// A new tab is a fresh page load, so most of what moves on a board moves while nobody is watching: a repeating countdown rolls over, a zone shifts on or off daylight saving, and every night the day turns and a habit is unmarked again.
// Each card's state is described by a token, a string that holds steady while the state does and differs once it moves.
// Comparing it against what this browser last recorded is the whole mechanism.

import { isDoneToday, toDayKey } from "./habit"
import { getLastElapsedCountdownTarget, getTimeZoneOffsetMinutes } from "./time"
import type { Widget } from "./types"

interface AttentionSignal {
  // "condition" means the state itself wants attention (a habit still unmarked today, a countdown that has run out), so it counts from first sight.
  // "baseline" means only a change is worth saying (a clock's offset), so the first sighting is recorded quietly and never flags.
  kind: "condition" | "baseline"
  token: string
}

const getSignal = (
  widget: Widget,
  now: Date,
  systemTimeZone: string
): AttentionSignal | null => {
  // An archived card is deliberately out of sight; it must not sit behind the "Show archived" toggle asking to be looked at.
  if (widget.archived) {
    return null
  }

  if (widget.kind === "habit") {
    return isDoneToday(widget.settings.history, now)
      ? null
      : { kind: "condition", token: toDayKey(now) }
  }

  if (widget.kind === "countdown") {
    const elapsed = getLastElapsedCountdownTarget(widget, now)

    return elapsed === null ? null : { kind: "condition", token: elapsed }
  }

  // Both halves matter: the card's own zone can change offset under it, and moving the machine changes what every clock means relative to "your time".
  if (widget.kind === "clock") {
    const offset = getTimeZoneOffsetMinutes(now, widget.settings.timeZone)

    return { kind: "baseline", token: `${systemTimeZone}|${offset}` }
  }

  // Notes, todo lists and stopwatches only change when the user changes them, and quotes are deliberately left out: a new quote is a pleasure, not a task.
  return null
}

// The token to record when a card is acknowledged, or null when it has nothing to settle.
export const getAttentionToken = (
  widget: Widget,
  now: Date,
  systemTimeZone: string
): string | null => getSignal(widget, now, systemTimeZone)?.token ?? null

// The ids whose cards should be flagged right now.
export const getAttentionIds = (
  widgets: readonly Widget[],
  seen: Readonly<Record<string, string>>,
  now: Date,
  systemTimeZone: string
): ReadonlySet<string> =>
  new Set(
    widgets
      .filter((widget) => {
        const signal = getSignal(widget, now, systemTimeZone)
        const recorded = seen[widget.id]

        return (
          signal !== null &&
          (recorded === undefined
            ? signal.kind === "condition"
            : recorded !== signal.token)
        )
      })
      .map((widget) => widget.id)
  )

// Record a first sighting of every baseline card and drop records for widgets that no longer exist.
// Returns null when nothing needed writing, so the caller's effect settles instead of looping.
// Archived widgets keep their record, since archiving a card and bringing it back should not re-flag it.
export const reconcileSeen = (
  widgets: readonly Widget[],
  seen: Readonly<Record<string, string>>,
  now: Date,
  systemTimeZone: string
): Record<string, string> | null => {
  const next: Record<string, string> = {}
  let seeded = false

  for (const widget of widgets) {
    const recorded = seen[widget.id]

    if (recorded !== undefined) {
      next[widget.id] = recorded
      continue
    }

    // Baselines only, and never over an existing record, which is what acknowledging is for.
    // A condition has to survive this pass to flag at all.
    const signal = getSignal(widget, now, systemTimeZone)

    if (signal?.kind === "baseline") {
      next[widget.id] = signal.token
      seeded = true
    }
  }

  // Without a seed, `next` is a subset of `seen`, so a matching size means the two are equal and nothing was pruned either.
  return seeded || Object.keys(next).length !== Object.keys(seen).length
    ? next
    : null
}

// The line under the greeting, or null when the board is settled.
// A dot on a card is easy to skip past; a count in the one place read every time the page opens is what sends the eye looking for it.
export const formatAttentionSummary = (count: number): string | null =>
  count < 1
    ? null
    : `${count} card${count === 1 ? " needs" : "s need"} a look`
