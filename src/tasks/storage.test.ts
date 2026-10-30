import { afterEach, describe, expect, it, vi } from 'vitest'
import { TASKS_STORAGE_KEY, loadTasks, saveTasks } from './storage.ts'
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
  it('uses the todo-web.tasks localStorage key', () => {
    expect(TASKS_STORAGE_KEY).toBe('todo-web.tasks')
  })

  it('returns [] when the key is missing and does not create it', () => {
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull()
    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull()
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
  })

  it('accepts an empty text when the other fields have the right types', () => {
    const stored = [task({ text: '' })]
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(stored))

    expect(loadTasks()).toEqual(stored)
  })

  it('returns [] when any stored item has an empty id and leaves the value in place', () => {
    const raw = JSON.stringify([task(), task({ id: '', text: 'Orphan' })])
    localStorage.setItem(TASKS_STORAGE_KEY, raw)

    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(raw)
  })

  it('returns the four task fields when a stored item has extra properties', () => {
    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify([{ ...task(), extra: true }]),
    )

    expect(loadTasks()).toEqual([task()])
  })

  it.each([
    '{',
    '',
    'null',
    '0',
    '"tasks"',
    '{}',
    '[null]',
    '[[]]',
    '[{"id":"1","text":"a","done":false}]',
    '[{"id":1,"text":"a","done":false,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":1,"done":false,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":"a","done":0,"createdAt":"2026-01-01T00:00:00.000Z"}]',
    '[{"id":"1","text":"a","done":false,"createdAt":1}]',
    '[{"id":"1","text":"a","done":false,"createdAt":"2026-01-01T00:00:00.000Z"},{"id":"2"}]',
  ])('returns [] and leaves corrupt data in place (%j)', (raw) => {
    localStorage.setItem(TASKS_STORAGE_KEY, raw)

    expect(() => loadTasks()).not.toThrow()
    expect(loadTasks()).toEqual([])
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(raw)
  })

  it('returns [] when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    expect(loadTasks()).toEqual([])
  })
})
