import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { Task } from '../tasks/types.ts'
import { TaskItem } from './TaskItem.tsx'

type TaskListProps = {
  /** List order is display order. `addTask` appends, so the newest task is last. */
  tasks: readonly Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => boolean
  /** Focus the add-task field when a delete leaves the list empty. */
  onEmptyFocus: () => void
}

export function TaskList({ tasks, onToggle, onDelete, onEdit, onEmptyFocus }: TaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const checkboxRefs = useRef(new Map<string, HTMLInputElement>())
  const pendingFocus = useRef<string | 'add' | null>(null)

  const setCheckboxRef = useCallback((id: string, node: HTMLInputElement | null) => {
    if (node) {
      checkboxRefs.current.set(id, node)
      return
    }
    checkboxRefs.current.delete(id)
  }, [])

  function startEdit(id: string) {
    setEditingId(id)
  }

  function stopEdit(id: string) {
    setEditingId((current) => (current === id ? null : current))
  }

  function handleDelete(id: string) {
    const index = tasks.findIndex((task) => task.id === id)
    if (index === -1) {
      onDelete(id)
      return
    }

    const nextId = tasks[index + 1]?.id ?? tasks[index - 1]?.id
    pendingFocus.current = nextId ?? 'add'
    onDelete(id)
  }

  useLayoutEffect(() => {
    const target = pendingFocus.current
    if (target === null) {
      return
    }
    pendingFocus.current = null
    if (target === 'add') {
      onEmptyFocus()
      return
    }
    checkboxRefs.current.get(target)?.focus()
  }, [tasks, onEmptyFocus])

  if (tasks.length === 0) {
    return <p>No tasks yet</p>
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          editing={task.id === editingId}
          onToggle={onToggle}
          onDelete={handleDelete}
          onEdit={onEdit}
          onStartEdit={startEdit}
          onStopEdit={stopEdit}
          checkboxRef={(node) => setCheckboxRef(task.id, node)}
        />
      ))}
    </ul>
  )
}
