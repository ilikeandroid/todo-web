import { afterEach, describe, expect, it, vi } from 'vitest'
import { TASKS_BACKUP_KEY, TASKS_STORAGE_KEY, loadTasks, saveTasks } from './storage.ts'
import type { Task } from './types.ts'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    text: 'Buy milk',
    done: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('task storage', () => {
  it('uses the todo-web.tasks and todo-web.tasks.backup localStorage keys', () => {
    expect(TASKS_STORAGE_KEY).toBe('todo-web.tasks')
    expect(TASKS_BACKUP_KEY).toBe('todo-web.tasks.backup')
  })

  it('returns [] when the key is missing and does not write a backup', () => {
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull()
    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
  })

  it('round-trips a task list through save and load', () => {
    const tasks = [
      task(),
      task({
        id: 'task-2',
        text: 'Walk dog',
        done: true,
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
    ]

    saveTasks(tasks)

    expect(localStorage.getItem('todo-web.tasks')).toBe(JSON.stringify(tasks))
    expect(loadTasks()).toEqual(tasks)
    expect(Object.keys(localStorage)).toEqual(['todo-web.tasks'])

    saveTasks([])
    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe('[]')
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
  })

  it('accepts an empty text when the other fields have the right types', () => {
    const stored = [task({ text: '' })]
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(stored))

    expect(loadTasks()).toEqual(stored)
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
  })

  it('keeps valid tasks and skips malformed items, including an empty id', () => {
    const kept = task({ id: 'keep', text: 'Keep me' })
    const alsoKept = task({
      id: 'also',
      text: 'Also keep',
      done: true,
      createdAt: '2026-03-01T00:00:00.000Z',
    })
    const raw = JSON.stringify([
      { id: '', text: 'empty id', done: false, createdAt: kept.createdAt },
      kept,
      null,
      { id: 'partial', text: 'missing fields' },
      alsoKept,
      { id: 'bad-done', text: 'nope', done: 'yes', createdAt: kept.createdAt },
    ])
    localStorage.setItem(TASKS_STORAGE_KEY, raw)

    expect(loadTasks()).toEqual([kept, alsoKept])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(raw)
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
  })

  it('returns the four task fields when a stored item has extra properties', () => {
    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify([{ ...task(), extra: true }]),
    )

    expect(loadTasks()).toEqual([task()])
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
  })

  it.each([
    '[null]',
    '[[]]',
    '[{"id":"","text":"a","done":false,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":"a","done":false}]',
    '[{"id":1,"text":"a","done":false,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":1,"done":false,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":"a","done":0,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":"a","done":false,"createdAt":1}]',
  ])(
    'returns [] when every item in a JSON array is malformed and does not write a backup (%j)',
    (raw) => {
      localStorage.setItem(TASKS_STORAGE_KEY, raw)

      expect(loadTasks()).toEqual([])
      expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(raw)
      expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
    },
  )

  it.each(['{', '', 'not-json', '['])(
    'copies non-JSON to todo-web.tasks.backup and returns [] (%j)',
    (raw) => {
      localStorage.setItem(TASKS_STORAGE_KEY, raw)

      expect(() => loadTasks()).not.toThrow()
      expect(loadTasks()).toEqual([])
      expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBe(raw)
      expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(raw)
    },
  )

  it.each([
    ['object', '{"tasks":[]}'],
    ['number', '0'],
    ['null', 'null'],
  ])('copies non-array JSON (%s) to the backup and returns []', (_kind, raw) => {
    localStorage.setItem(TASKS_STORAGE_KEY, raw)

    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBe(raw)
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(raw)
  })

  it('does not overwrite an existing backup', () => {
    localStorage.setItem(TASKS_BACKUP_KEY, 'already-saved')
    localStorage.setItem(TASKS_STORAGE_KEY, '{')

    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBe('already-saved')

    localStorage.setItem(TASKS_STORAGE_KEY, 'null')
    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBe('already-saved')
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe('null')
  })

  it('does not overwrite a backup that is an empty string', () => {
    localStorage.setItem(TASKS_BACKUP_KEY, '')
    localStorage.setItem(TASKS_STORAGE_KEY, '{')

    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBe('')
  })

  it('returns [] and does not throw when writing the backup fails', () => {
    localStorage.setItem(TASKS_STORAGE_KEY, '{')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })

    expect(() => loadTasks()).not.toThrow()
    expect(loadTasks()).toEqual([])

    vi.restoreAllMocks()
    expect(localStorage.getItem(TASKS_BACKUP_KEY)).toBeNull()
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe('{')
  })

  it('returns [] and does not throw when reading the backup key fails', () => {
    localStorage.setItem(TASKS_STORAGE_KEY, '{')
    const originalGetItem = Storage.prototype.getItem
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key === TASKS_BACKUP_KEY) {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      }
      return originalGetItem.call(this, key)
    })

    expect(() => loadTasks()).not.toThrow()
    expect(loadTasks()).toEqual([])
  })

  it('returns [] when reading the task list throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    expect(() => loadTasks()).not.toThrow()
    expect(loadTasks()).toEqual([])
  })
})
