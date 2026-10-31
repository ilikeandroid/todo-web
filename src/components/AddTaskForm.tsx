import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'

const EMPTY_TASK_HINT = 'Enter a task'

type AddTaskFormProps = {
  /** True when the task was added. False when `addTask` rejected the text. */
  onAdd: (text: string) => boolean
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    if (event.key !== 'Enter' || event.repeat || event.nativeEvent.isComposing) {
      return
    }

    // Browsers submit the form on Enter. Cancel that and submit once so the
    // task is not added twice. jsdom does not submit on Enter; requestSubmit
    // takes the same onSubmit path in tests.
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value)
    if (hint !== null) {
      setHint(null)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="task-text">Task</label>
      <input
        id="task-text"
        type="text"
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-invalid={hint === null ? undefined : true}
        aria-describedby={hint === null ? undefined : 'task-hint'}
      />
      <button type="submit">Add</button>
      {hint !== null ? <p id="task-hint">{hint}</p> : null}
    </form>
  )
}
