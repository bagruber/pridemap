import { useRef, useState } from 'react'

/**
 * Drag a bottom sheet between fixed heights.
 *
 * The sheet follows the finger while dragging and snaps to the nearest stop on
 * release — a sheet that only jumps between stops feels like a button that
 * happens to be shaped like a sheet.
 *
 * `stops` are heights in px, smallest first. Returns the height to render, the
 * current stop index, and the handlers for the grab area.
 */
export function useSheetDrag(stops, initial = 0, { onSettle } = {}) {
  const [index, setIndex] = useState(initial)
  const [dragHeight, setDragHeight] = useState(null)
  const start = useRef(null)

  const settle = i => {
    const clamped = Math.max(0, Math.min(stops.length - 1, i))
    setIndex(clamped)
    onSettle?.(clamped)
    return clamped
  }

  const onPointerDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { y: e.clientY, h: stops[index], moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = e => {
    if (!start.current) return
    const dy = start.current.y - e.clientY
    if (Math.abs(dy) > 3) start.current.moved = true
    const lo = stops[0] - 80            // a little give, so it feels elastic
    const hi = stops[stops.length - 1] + 40
    setDragHeight(Math.max(lo, Math.min(hi, start.current.h + dy)))
  }

  const onPointerUp = () => {
    if (!start.current) return
    const { h, moved } = start.current
    start.current = null
    const current = dragHeight
    setDragHeight(null)
    // A tap, not a drag: step up one stop, or back to the bottom from the top
    if (!moved || current == null) {
      settle(index === stops.length - 1 ? 0 : index + 1)
      return
    }
    // Snap to whichever stop the finger ended up nearest, but always move at
    // least one stop in the direction of the gesture
    let nearest = 0
    for (let i = 1; i < stops.length; i++) {
      if (Math.abs(stops[i] - current) < Math.abs(stops[nearest] - current)) nearest = i
    }
    if (nearest === index && Math.abs(current - h) > 40) {
      nearest = current > h ? index + 1 : index - 1
    }
    settle(nearest)
  }

  return {
    index,
    setIndex: settle,
    height: dragHeight ?? stops[index],
    dragging: dragHeight != null,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
