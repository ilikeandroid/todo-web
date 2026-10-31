import { useState } from 'react'
import { loadTasks, saveTasks } from '../tasks/storage.ts'
import { addTask } from '../tasks/tasks.ts'
import type { Task } from '../tasks/types.ts'

const SAVE_ERROR_MESSAGE = "Couldn't save, changes may be lost"

/**
 * Task list for the screen.
 *
 * `loadTasks()` runs once, when the hook is first used. `add` passes the text
 * through `addTask`. Empty or whitespace-only text comes back as the same
 * array, so nothing is saved and `add` returns false. Any other result is
 * kept in memory and passed to `saveTasks`. If that throws, the new list stays
 * on screen, `saveError` is set, and the error is not rethrown.
 */
export function useTasks(): {
  tasks: Task[]
  saveError: string | null
  add: (text: string) => boolean
} {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [saveError, setSaveError] = useState<string | null>(null)

  function add(text: string): boolean {
    const next = addTask(tasks, text)
    if (next === tasks) {
      return false
    }

    setTasks(next)
    try {
      saveTasks(next)
      setSaveError(null)
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE)
    }
    return true
  }

  return { tasks, saveError, add }
}
