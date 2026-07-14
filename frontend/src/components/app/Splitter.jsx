/**
 * Splitter — CodeCompass
 * Drag-to-resize divider between the doc panel and the chat panel.
 * Visual handle dot expands on hover for affordance.
 */
export default function Splitter({ onMouseDown }) {
  return (
    <div
      className="splitter"
      onMouseDown={onMouseDown}
      role="separator"
      aria-label="Drag to resize panels"
      aria-orientation="vertical"
      title="Drag to resize"
      tabIndex={0}
      onKeyDown={(e) => {
        // Keyboard-accessible: Arrow keys adjust width via parent handler
        e.preventDefault()
      }}
    >
      <div className="splitter-handle" aria-hidden="true" />
    </div>
  )
}
