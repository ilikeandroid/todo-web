import { useCallback, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent, Ref } from 'react'

const EMPTY_TASK_HINT = 'Enter a task'

type AddTaskFormProps = {
  /** True when the task was added. False when `addTask` rejected the text. */
  onAdd: (text: string) => boolean
  /** Ref for the task field, so a delete can move focus here. */
  inputRef?: Ref<HTMLInputElement>
}

export function AddTaskForm({ onAdd, inputRef: externalRef }: AddTaskFormProps) {
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const externalRefHolder = useRef(externalRef)
  const fieldId = useId()
  const hintId = useId()

  const assignInput = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node
    const external = externalRefHolder.current
    if (typeof external === 'function') {
      external(node)
      return
    }
    if (external) {
      external.current = node
    }
  }, [])

  function commit() {
    if (!onAdd(text)) {
      setHint(EMPTY_TASK_HINT)
      return
    }

    setText('')
    setHint(null)
    inputRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    commit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }

    // A normal Enter is left for the form's native submit, which runs once.
    // Repeat and IME keydowns still use that default in browsers. Cancel them
    // so a held Enter does not submit the cleared field and flash the hint.
    if (event.repeat || event.nativeEvent.isComposing) {
      event.preventDefault()
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value)
    if (hint !== null) {
      setHint(null)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={fieldId}>Task</label>
      <input
        id={fieldId}
        type="text"
        ref={assignInput}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-invalid={hint === null ? undefined : true}
        aria-describedby={hint === null ? undefined : hintId}
      />
      <button type="submit">Add</button>
      {hint !== null ? <p id={hintId}>{hint}</p> : null}
    </form>
  )
}
