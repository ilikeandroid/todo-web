import { expect, test, type CDPSession, type Page } from '@playwright/test'

async function reset(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

async function dispatchEnter(session: CDPSession, autoRepeat: boolean) {
  // Match Playwright's Chromium keydown: Enter carries text "\r", which is what
  // makes the browser run implicit form submission.
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
    text: '\r',
    unmodifiedText: '\r',
    autoRepeat,
  })
}

async function releaseEnter(session: CDPSession) {
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
  })
}

test('checking and deleting tasks survives a reload', async ({ page }) => {
  await reset(page)

  const task = page.getByRole('textbox', { name: 'Task' })
  await task.fill('Buy milk')
  await page.getByRole('button', { name: 'Add' }).click()
  await task.fill('Walk dog')
  await page.getByRole('button', { name: 'Add' }).click()

  const milk = page.getByRole('checkbox', { name: 'Buy milk' })
  await milk.check()
  await expect(milk).toBeChecked()
  await expect(page.getByText('Buy milk', { exact: true })).toHaveCSS(
    'text-decoration-line',
    'line-through',
  )
  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).not.toBeChecked()

  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked()
  await expect(page.getByText('Buy milk', { exact: true })).toHaveCSS(
    'text-decoration-line',
    'line-through',
  )
  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).not.toBeChecked()

  await page.getByRole('button', { name: 'Delete Buy milk' }).click()
  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).toBeVisible()
  await expect(page.getByText('No tasks yet')).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).toBeVisible()
  await expect(page.getByText('No tasks yet')).toHaveCount(0)
})

test('a repeated Enter on an empty field does not show the hint, and one Enter adds once', async ({
  page,
}) => {
  await reset(page)

  const task = page.getByRole('textbox', { name: 'Task' })
  const session = await page.context().newCDPSession(page)
  await task.focus()
  await dispatchEnter(session, true)
  await releaseEnter(session)

  await expect(page.getByText('Enter a task')).toHaveCount(0)
  await expect(page.getByText('No tasks yet')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)

  await task.fill('Buy milk')
  await task.press('Enter')

  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toHaveCount(1)
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(task).toHaveValue('')
  await expect(task).toBeFocused()
  await expect(page.getByText('Enter a task')).toHaveCount(0)

  await task.fill('Walk dog')
  await task.focus()
  await dispatchEnter(session, false)
  await dispatchEnter(session, true)
  await dispatchEnter(session, true)
  await releaseEnter(session)

  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).toHaveCount(1)
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByText('Enter a task')).toHaveCount(0)
})
