import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  getAttentionIds,
  getAttentionToken,
  reconcileSeen
} from "~/lib/attention"
import { readSeenAttention, writeSeenAttention } from "~/lib/storage"
import type { Widget } from "~/lib/types"

const NO_ATTENTION: ReadonlySet<string> = new Set()

// Which cards should say that something moved, and how the user puts one back to rest.
// `widgets` is null while the board loads, since pruning against nothing would wipe the record on every cold start.
export const useAttention = (
  widgets: readonly Widget[] | null,
  now: Date
): { attentionIds: ReadonlySet<string>; acknowledge: (id: string) => void } => {
  const [seen, setSeen] = useState<Record<string, string>>(readSeenAttention)

  // Resolving the system zone builds a formatter, the pricey half of Intl.
  // Read it once for the life of the page: a new tab is a fresh load, so a machine that moves zones is noticed the next time one opens.
  const [systemTimeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  // Read through refs so `acknowledge` keeps one identity, since one that changed every tick would defeat the memoized board rows entirely.
  const widgetsRef = useRef(widgets)
  widgetsRef.current = widgets
  const nowRef = useRef(now)
  nowRef.current = now
  const seenRef = useRef(seen)
  seenRef.current = seen

  const attentionIds = useMemo(
    () =>
      widgets
        ? getAttentionIds(widgets, seen, now, systemTimeZone)
        : NO_ATTENTION,
    [widgets, seen, now, systemTimeZone]
  )

  // Seed a baseline for cards seen for the first time and forget deleted ones.
  // Keyed on the board rather than the tick: `widgets` only changes when a save lands, so this settles instead of running every second.
  useEffect(() => {
    if (!widgets) {
      return
    }

    const next = reconcileSeen(
      widgets,
      seenRef.current,
      nowRef.current,
      systemTimeZone
    )

    if (next) {
      seenRef.current = next
      writeSeenAttention(next)
      setSeen(next)
    }
  }, [widgets, systemTimeZone])

  const acknowledge = useCallback(
    (id: string) => {
      const widget = widgetsRef.current?.find((entry) => entry.id === id)
      const token =
        widget && getAttentionToken(widget, nowRef.current, systemTimeZone)

      if (!token || seenRef.current[id] === token) {
        return
      }

      // Update the ref first so two acknowledgements in one tick both land.
      const next = { ...seenRef.current, [id]: token }
      seenRef.current = next
      writeSeenAttention(next)
      setSeen(next)
    },
    [systemTimeZone]
  )

  return { attentionIds, acknowledge }
}
