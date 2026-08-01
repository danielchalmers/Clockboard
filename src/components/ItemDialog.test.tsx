import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"

import { ItemDialog } from "./ItemDialog"
import type { CountdownWidget, Widget } from "~/lib/types"

const clockItem: Widget = {
  id: "clock-1",
  kind: "clock",
  title: "Local time",
  colorPreset: "slate",
  settings: { timeZone: "UTC" }
}

const timerItem: Widget = {
  id: "timer-1",
  kind: "timer",
  title: "Tea",
  colorPreset: "slate",
  settings: {
    durationMs: 60_000,
    running: false,
    remainingMs: 60_000,
    endsAt: null,
    chime: false
  }
}

const quoteItem: Widget = {
  id: "quote-1",
  kind: "quote",
  title: "Mantras",
  colorPreset: "slate",
  settings: {
    quotes: ["One small thing, done well."],
    rotation: "daily"
  }
}

const countdownItem: CountdownWidget = {
  id: "countdown-1",
  kind: "countdown",
  title: "Launch",
  colorPreset: "slate",
  settings: {
    targetAt: new Date(2026, 0, 2, 9, 0, 0).toISOString(),
    startAt: new Date(2026, 0, 1, 9, 0, 0).toISOString()
  }
}

// An open clock in edit mode with inert callbacks, so each test names only the props it actually cares about.
const itemDialog = (props: Partial<ComponentProps<typeof ItemDialog>> = {}) => (
  <ItemDialog
    isOpen
    item={clockItem}
    mode="edit"
    onClose={() => {}}
    onSave={() => {}}
    {...props}
  />
)

const saved = (onSave: ReturnType<typeof vi.fn>) => onSave.mock.calls[0]![0]

describe("ItemDialog", () => {
  it("saves the current edit when the backdrop is clicked", () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(itemDialog({ onClose, onSave }))

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Berlin" }
    })

    const backdrop = document.querySelector(".modal-backdrop") as HTMLElement
    fireEvent.pointerDown(backdrop)

    // Clicking the backdrop commits the edit rather than discarding it.
    expect(onClose).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(saved(onSave)).toMatchObject({ id: "clock-1", title: "Berlin" })
  })

  it("closes on Escape without saving, even when opened by a prop change", () => {
    const onClose = vi.fn()
    const onSave = vi.fn()

    // Mount closed, then open it the way the app does, flipping isOpen and supplying the item together, so the focus/Escape wiring has to survive the draft being adopted on open.
    const { rerender } = render(
      itemDialog({ isOpen: false, item: null, mode: "add", onClose, onSave })
    )
    rerender(itemDialog({ onClose, onSave }))

    const dialog = screen.getByRole("dialog")
    // Focus moved into the dialog, proving the modal focus hook wired up.
    expect(dialog.contains(document.activeElement)).toBe(true)

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Discarded" }
    })
    fireEvent.keyDown(dialog, { key: "Escape" })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })

  it("toggles the per-timer chime and saves it", () => {
    const onSave = vi.fn()

    render(itemDialog({ item: timerItem, onSave }))

    const chime = screen.getByRole("switch", { name: "Chime when it ends" })
    expect(chime).not.toBeChecked()

    fireEvent.click(chime)
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(saved(onSave).settings.chime).toBe(true)
  })

  it("edits a clock's time zone", () => {
    const onSave = vi.fn()

    render(itemDialog({ onSave }))

    fireEvent.change(screen.getByLabelText("Time zone (type to search)"), {
      target: { value: "Europe/Berlin" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(saved(onSave).settings.timeZone).toBe("Europe/Berlin")
  })

  it("rewrites a quote list without disturbing its rotation", () => {
    const onSave = vi.fn()

    render(itemDialog({ item: quoteItem, onSave }))

    fireEvent.change(screen.getByLabelText("Quotes (one per line)"), {
      target: { value: "Begin where you are.\nQuiet days still count." }
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(saved(onSave).settings.quotes).toEqual([
      "Begin where you are.",
      "Quiet days still count."
    ])
    expect(saved(onSave).settings.rotation).toBe("daily")
  })

  it("changes a quote's rotation without disturbing its list", () => {
    const onSave = vi.fn()

    render(itemDialog({ item: quoteItem, onSave }))

    fireEvent.change(screen.getByLabelText("Show a new one"), {
      target: { value: "open" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(saved(onSave).settings.rotation).toBe("open")
    expect(saved(onSave).settings.quotes).toEqual(quoteItem.settings.quotes)
  })

  it("clears a countdown's start so the card drops the progress bar", () => {
    const onSave = vi.fn()

    render(itemDialog({ item: countdownItem, onSave }))

    expect(screen.getByLabelText("Starting from")).toHaveValue("2026-01-01T09:00")

    fireEvent.change(screen.getByLabelText("Starting from"), {
      target: { value: "" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(saved(onSave).settings.startAt).toBeUndefined()
    // Clearing the start must not disturb the target.
    expect(saved(onSave).settings.targetAt).toBe(countdownItem.settings.targetAt)
  })

  it("keeps an hourly repeat on a countdown", () => {
    const onSave = vi.fn()

    render(itemDialog({ item: countdownItem, onSave }))

    fireEvent.change(screen.getByLabelText("Repeats"), {
      target: { value: "hourly" }
    })
    // Moving the target must leave the span's start (and the bar) alone.
    fireEvent.change(screen.getByLabelText("When"), {
      target: { value: "2026-01-03T09:00" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(saved(onSave).settings.repeat).toBe("hourly")
    expect(saved(onSave).settings.startAt).toBe(countdownItem.settings.startAt)
  })

  it("ignores clicks that land inside the dialog", () => {
    const onSave = vi.fn()
    const onClose = vi.fn()

    render(itemDialog({ onClose, onSave }))

    // A pointer down on the dialog surface itself must not save or close.
    fireEvent.pointerDown(screen.getByRole("dialog"))

    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
