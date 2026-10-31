import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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

describe('TaskList', () => {
  it('shows an empty message when there are no tasks', () => {
    render(<TaskList tasks={[]} />)

    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders tasks in a list, newest last', () => {
    render(
      <TaskList
        tasks={[
          task(),
          task({ id: 'task-2', text: 'Walk dog', done: true }),
        ]}
      />,
    )

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Buy milk',
      'Walk dog',
    ])
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument()
  })
})
