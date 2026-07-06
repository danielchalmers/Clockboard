import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useState, type ReactNode } from "react"

import { BoardRow } from "~/components/BoardRow"
import type { Widget } from "~/lib/types"

export const ARCHIVE_DROP_ID = "dayboard-archive-dropzone"

// Registered by the active board's empty state, so an archived card can still
// be dragged home when there are no board cards left to aim at.
export const BOARD_DROP_ID = "dayboard-board-dropzone"

const ARCHIVE_ICON = (
  <path
    d="M4 7.5h16M4 7.5 5.2 19a1.5 1.5 0 0 0 1.5 1.4h10.6a1.5 1.5 0 0 0 1.5-1.4L20 7.5M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M10 11.5v5M14 11.5v5"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.7"
  />
)

// The archive drop target only exists mid-drag, pinned to the bottom of the
// viewport so it is always reachable however tall the board is. Restoring has
// no counterpart zone: an archived card is dropped straight onto the board,
// into the exact slot it should take.
const ArchiveDropZone = () => {
  const { setNodeRef, isOver } = useDroppable({ id: ARCHIVE_DROP_ID })

  return (
    <div
      ref={setNodeRef}
      className={`archive-dropzone${isOver ? " archive-dropzone--over" : ""}`}
      aria-hidden="true">
      <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
        {ARCHIVE_ICON}
      </svg>
      <span>{isOver ? "Release to archive" : "Drag here to archive"}</span>
    </div>
  )
}

interface BoardDndProps {
  // The full storage list — both boards' cards — so any dragged id resolves.
  widgets: Widget[]
  now: Date
  onReorder?: (activeId: string, overId: string) => void
  onArchive?: (id: string) => void
  // `beforeId` is the board card whose slot the restored widget takes; omitted
  // when the drop had no specific target (the empty-board zone).
  onRestore?: (id: string, beforeId?: string) => void
  children: ReactNode
}

// One drag context shared by the active board and the archived list, so a card
// can travel between them: an archived card drops onto a specific board slot to
// restore there, while an active card drops onto the floating archive zone.
export const BoardDnd = ({
  widgets,
  now,
  onReorder,
  onArchive,
  onRestore,
  children
}: BoardDndProps) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const activeItem = activeId
    ? widgets.find((widget) => widget.id === activeId) ?? null
    : null

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const dragged = widgets.find((widget) => widget.id === active.id)

    if (!dragged) {
      return
    }

    if (over.id === ARCHIVE_DROP_ID) {
      if (!dragged.archived) {
        onArchive?.(dragged.id)
      }
      return
    }

    if (over.id === BOARD_DROP_ID) {
      if (dragged.archived) {
        onRestore?.(dragged.id)
      }
      return
    }

    const target = widgets.find((widget) => widget.id === over.id)

    if (!target) {
      return
    }

    // Within one list it is a plain reorder; across lists the direction decides:
    // an archived card dropped on a board card restores into that card's slot,
    // and a board card dropped among the archived cards simply archives (the
    // archive keeps no meaningful order to aim for).
    if (Boolean(dragged.archived) === Boolean(target.archived)) {
      onReorder?.(dragged.id, target.id)
    } else if (dragged.archived) {
      onRestore?.(dragged.id, target.id)
    } else {
      onArchive?.(dragged.id)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}>
      {children}
      {activeItem && !activeItem.archived && onArchive ? (
        <ArchiveDropZone />
      ) : null}
      {/* The lifted card follows the cursor in a portal, so it keeps tracking
          the pointer even over the archive zone and the other list (which sit
          outside its own sortable context) instead of snapping back to its
          slot. */}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <BoardRow className="board-row--overlay" item={activeItem} now={now} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
