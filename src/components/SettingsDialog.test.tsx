import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"

import { SettingsDialog } from "./SettingsDialog"
import { DEFAULT_SETTINGS } from "~/lib/types"

// An open dialog on default settings with inert callbacks, so each test names only the props it actually cares about.
const settingsDialog = (
  props: Partial<ComponentProps<typeof SettingsDialog>> = {}
) => (
  <SettingsDialog
    isOpen
    settings={DEFAULT_SETTINGS}
    onChange={() => {}}
    onClose={() => {}}
    {...props}
  />
)

describe("SettingsDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(settingsDialog({ isOpen: false }))

    expect(container).toBeEmptyDOMElement()
  })

  it("keeps the options minimal — no layout knobs to fiddle with", () => {
    render(settingsDialog())

    expect(screen.queryByRole("switch")).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("edits the greeting name", () => {
    const onChange = vi.fn()
    render(settingsDialog({ onChange }))

    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Sam" }
    })

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, name: "Sam" })
  })

  it("exports from the Export button and imports a chosen file", () => {
    const onExport = vi.fn()
    const onImport = vi.fn()
    render(settingsDialog({ onExport, onImport }))

    fireEvent.click(screen.getByRole("button", { name: "Export" }))
    expect(onExport).toHaveBeenCalledTimes(1)

    const file = new File(["{}"], "board.json", { type: "application/json" })
    fireEvent.change(screen.getByLabelText("Import board file"), {
      target: { files: [file] }
    })
    expect(onImport).toHaveBeenCalledWith(file)
  })

  it("shows an import error when one is provided", () => {
    render(settingsDialog({ importError: "That file is not a Dayboard board." }))

    expect(
      screen.getByText("That file is not a Dayboard board.")
    ).toBeInTheDocument()
  })

  it("links to the project on GitHub", () => {
    render(settingsDialog())

    expect(
      screen.getByRole("link", { name: /Dayboard on GitHub/ })
    ).toHaveAttribute("href", "https://github.com/danielchalmers/Dayboard")
  })

  it("offers a feedback link to the GitHub issues page", () => {
    render(settingsDialog())

    expect(
      screen.getByRole("link", { name: /Give feedback/ })
    ).toHaveAttribute("href", "https://github.com/danielchalmers/Dayboard/issues")
  })

  it("closes from the Done button", () => {
    const onClose = vi.fn()
    render(settingsDialog({ onClose }))

    fireEvent.click(screen.getByRole("button", { name: "Done" }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
