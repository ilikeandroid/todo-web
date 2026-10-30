import type { Task } from './types.ts'

/** localStorage key for the task list. */
export const TASKS_STORAGE_KEY = 'todo-web.tasks'

/**
 * localStorage key for a raw copy of unreadable task data.
 * Written only when `todo-web.tasks` is not valid JSON or not a JSON array,
 * and only when this key is not already set.
 */
export const TASKS_BACKUP_KEY = 'todo-web.tasks.backup'

/**
 * Reads tasks from localStorage.
 *
 * A valid JSON array returns every well-formed task and skips malformed
 * items, including an empty `id`. That stored array is left unchanged, and
 * no backup is written.
 *
 * A missing key returns `[]` and does not write a backup. When the value is
 * not valid JSON or not an array, the raw string is copied to
 * `todo-web.tasks.backup` if that key is not already set, then `[]` is
 * returned.
 *
 * Does not throw, including when reading storage or writing the backup throws.
 */
export function loadTasks(): Task[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(TASKS_STORAGE_KEY)
  } catch {
    return []
  }

  if (raw === null) {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    backupUnreadable(raw)
    return []
  }

  if (!Array.isArray(parsed)) {
    backupUnreadable(raw)
    return []
  }

  const tasks: Task[] = []
  for (const item of parsed) {
    const task = toTask(item)
    if (!task) {
      continue
    }
    tasks.push(task)
  }
  return tasks
}

/**
 * Replaces the stored task list.
 *
 * Can throw. `localStorage.setItem` raises `QuotaExceededError` when storage
 * is full, and `SecurityError` (or a similar exception) when storage access is
 * denied. Callers should handle that. This function does not catch those errors.
 */
export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

/**
 * Copies unreadable raw storage to the backup key unless that key is already set.
 * Failures while reading or writing the backup are ignored.
 */
function backupUnreadable(raw: string): void {
  try {
    if (localStorage.getItem(TASKS_BACKUP_KEY) !== null) {
      return
    }
    localStorage.setItem(TASKS_BACKUP_KEY, raw)
  } catch {
    // loadTasks must not throw when the backup cannot be read or written.
  }
}

/**
 * Returns a task when all four fields are present with the correct types and
 * `id` is a non-empty string. Returns null for a malformed item so the caller
 * can skip it. Extra fields are dropped.
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
    value.id === '' ||
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
