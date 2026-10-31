import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../tasks/types.ts'
import { TaskList } from './TaskList.tsx'

const createdAt = '2026-01-01T00:00:00.000Z'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    text: 'Buy milk',
    done: false,
    createdAt,
    ...overrides,
  }
}

function renderList(tasks: Task[]) {
  const onToggle = vi.fn<(id: string) => void>()
  const onDelete = vi.fn<(id: string) => void>()
  render(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} />)
  return { onToggle, onDelete }
}

describe('TaskList', () => {
  it('shows an empty message when there are no tasks', () => {
    renderList([])

    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders tasks in a list, newest last', () => {
    renderList([task(), task({ id: 'task-2', text: 'Walk dog', done: true })])

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').map((box) => box.closest('label')?.textContent)).toEqual([
      'Buy milk',
      'Walk dog',
    ])
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })

  it('labels each checkbox with the task text and strikes through done tasks', () => {
    renderList([task(), task({ id: 'task-2', text: 'Walk dog', done: true })])

    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Walk dog' })).toBeChecked()
    expect(screen.getByText('Buy milk', { selector: 'span' })).not.toHaveStyle({
      textDecoration: 'line-through',
    })
    expect(screen.getByText('Walk dog', { selector: 'span' })).toHaveStyle({
      textDecoration: 'line-through',
    })
  })

  it('calls onToggle and onDelete with the task id', () => {
    const { onToggle, onDelete } = renderList([
      task(),
      task({ id: 'task-2', text: 'Walk dog' }),
    ])

    fireEvent.click(screen.getByRole('checkbox', { name: 'Walk dog' }))
    expect(onToggle).toHaveBeenCalledExactlyOnceWith('task-2')

    const deleteWalk = screen.getByRole('button', { name: 'Delete Walk dog' })
    expect(deleteWalk).toHaveAttribute('aria-label', 'Delete Walk dog')
    fireEvent.click(deleteWalk)
    expect(onDelete).toHaveBeenCalledExactlyOnceWith('task-2')
  })
})
