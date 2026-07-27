import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { usePresence } from "./usePresence"

const setReducedMotion = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      addEventListener: () => {},
      matches,
      removeEventListener: () => {}
    })
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  setReducedMotion(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("usePresence", () => {
  it("is present the moment it opens, not a render later", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => usePresence(isOpen, 200),
      { initialProps: { isOpen: false } }
    )

    expect(result.current.isPresent).toBe(false)

    rerender({ isOpen: true })

    // The dialogs wire their focus trap to the element rendered on this pass,
    // so a frame of absence here would silently break it.
    expect(result.current.isPresent).toBe(true)
    expect(result.current.isClosing).toBe(false)
  })

  it("stays mounted while closing, then leaves", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => usePresence(isOpen, 200),
      { initialProps: { isOpen: true } }
    )

    rerender({ isOpen: false })

    expect(result.current.isPresent).toBe(true)
    expect(result.current.isClosing).toBe(true)

    act(() => void vi.advanceTimersByTime(199))
    expect(result.current.isPresent).toBe(true)

    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.isPresent).toBe(false)
  })

  it("cancels the exit when it is reopened part way through", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => usePresence(isOpen, 200),
      { initialProps: { isOpen: true } }
    )

    rerender({ isOpen: false })
    act(() => void vi.advanceTimersByTime(100))
    rerender({ isOpen: true })
    act(() => void vi.advanceTimersByTime(200))

    expect(result.current.isPresent).toBe(true)
    expect(result.current.isClosing).toBe(false)
  })

  it("drops straight out when motion is not wanted", () => {
    setReducedMotion(true)

    const { result, rerender } = renderHook(
      ({ isOpen }) => usePresence(isOpen, 200),
      { initialProps: { isOpen: true } }
    )

    rerender({ isOpen: false })

    expect(result.current.isPresent).toBe(false)
  })
})
