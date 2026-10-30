import type { Task } from './types.ts'

/** The only localStorage key this module reads or writes. */
export const TASKS_STORAGE_KEY = 'todo-web.tasks'

/**
 * Reads tasks from localStorage.
 *
 * Returns `[]` when the key is missing, the value is invalid JSON, the value
 * is not an array, any item has the wrong shape, or localStorage throws
 * (for example, access denied). Does not throw and does not overwrite storage.
 */
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    if (raw === null) {
      return []
    }
    return parseStoredTasks(raw)
  } catch {
    return []
  }
}

/** Replaces the stored task list. */
export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

function parseStoredTasks(raw: string): Task[] {
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    return []
  }

  const tasks: Task[] = []
  for (const item of parsed) {
    const task = toTask(item)
    if (!task) {
      return []
    }
    tasks.push(task)
  }
  return tasks
}

/**
 * Accepts a value only when all four task fields are present with the correct
 * types. Any invalid item fails the whole list. Extra fields are dropped.
 */
function toTask(value: unknown): Task | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  if (
    !('id' in value) ||
    !('text' in value) ||
    !('done' in value) ||
    !('createdAt' in value)
  ) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.text !== 'string' ||
    typeof value.done !== 'boolean' ||
    typeof value.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    text: value.text,
    done: value.done,
    createdAt: value.createdAt,
  }
}
