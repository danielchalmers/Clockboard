// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest"

import { playChime } from "./chime"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// A stand-in for the Web Audio API. `resume` moves the context to "running" the way a
// browser does, so a second call finds nothing left to warm up.
// Every test that stubs a context has to re-import the module afterwards: the chime
// caches its context in module scope, and the static import above is a separate,
// already-evaluated copy that never saw the stub.
const stubAudioContext = (initialState = "running") => {
  const start = vi.fn()
  const stop = vi.fn()
  const connect = vi.fn(() => ({ connect: vi.fn() }))
  const onResume = vi.fn()
  let constructed = 0

  const createOscillator = vi.fn(() => ({
    type: "sine",
    frequency: { value: 0 },
    connect,
    start,
    stop
  }))
  const createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect
  }))

  class FakeAudioContext {
    currentTime = 0
    state = initialState
    destination = {}
    createOscillator = createOscillator
    createGain = createGain
    resume = (): Promise<void> => {
      this.state = "running"
      onResume()
      return Promise.resolve()
    }

    constructor() {
      constructed += 1
    }
  }

  vi.stubGlobal("AudioContext", FakeAudioContext)

  return {
    createOscillator,
    constructions: () => constructed,
    resume: onResume,
    start,
    stop
  }
}

describe("primeChime", () => {
  it("warms a suspended context so the later chime is allowed to play", async () => {
    const { resume } = stubAudioContext("suspended")

    const { primeChime } = await import("./chime")
    primeChime()

    expect(resume).toHaveBeenCalledTimes(1)
  })

  it("reuses the one context and leaves it alone once it is running", async () => {
    const { constructions, resume } = stubAudioContext("suspended")

    const { primeChime } = await import("./chime")
    primeChime()
    primeChime()

    // Starting a timer twice must not stack up audio contexts, and a context that is
    // already running has nothing to resume.
    expect(constructions()).toBe(1)
    expect(resume).toHaveBeenCalledTimes(1)
  })
})

describe("playChime", () => {
  it("does nothing when the Web Audio API is unavailable", () => {
    // jsdom has no AudioContext, so this must no-op rather than throw.
    expect(() => playChime()).not.toThrow()
  })

  it("schedules oscillators when an audio context is available", async () => {
    const { createOscillator, start, stop } = stubAudioContext()

    const { playChime: play } = await import("./chime")
    play()

    expect(createOscillator).toHaveBeenCalledTimes(2)
    expect(start).toHaveBeenCalledTimes(2)
    expect(stop).toHaveBeenCalledTimes(2)
  })

  it("resumes a suspended context rather than scheduling into silence", async () => {
    // A timer whose Start was never pressed in this tab reaches zero with the context
    // still suspended, and the chime is the gesture-less call the priming is for.
    const { createOscillator, resume } = stubAudioContext("suspended")

    const { playChime: play } = await import("./chime")
    play()

    expect(resume).toHaveBeenCalledTimes(1)
    expect(createOscillator).toHaveBeenCalledTimes(2)
  })
})
