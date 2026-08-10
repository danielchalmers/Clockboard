// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { ColorPresetPicker } from "./ColorPresetPicker"
import { COLOR_PRESETS } from "~/lib/colors"
import type { WidgetColorPreset } from "~/lib/types"

const first = COLOR_PRESETS[0]!
const second = COLOR_PRESETS[1]!
const last = COLOR_PRESETS[COLOR_PRESETS.length - 1]!

// The picker is controlled, so arrow keys only appear to move if the parent adopts each change the way the edit dialog does.
const ControlledPicker = ({
  initial,
  onChange
}: {
  initial: WidgetColorPreset
  onChange?: (preset: WidgetColorPreset) => void
}) => {
  const [value, setValue] = useState(initial)

  return (
    <ColorPresetPicker
      value={value}
      onChange={(preset) => {
        setValue(preset)
        onChange?.(preset)
      }}
    />
  )
}

const swatch = (label: string) => screen.getByRole("radio", { name: label })

describe("ColorPresetPicker", () => {
  it("selects the swatch that was clicked", () => {
    const onChange = vi.fn()
    render(<ControlledPicker initial={first.id} onChange={onChange} />)

    fireEvent.click(swatch(last.label))

    expect(onChange).toHaveBeenCalledWith(last.id)
    expect(swatch(last.label)).toBeChecked()
    expect(swatch(first.label)).not.toBeChecked()
  })

  it("leaves only the selected swatch tabbable", () => {
    render(<ControlledPicker initial={second.id} />)

    const group = screen.getByRole("radiogroup", { name: "Widget color" })
    const tabbable = within(group)
      .getAllByRole("radio")
      .filter((element) => element.getAttribute("tabindex") === "0")

    // A radiogroup is one tab stop: Tab reaches the current color, and the arrow keys move within it.
    expect(tabbable).toEqual([swatch(second.label)])
  })

  it("commits the selection as the arrow keys move focus", () => {
    const onChange = vi.fn()
    render(<ControlledPicker initial={first.id} onChange={onChange} />)

    fireEvent.keyDown(swatch(first.label), { key: "ArrowRight" })

    // There is no separate commit step, so the swatch under focus is always the chosen color.
    expect(onChange).toHaveBeenCalledWith(second.id)
    expect(swatch(second.label)).toBeChecked()
    expect(document.activeElement).toBe(swatch(second.label))
  })

  it("wraps around at both ends of the row", () => {
    render(<ControlledPicker initial={first.id} />)

    fireEvent.keyDown(swatch(first.label), { key: "ArrowLeft" })
    expect(swatch(last.label)).toBeChecked()
    expect(document.activeElement).toBe(swatch(last.label))

    fireEvent.keyDown(swatch(last.label), { key: "ArrowRight" })
    expect(swatch(first.label)).toBeChecked()
    expect(document.activeElement).toBe(swatch(first.label))
  })
})
