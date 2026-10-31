import { useRef, useState } from 'react'
import { loadTasks, saveTasks } from '../tasks/storage.ts'
import { addTask, deleteTask, editTask, toggleTask } from '../tasks/tasks.ts'
import type { Task } from '../tasks/types.ts'

const SAVE_ERROR_MESSAGE = "Couldn't save, changes may be lost"

/**
 * Task list for the screen.
 *
 * `loadTasks()` runs once, when the hook is first used. `add`, `toggle`,
 * `remove`, and `edit` build the next list from the latest tasks, then keep
 * that same array in memory and pass it to `saveTasks`. Empty or whitespace-only
 * text, text that already matches after trimming, and an id that is not in the
 * list come back as the same array, so nothing is saved. `add` and `edit`
 * return false in that case. If `saveTasks` throws, the new list stays on
 * screen, `saveError` is set, and the error is not rethrown.
 */
export function useTasks(): {
  tasks: Task[]
  saveError: string | null
  add: (text: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  edit: (id: string, text: string) => boolean
} {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [saveError, setSaveError] = useState<string | null>(null)
  // Only `commit` may call `setTasks`. It writes `tasksRef` first.
  const tasksRef = useRef(tasks)

  function commit(next: Task[]): void {
    tasksRef.current = next
    setTasks(next)
    try {
      saveTasks(next)
      setSaveError(null)
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE)
    }
  }

  function add(text: string): boolean {
    const current = tasksRef.current
    const next = addTask(current, text)
    if (next === current) {
      return false
    }

    commit(next)
    return true
  }

  function toggle(id: string): void {
    const current = tasksRef.current
    const next = toggleTask(current, id)
    if (next === current) {
      return
    }

    commit(next)
  }

  function remove(id: string): void {
    const current = tasksRef.current
    const next = deleteTask(current, id)
    if (next === current) {
      return
    }

    commit(next)
  }

  function edit(id: string, text: string): boolean {
    const current = tasksRef.current
    const next = editTask(current, id, text)
    if (next === current) {
      return false
    }

    commit(next)
    return true
  }

  return { tasks, saveError, add, toggle, remove, edit }
}
