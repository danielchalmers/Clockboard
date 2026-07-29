import { createEvent, fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BoardList, isDaySensitive, isTimeSensitive } from "./BoardList"
import { toDayKey } from "~/lib/habit"
import type { Widget, WidgetKind } from "~/lib/types"

const widgets: Widget[] = [
  {
    id: "local",
    kind: "clock",
    title: "Local time",
    colorPreset: "slate",
    settings: {
      timeZone: "UTC"
    }
  },
  {
    id: "launch",
    kind: "countdown",
    title: "Launch",
    colorPreset: "rose",
    settings: {
      targetAt: "2026-01-02T09:00:00.000Z"
    }
  }
]

const renderActions = (item: Widget) => (
  <>
    <button aria-label={`Move ${item.title} back`} role="menuitem" type="button">
      Move back
    </button>
    <button aria-label={`Edit ${item.title}`} role="menuitem" type="button">
      Edit
    </button>
  </>
)

const renderBoard = () =>
  render(
    <BoardList
      items={widgets}
      now={new Date("2026-01-01T12:30:00.000Z")}
      renderItemActions={renderActions}
    />
  )

const openMenu = (
  container: HTMLElement,
  coordinates: { clientX: number; clientY: number }
) => {
  const card = container.querySelector(".board-row--draggable") as HTMLElement
  card.focus()
  fireEvent.contextMenu(card, coordinates)
  return card
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      addEventListener: () => {},
      matches: false,
      removeEventListener: () => {}
    })
  })
})

describe("isTimeSensitive", () => {
  it("marks only the widgets that need the per-second tick", () => {
    const live: WidgetKind[] = ["clock", "countdown", "stopwatch", "timer"]
    const still: WidgetKind[] = ["note", "quote", "habit"]

    expect(live.every(isTimeSensitive)).toBe(true)
    expect(still.some(isTimeSensitive)).toBe(false)
  })
})

describe("isDaySensitive", () => {
  it("marks only the widgets that must notice local midnight", () => {
    const daily: WidgetKind[] = ["habit", "quote"]
    const indifferent: WidgetKind[] = [
      "clock",
      "countdown",
      "note",
      "stopwatch",
      "timer"
    ]

    expect(daily.every(isDaySensitive)).toBe(true)
    expect(indifferent.some(isDaySensitive)).toBe(false)
  })
})

// A new tab can sit open overnight.
// These rows skip the per-second tick, so they only see a fresh `now` if the memo lets midnight through.
describe("a board left open across local midnight", () => {
  const lateMonday = new Date(2026, 2, 2, 23, 59, 0)
  const earlyTuesday = new Date(2026, 2, 3, 0, 1, 0)

  const habit: Widget = {
    id: "walk",
    kind: "habit",
    title: "Daily walk",
    colorPreset: "amber",
    settings: { history: [] }
  }

  it("marks the new day, not the day the tab was opened on", () => {
    const onWidgetChange = vi.fn()
    const { rerender } = render(
      <BoardList
        items={[habit]}
        now={lateMonday}
        onWidgetChange={onWidgetChange}
      />
    )

    rerender(
      <BoardList
        items={[habit]}
        now={earlyTuesday}
        onWidgetChange={onWidgetChange}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Mark today" }))

    expect(onWidgetChange).toHaveBeenCalledWith({
      ...habit,
      settings: { history: [toDayKey(earlyTuesday)] }
    })
  })

  it("reopens yesterday's completed habit for the new day", () => {
    const done: Widget = {
      ...habit,
      settings: { history: [toDayKey(lateMonday)] }
    }

    const { container, rerender } = render(
      <BoardList items={[done]} now={lateMonday} />
    )
    expect(screen.getByRole("button", { name: "Done today ✓" })).toBeInTheDocument()

    rerender(<BoardList items={[done]} now={earlyTuesday} />)

    // Yesterday's dot stays lit, but today is unmarked again.
    expect(screen.getByRole("button", { name: "Mark today" })).toBeInTheDocument()
    expect(container.querySelectorAll(".habit-day--done")).toHaveLength(1)
  })

  it("rotates a daily quote onto the new day", () => {
    const quote: Widget = {
      id: "quote",
      kind: "quote",
      title: "Quote",
      colorPreset: "sky",
      settings: { quotes: ["First", "Second"], rotation: "daily" }
    }

    const { container, rerender } = render(
      <BoardList items={[quote]} now={lateMonday} />
    )
    const monday = container.querySelector(".quote-text")?.textContent

    rerender(<BoardList items={[quote]} now={earlyTuesday} />)

    expect(container.querySelector(".quote-text")?.textContent).not.toBe(monday)
  })
})

describe("BoardList", () => {
  it("shows a kind-agnostic empty state when there are no widgets", () => {
    render(<BoardList items={[]} now={new Date("2026-01-01T12:30:00.000Z")} />)

    expect(
      screen.getByRole("heading", { name: "A fresh start" })
    ).toBeInTheDocument()
    expect(screen.getByText(/add a clock, a countdown, a note/i)).toBeInTheDocument()
  })

  it("makes each widget card draggable", () => {
    const { container } = render(<BoardList items={widgets} now={new Date("2026-01-01T12:30:00.000Z")} />)

    expect(container.querySelectorAll(".board-row--draggable")).toHaveLength(2)
  })

  it("exposes a drag-handle frame inside each draggable card", () => {
    const { container } = render(<BoardList items={widgets} now={new Date("2026-01-01T12:30:00.000Z")} />)

    const frames = container.querySelectorAll(".board-row__frame")

    expect(frames).toHaveLength(2)
    frames.forEach((frame) => {
      expect(frame.closest(".board-row--draggable")).not.toBeNull()
    })
  })

  it("opens a free-form popover menu under the cursor on right click", () => {
    const { container } = renderBoard()

    expect(screen.queryByLabelText("Actions for Local time")).not.toBeInTheDocument()
    expect(container.querySelector(".card-menu__panel")).not.toBeInTheDocument()

    const card = openMenu(container, { clientX: 320, clientY: 240 })

    const panel = screen.getByLabelText("Actions for Local time")
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute("role", "menu")
    expect(screen.getByLabelText("Edit Local time")).toBeInTheDocument()

    const menu = panel.closest(".card-menu") as HTMLElement
    // It is a native popover rendered outside the card so it can break free of it.
    expect(menu).toHaveAttribute("popover", "auto")
    expect(card.contains(menu)).toBe(false)

    // It spawns under the cursor rather than in a fixed corner of the card.
    expect(menu.style.left).toBe("320px")
    expect(menu.style.top).toBe("240px")
  })

  it("clamps the menu back inside the viewport when the cursor is near an edge", () => {
    const { container } = renderBoard()

    openMenu(container, { clientX: -50, clientY: -50 })

    const menu = screen
      .getByLabelText("Actions for Local time")
      .closest(".card-menu") as HTMLElement

    // Negative cursor coordinates are clamped back to the viewport margin.
    expect(menu.style.left).toBe("8px")
    expect(menu.style.top).toBe("8px")
  })

  it("clamps the menu so its real size stays on screen near the right and bottom edges", () => {
    const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth")
    const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")
    const innerWidth = Object.getOwnPropertyDescriptor(window, "innerWidth")
    const innerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight")

    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 300 })
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 200 })
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 })
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 400 })

    try {
      const { container } = renderBoard()

      openMenu(container, { clientX: 480, clientY: 380 })

      const menu = screen
        .getByLabelText("Actions for Local time")
        .closest(".card-menu") as HTMLElement

      // Clamped to innerWidth/Height − menu size − 8px margin, measured at full size.
      expect(menu.style.left).toBe("192px")
      expect(menu.style.top).toBe("192px")
    } finally {
      if (offsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", offsetWidth)
      if (offsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeight)
      if (innerWidth) Object.defineProperty(window, "innerWidth", innerWidth)
      if (innerHeight) Object.defineProperty(window, "innerHeight", innerHeight)
    }
  })

  it("moves focus into the menu so keyboard users can reach it", () => {
    const { container } = renderBoard()

    openMenu(container, { clientX: 10, clientY: 10 })

    expect(document.activeElement).toBe(screen.getByLabelText("Move Local time back"))
  })

  it("moves focus between items with the arrow keys, Home, and End", () => {
    const { container } = renderBoard()

    openMenu(container, { clientX: 10, clientY: 10 })

    const moveUp = screen.getByLabelText("Move Local time back")
    const edit = screen.getByLabelText("Edit Local time")
    const panel = screen.getByLabelText("Actions for Local time")

    expect(document.activeElement).toBe(moveUp)

    fireEvent.keyDown(panel, { key: "ArrowDown" })
    expect(document.activeElement).toBe(edit)

    fireEvent.keyDown(panel, { key: "ArrowDown" })
    expect(document.activeElement).toBe(moveUp) // wraps to the first item

    fireEvent.keyDown(panel, { key: "ArrowUp" })
    expect(document.activeElement).toBe(edit) // wraps to the last item

    fireEvent.keyDown(panel, { key: "Home" })
    expect(document.activeElement).toBe(moveUp)

    fireEvent.keyDown(panel, { key: "End" })
    expect(document.activeElement).toBe(edit)
  })

  it("leaves the native menu alone when text on the card is selected", () => {
    const { container } = renderBoard()

    const card = container.querySelector(".board-row--draggable") as HTMLElement
    const title = card.querySelector(".board-row__title") as HTMLElement
    const selection = window.getSelection()!
    const range = document.createRange()
    range.selectNodeContents(title)
    selection.removeAllRanges()
    selection.addRange(range)

    const event = createEvent.contextMenu(card, { clientX: 10, clientY: 10 })
    fireEvent(card, event)

    expect(event.defaultPrevented).toBe(false)
    expect(screen.queryByLabelText("Actions for Local time")).not.toBeInTheDocument()
  })

  // Triple-clicking a line is the most ordinary way to select one, and Chrome runs the resulting range past the end of the block it started in, so the range's common ancestor lands outside the card entirely.
  it("leaves the native menu alone when the selection runs past the card", () => {
    const { container } = renderBoard()

    const cards = container.querySelectorAll<HTMLElement>(".board-row--draggable")
    const selection = window.getSelection()!
    const range = document.createRange()
    range.setStart(cards[0]!.querySelector(".board-row__title")!, 0)
    range.setEnd(cards[1]!.querySelector(".board-row__title")!, 0)
    selection.removeAllRanges()
    selection.addRange(range)

    const event = createEvent.contextMenu(cards[0]!, { clientX: 10, clientY: 10 })
    fireEvent(cards[0]!, event)

    expect(event.defaultPrevented).toBe(false)
    expect(screen.queryByLabelText("Actions for Local time")).not.toBeInTheDocument()
  })

  it("still opens its own menu when the selection sits on another card", () => {
    const { container } = renderBoard()

    const cards = container.querySelectorAll<HTMLElement>(".board-row--draggable")
    const selection = window.getSelection()!
    const range = document.createRange()
    range.selectNodeContents(cards[1]!.querySelector(".board-row__title")!)
    selection.removeAllRanges()
    selection.addRange(range)

    fireEvent.contextMenu(cards[0]!, { clientX: 10, clientY: 10 })

    expect(screen.getByLabelText("Actions for Local time")).toBeInTheDocument()
  })

  it("closes the menu when an item is chosen", () => {
    const { container } = renderBoard()

    openMenu(container, { clientX: 10, clientY: 10 })
    fireEvent.click(screen.getByLabelText("Edit Local time"))

    expect(screen.queryByLabelText("Actions for Local time")).not.toBeInTheDocument()
  })
})

// Focus is the acknowledgement, not Enter or Space: dnd-kit already claims those on a focused card to begin a keyboard drag.
describe("settling a card that needs attention", () => {
  const habit: Widget = {
    id: "walk",
    kind: "habit",
    title: "Daily walk",
    colorPreset: "amber",
    settings: { history: [] }
  }
  const now = new Date(2026, 5, 19, 9, 0, 0)
  const attentionIds = new Set(["walk"])

  const renderHabit = (onAcknowledge?: () => void) =>
    render(
      <BoardList
        attentionIds={attentionIds}
        items={[habit]}
        now={now}
        onAcknowledge={onAcknowledge}
      />
    )

  it("acknowledges on a click anywhere on the card, and on focus", () => {
    const onAcknowledge = vi.fn()
    const { container } = renderHabit(onAcknowledge)

    fireEvent.click(screen.getByRole("heading", { name: "Daily walk" }))
    expect(onAcknowledge).toHaveBeenCalledWith("walk")

    onAcknowledge.mockClear()
    ;(container.querySelector(".board-row--draggable") as HTMLElement).focus()
    expect(onAcknowledge).toHaveBeenCalledWith("walk")
  })

  it("leaves Enter to dnd-kit so keyboard reordering keeps working", () => {
    const { container } = renderHabit()
    const card = container.querySelector(".board-row--draggable") as HTMLElement

    expect(fireEvent.keyDown(card, { key: "Enter", code: "Enter" })).toBe(true)
  })

  it("says nothing on a card that is already settled", () => {
    const onAcknowledge = vi.fn()
    render(<BoardList items={[habit]} now={now} onAcknowledge={onAcknowledge} />)

    fireEvent.click(screen.getByRole("heading", { name: "Daily walk" }))

    expect(onAcknowledge).not.toHaveBeenCalled()
  })

  // A habit is only day-sensitive, so the memo comparator is the only thing that lets an acknowledgement through before midnight.
  it("drops the dot on the next render, not at midnight", () => {
    const { container, rerender } = renderHabit()
    expect(container.querySelector(".board-row__attention-dot")).not.toBeNull()

    rerender(<BoardList attentionIds={new Set()} items={[habit]} now={now} />)

    expect(container.querySelector(".board-row__attention-dot")).toBeNull()
  })
})
