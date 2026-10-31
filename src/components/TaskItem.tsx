import type { CSSProperties } from 'react'
import type { Task } from '../tasks/types.ts'

type TaskItemProps = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const doneStyle: CSSProperties = { textDecoration: 'line-through' }
const checkboxStyle: CSSProperties = { marginRight: '0.4rem' }
const deleteStyle: CSSProperties = { marginLeft: '0.75rem' }

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          style={checkboxStyle}
        />
        <span style={task.done ? doneStyle : undefined}>{task.text}</span>
      </label>
      <button
        type="button"
        aria-label={`Delete ${task.text}`}
        onClick={() => onDelete(task.id)}
        style={deleteStyle}
      >
        Delete
      </button>
    </li>
  )
}
