import { describe, expect, it } from 'vitest'
import { addTask, deleteTask, editTask, toggleTask } from './tasks.ts'
import type { Task } from './types.ts'

const createdAt = '2026-01-01T00:00:00.000Z'
const later = new Date('2026-02-01T00:00:00.000Z')

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    text: 'Buy milk',
    done: false,
    createdAt,
    ...overrides,
  }
}

/** Frozen list so a mutation throws instead of silently changing the input. */
function list(...items: Task[]): Task[] {
  const tasks = items.map((item) => Object.freeze({ ...item }))
  Object.freeze(tasks)
  return tasks
}

describe('addTask', () => {
  it('trims text and appends a not-done task without mutating the input', () => {
    const tasks = list(task())
    const result = addTask(tasks, '  Walk dog  ', { id: 'task-2', now: later })

    expect(result).toEqual([
      task(),
      {
        id: 'task-2',
        text: 'Walk dog',
        done: false,
        createdAt: later.toISOString(),
      },
    ])
    expect(result).not.toBe(tasks)
    expect(result[0]).toBe(tasks[0])
    expect(tasks).toEqual([task()])
  })

  it('keeps internal whitespace while trimming the ends', () => {
    const tasks = list()
    const result = addTask(tasks, '  buy   milk  ', { id: 'task-2', now: later })

    expect(result).toEqual([
      {
        id: 'task-2',
        text: 'buy   milk',
        done: false,
        createdAt: later.toISOString(),
      },
    ])
  })

  it('uses crypto.randomUUID and an ISO timestamp when id and clock are omitted', () => {
    const before = Date.now()
    const result = addTask([], 'Buy milk')
    const after = Date.now()
    const created = result[0]

    expect(result).toHaveLength(1)
    expect(created?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(created?.text).toBe('Buy milk')
    expect(created?.done).toBe(false)
    const createdTime = Date.parse(created?.createdAt ?? '')
    expect(createdTime).toBeGreaterThanOrEqual(before)
    expect(createdTime).toBeLessThanOrEqual(after)

    const second = addTask([], 'Other')
    expect(second[0]?.id).not.toBe(created?.id)
  })

  it.each(['', ' ', '  ', '\n', '\t', ' \n\t '])(
    'returns the same array when text is empty or whitespace (%j)',
    (text) => {
      const tasks = list(task())
      expect(addTask(tasks, text)).toBe(tasks)
      expect(tasks).toEqual([task()])
    },
  )
})

describe('toggleTask', () => {
  it('flips done and leaves the other fields and the input unchanged', () => {
    const tasks = list(task(), task({ id: 'task-2', text: 'Walk dog', done: true }))
    const result = toggleTask(tasks, 'task-1')

    expect(result).toEqual([
      task({ done: true }),
      task({ id: 'task-2', text: 'Walk dog', done: true }),
    ])
    expect(result).not.toBe(tasks)
    expect(result[0]).not.toBe(tasks[0])
    expect(result[1]).toBe(tasks[1])
    expect(tasks[0]?.done).toBe(false)

    const flippedBack = toggleTask(result, 'task-1')
    expect(flippedBack[0]?.done).toBe(false)
  })

  it('returns the same array when the id is unknown', () => {
    const tasks = list(task())
    const empty = list()
    expect(toggleTask(tasks, 'missing')).toBe(tasks)
    expect(toggleTask(empty, 'missing')).toBe(empty)
  })
})

describe('deleteTask', () => {
  it('removes the matching task and keeps the others in order', () => {
    const tasks = list(
      task({ id: 'task-1' }),
      task({ id: 'task-2', text: 'Walk dog' }),
      task({ id: 'task-3', text: 'Write tests' }),
    )
    const result = deleteTask(tasks, 'task-2')

    expect(result.map((item) => item.id)).toEqual(['task-1', 'task-3'])
    expect(result[0]).toBe(tasks[0])
    expect(result[1]).toBe(tasks[2])
    expect(result).not.toBe(tasks)
    expect(tasks).toHaveLength(3)
  })

  it('returns the same array when the id is unknown', () => {
    const tasks = list(task())
    const empty = list()
    expect(deleteTask(tasks, 'missing')).toBe(tasks)
    expect(deleteTask(empty, 'missing')).toBe(empty)
  })
})

describe('editTask', () => {
  it('trims text and updates only the matching task', () => {
    const tasks = list(task(), task({ id: 'task-2', text: 'Walk dog' }))
    const result = editTask(tasks, 'task-1', '  Buy oat milk  ')

    expect(result).toEqual([
      task({ text: 'Buy oat milk' }),
      task({ id: 'task-2', text: 'Walk dog' }),
    ])
    expect(result).not.toBe(tasks)
    expect(result[0]).not.toBe(tasks[0])
    expect(result[0]?.id).toBe('task-1')
    expect(result[0]?.done).toBe(false)
    expect(result[0]?.createdAt).toBe(createdAt)
    expect(result[1]).toBe(tasks[1])
    expect(tasks[0]?.text).toBe('Buy milk')
  })

  it.each(['', ' ', '\t', '\n', ' \n\t '])(
    'returns the same array when the new text is empty or whitespace (%j)',
    (text) => {
      const tasks = list(task())
      expect(editTask(tasks, 'task-1', text)).toBe(tasks)
      expect(tasks[0]?.text).toBe('Buy milk')
    },
  )

  it('returns the same array when the id is unknown', () => {
    const tasks = list(task())
    expect(editTask(tasks, 'missing', 'Updated')).toBe(tasks)
    expect(editTask(tasks, 'missing', '   ')).toBe(tasks)
  })

  it('returns the same array when the trimmed text is unchanged', () => {
    const tasks = list(task(), task({ id: 'task-2', text: 'Walk dog', done: true }))

    expect(editTask(tasks, 'task-1', 'Buy milk')).toBe(tasks)
    expect(editTask(tasks, 'task-1', '  Buy milk  ')).toBe(tasks)
    expect(editTask(tasks, 'task-2', 'Walk dog')).toBe(tasks)
    expect(tasks).toEqual([task(), task({ id: 'task-2', text: 'Walk dog', done: true })])
  })
})
