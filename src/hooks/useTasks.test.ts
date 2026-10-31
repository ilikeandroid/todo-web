import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addTask } from '../tasks/tasks.ts'
import { TASKS_STORAGE_KEY, loadTasks, saveTasks } from '../tasks/storage.ts'
import * as storage from '../tasks/storage.ts'
import { useTasks } from './useTasks.ts'

const createdAt = new Date('2026-01-01T00:00:00.000Z')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useTasks', () => {
  it('loads tasks from storage on start', () => {
    const stored = addTask([], 'Buy milk', { id: 'task-1', now: createdAt })
    saveTasks(stored)

    const { result } = renderHook(() => useTasks())

    expect(result.current.tasks).toEqual(stored)
    expect(result.current.saveError).toBeNull()
  })

  it('appends a task with addTask and saves it', () => {
    const { result } = renderHook(() => useTasks())

    let added = false
    act(() => {
      added = result.current.add('  Buy milk  ')
    })

    expect(added).toBe(true)
    expect(result.current.tasks.map((task) => task.text)).toEqual(['Buy milk'])
    expect(result.current.tasks[0]?.done).toBe(false)
    expect(result.current.saveError).toBeNull()
    expect(loadTasks()).toEqual(result.current.tasks)
  })

  it('rejects empty or whitespace-only text and does not save', () => {
    const { result } = renderHook(() => useTasks())
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    let added = true
    act(() => {
      added = result.current.add('   ')
    })

    expect(added).toBe(false)
    expect(result.current.tasks).toEqual([])
    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull()
  })

  it('keeps the new task and sets saveError when saveTasks throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useTasks())

    let added = false
    act(() => {
      added = result.current.add('Buy milk')
    })

    expect(added).toBe(true)
    expect(result.current.tasks.map((task) => task.text)).toEqual(['Buy milk'])
    expect(result.current.saveError).toBe("Couldn't save, changes may be lost")
    expect(loadTasks()).toEqual([])
  })

  it('clears saveError after a later save succeeds', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    setItem.mockImplementationOnce(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.add('Buy milk')
    })
    expect(result.current.saveError).toBe("Couldn't save, changes may be lost")

    setItem.mockRestore()
    act(() => {
      result.current.add('Walk dog')
    })

    expect(result.current.saveError).toBeNull()
    expect(result.current.tasks.map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
  })

  it('keeps both tasks when add runs twice before re-render', () => {
    const { result } = renderHook(() => useTasks())
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    act(() => {
      expect(result.current.add('Buy milk')).toBe(true)
      expect(result.current.add('Walk dog')).toBe(true)
    })

    expect(result.current.tasks.map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
    expect(saveTasksSpy).toHaveBeenCalledTimes(2)
    expect(saveTasksSpy.mock.calls[0]?.[0]).toEqual([result.current.tasks[0]])
    expect(saveTasksSpy.mock.calls[1]?.[0]).toEqual(result.current.tasks)

    const saved = setItem.mock.calls
      .filter((call) => call[0] === TASKS_STORAGE_KEY)
      .map((call) => JSON.parse(String(call[1])).map((task: { text: string }) => task.text))
    expect(saved).toEqual([['Buy milk'], ['Buy milk', 'Walk dog']])
  })

  it('toggles and removes from the latest list inside one act', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.add('Buy milk')
      result.current.add('Walk dog')
    })

    const milkId = result.current.tasks[0]?.id ?? ''
    const dogId = result.current.tasks[1]?.id ?? ''

    act(() => {
      result.current.toggle(milkId)
      result.current.remove(dogId)
      result.current.add('Write tests')
    })

    expect(result.current.tasks.map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy milk', done: true },
      { text: 'Write tests', done: false },
    ])
    expect(loadTasks().map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy milk', done: true },
      { text: 'Write tests', done: false },
    ])
    expect(result.current.saveError).toBeNull()
  })

  it('saves toggle on and off through saveTasks', () => {
    const { result } = renderHook(() => useTasks())
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    act(() => {
      result.current.add('Buy milk')
    })
    const id = result.current.tasks[0]?.id ?? ''
    saveTasksSpy.mockClear()

    act(() => {
      result.current.toggle(id)
    })

    expect(result.current.tasks[0]?.done).toBe(true)
    expect(saveTasksSpy).toHaveBeenCalledTimes(1)
    expect(saveTasksSpy.mock.calls[0]?.[0]).toEqual(result.current.tasks)
    expect(loadTasks()).toEqual(result.current.tasks)

    act(() => {
      result.current.toggle(id)
    })

    expect(result.current.tasks[0]?.done).toBe(false)
    expect(saveTasksSpy).toHaveBeenCalledTimes(2)
    expect(loadTasks()[0]?.done).toBe(false)
    expect(result.current.saveError).toBeNull()
  })

  it('saves a removed task through saveTasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.add('Buy milk')
      result.current.add('Walk dog')
    })
    const milkId = result.current.tasks[0]?.id ?? ''
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    act(() => {
      result.current.remove(milkId)
    })

    expect(result.current.tasks.map((task) => task.text)).toEqual(['Walk dog'])
    expect(saveTasksSpy).toHaveBeenCalledTimes(1)
    expect(saveTasksSpy.mock.calls[0]?.[0]).toEqual(result.current.tasks)
    expect(loadTasks().map((task) => task.text)).toEqual(['Walk dog'])
    expect(result.current.saveError).toBeNull()
  })

  it('keeps a toggled task and sets saveError when saveTasks throws', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.add('Buy milk')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })

    act(() => {
      result.current.toggle(result.current.tasks[0]?.id ?? '')
    })

    expect(result.current.tasks[0]?.done).toBe(true)
    expect(result.current.saveError).toBe("Couldn't save, changes may be lost")
    expect(loadTasks()[0]?.done).toBe(false)
  })

  it('keeps a removed task off screen and sets saveError when saveTasks throws', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.add('Buy milk')
      result.current.add('Walk dog')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })

    act(() => {
      result.current.remove(result.current.tasks[0]?.id ?? '')
    })

    expect(result.current.tasks.map((task) => task.text)).toEqual(['Walk dog'])
    expect(result.current.saveError).toBe("Couldn't save, changes may be lost")
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk', 'Walk dog'])
  })

  it('saves a trimmed edit and keeps done state and order', () => {
    const { result } = renderHook(() => useTasks())
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    act(() => {
      result.current.add('Buy milk')
      result.current.add('Walk dog')
    })
    const milkId = result.current.tasks[0]?.id ?? ''
    act(() => {
      result.current.toggle(milkId)
    })
    saveTasksSpy.mockClear()

    let saved = false
    act(() => {
      saved = result.current.edit(milkId, '  Buy oat milk  ')
    })

    expect(saved).toBe(true)
    expect(result.current.tasks.map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy oat milk', done: true },
      { text: 'Walk dog', done: false },
    ])
    expect(result.current.tasks[0]?.id).toBe(milkId)
    expect(saveTasksSpy).toHaveBeenCalledTimes(1)
    expect(saveTasksSpy.mock.calls[0]?.[0]).toEqual(result.current.tasks)
    expect(loadTasks()).toEqual(result.current.tasks)
    expect(result.current.saveError).toBeNull()
  })

  it('does not save when the trimmed edit is unchanged or empty', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.add('Buy milk')
    })
    const id = result.current.tasks[0]?.id ?? ''
    const saveTasksSpy = vi.spyOn(storage, 'saveTasks')

    let unchanged = true
    let empty = true
    act(() => {
      unchanged = result.current.edit(id, '  Buy milk  ')
      empty = result.current.edit(id, '   ')
    })

    expect(unchanged).toBe(false)
    expect(empty).toBe(false)
    expect(result.current.tasks.map((task) => task.text)).toEqual(['Buy milk'])
    expect(saveTasksSpy).not.toHaveBeenCalled()
    expect(loadTasks().map((task) => task.text)).toEqual(['Buy milk'])
    expect(result.current.saveError).toBeNull()
  })

  it('keeps an edited task and sets saveError when saveTasks throws', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.add('Buy milk')
    })
    const id = result.current.tasks[0]?.id ?? ''
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })

    let saved = false
    act(() => {
      saved = result.current.edit(id, 'Buy oat milk')
    })

    expect(saved).toBe(true)
    expect(result.current.tasks[0]?.text).toBe('Buy oat milk')
    expect(result.current.saveError).toBe("Couldn't save, changes may be lost")
    expect(loadTasks()[0]?.text).toBe('Buy milk')
  })

  it('edits the latest list when another change happened in the same turn', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.add('Buy milk')
      result.current.add('Walk dog')
    })
    const milkId = result.current.tasks[0]?.id ?? ''

    act(() => {
      result.current.toggle(milkId)
      expect(result.current.edit(milkId, 'Buy oat milk')).toBe(true)
    })

    expect(result.current.tasks.map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy oat milk', done: true },
      { text: 'Walk dog', done: false },
    ])
    expect(loadTasks().map((task) => ({ text: task.text, done: task.done }))).toEqual([
      { text: 'Buy oat milk', done: true },
      { text: 'Walk dog', done: false },
    ])
  })
})
