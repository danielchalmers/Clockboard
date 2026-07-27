import { useRef } from "react"

import { useModalFocus } from "~/hooks/useModalFocus"
import { usePresence } from "~/hooks/usePresence"
import { DIALOG_EXIT_MS } from "~/lib/motion"
import type { Widget } from "~/lib/types"
import { widgetRegistry } from "~/lib/widgets"

interface DeleteDialogProps {
  isOpen: boolean
  item: Widget | null
  onCancel: () => void
  onConfirm: (item: Widget) => void
}

export const DeleteDialog = ({
  isOpen,
  item,
  onCancel,
  onConfirm
}: DeleteDialogProps) => {
  const dialogRef = useRef<HTMLElement>(null)
  const { isPresent, isClosing } = usePresence(isOpen, DIALOG_EXIT_MS)

  useModalFocus(isOpen, dialogRef, onCancel)

  if (!isPresent || !item) {
    return null
  }

  const widgetDefinition = widgetRegistry[item.kind]

  return (
    <div
      className={`modal-backdrop${isClosing ? " modal-backdrop--closing" : ""}`}
      // On its way out it is scenery: not clickable, not reachable, and not
      // announced, even though it is still on screen for the animation.
      inert={isClosing}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}>
      <section
        aria-labelledby="delete-dialog-title"
        aria-modal="true"
        className="modal-dialog modal-dialog--narrow"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}>
        <div className="modal-dialog__header">
          <div>
            <h2 className="modal-dialog__title" id="delete-dialog-title">
              Delete {widgetDefinition.kind}?
            </h2>
            <p className="modal-dialog__subtitle">
              {item.archived
                ? `This removes ${item.title} for good.`
                : `This removes ${item.title} for good. If you might want it back, archive it instead.`}
            </p>
          </div>
        </div>

        <div className="modal-dialog__actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="danger-button"
            onClick={() => onConfirm(item)}
            type="button">
            Delete widget
          </button>
        </div>
      </section>
    </div>
  )
}
