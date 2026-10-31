import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addTask } from '../tasks/tasks.ts'
import { TASKS_STORAGE_KEY, loadTasks, saveTasks } from '../tasks/storage.ts'
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
})
