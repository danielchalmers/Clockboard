import { useEffect, useState } from "react"

// Everything that opens over the board eases in and then vanishes on a frame
// when it closes, which is what makes dismissing feel abrupt next to opening.
// This keeps a closed element mounted just long enough to play an exit, and
// reports which of the two states it is in so the markup can say so in a class.
//
// The exit is skipped outright when the reader has asked for reduced motion:
// holding a dismissed dialog on screen for an animation that will not run is
// worse than the jump cut it was meant to soften.
export const usePresence = (isOpen: boolean, durationMs: number) => {
  const [isPresent, setIsPresent] = useState(isOpen)

  // Opening is adopted during render rather than in an effect, so the content
  // exists on the very first open render. A frame of null would leave the
  // effects that reach into it — the dialogs' focus trap — with nothing to wire
  // up, and their deps would never change again to give them a second chance.
  if (isOpen && !isPresent) {
    setIsPresent(true)
  }

  useEffect(() => {
    if (isOpen || !isPresent) {
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsPresent(false)
      return
    }

    const timer = window.setTimeout(() => setIsPresent(false), durationMs)

    return () => window.clearTimeout(timer)
  }, [durationMs, isOpen, isPresent])

  return { isPresent, isClosing: isPresent && !isOpen }
}
