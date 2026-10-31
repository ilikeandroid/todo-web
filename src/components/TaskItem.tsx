import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FocusEvent, KeyboardEvent, Ref } from 'react'
import type { Task } from '../tasks/types.ts'

const EMPTY_TASK_HINT = 'Enter a task'

type TaskItemProps = {
  task: Task
  editing: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => boolean
  onStartEdit: (id: string) => void
  onStopEdit: (id: string) => void
  deleteButtonRef: Ref<HTMLButtonElement>
}

const doneStyle: CSSProperties = { textDecoration: 'line-through' }
const checkboxStyle: CSSProperties = { marginRight: '0.4rem' }
const editStyle: CSSProperties = { marginLeft: '0.75rem' }
const deleteStyle: CSSProperties = { marginLeft: '0.75rem' }

/**
 * Enter saves. Empty or whitespace-only text stays in edit mode and shows
 * "Enter a task"; the stored task is unchanged. Blur saves too, except empty
 * text cancels back to the original wording with no hint and no save.
 * Escape cancels. Blur that follows Escape or Enter does not save again.
 */
export function TaskItem({
  task,
  editing,
  onToggle,
  onDelete,
  onEdit,
  onStartEdit,
  onStopEdit,
  deleteButtonRef,
}: TaskItemProps) {
  const [draft, setDraft] = useState(task.text)
  const [hint, setHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  const ignoreBlurSave = useRef(false)
  const hintId = useId()

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      return
    }
    if (!restoreFocus.current) {
      return
    }
    restoreFocus.current = false
    editButtonRef.current?.focus()
  }, [editing])

  function startEdit() {
    ignoreBlurSave.current = false
    setDraft(task.text)
    setHint(null)
    onStartEdit(task.id)
  }

  function close() {
    restoreFocus.current = true
    setHint(null)
    setDraft(task.text)
    onStopEdit(task.id)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value)
    if (hint !== null) {
      setHint(null)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== 'Escape') {
      return
    }
    if (event.repeat || event.nativeEvent.isComposing) {
      event.preventDefault()
      return
    }

    event.preventDefault()

    if (event.key === 'Escape') {
      // Leave the draft in place so the blur that follows cannot persist it.
      ignoreBlurSave.current = true
      event.currentTarget.blur()
      return
    }

    const value = event.currentTarget.value
    if (value.trim() === '') {
      onEdit(task.id, value)
      setHint(EMPTY_TASK_HINT)
      return
    }

    ignoreBlurSave.current = true
    onEdit(task.id, value)
    event.currentTarget.blur()
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    if (ignoreBlurSave.current) {
      close()
      return
    }

    const value = event.currentTarget.value
    if (value.trim() === '') {
      ignoreBlurSave.current = true
      close()
      return
    }

    ignoreBlurSave.current = true
    onEdit(task.id, value)
    close()
  }

  return (
    <li>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={task.text}
        style={checkboxStyle}
      />
      {editing ? (
        <>
          <input
            type="text"
            ref={inputRef}
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            aria-label={`Edit ${task.text}`}
            aria-invalid={hint === null ? undefined : true}
            aria-describedby={hint === null ? undefined : hintId}
            style={editStyle}
          />
          {hint !== null ? <p id={hintId}>{hint}</p> : null}
        </>
      ) : (
        <>
          <span
            onDoubleClick={startEdit}
            style={task.done ? doneStyle : undefined}
          >
            {task.text}
          </span>
          <button
            type="button"
            ref={editButtonRef}
            aria-label={`Edit ${task.text}`}
            onClick={startEdit}
            style={editStyle}
          >
            Edit
          </button>
        </>
      )}
      <button
        type="button"
        ref={deleteButtonRef}
        aria-label={`Delete ${task.text}`}
        onClick={() => onDelete(task.id)}
        style={deleteStyle}
      >
        Delete
      </button>
    </li>
  )
}
