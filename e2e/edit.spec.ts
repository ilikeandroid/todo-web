import { expect, test } from '@playwright/test'

test('an edited task is still shown after a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const task = page.getByRole('textbox', { name: 'Task' })
  await task.fill('Buy milk')
  await page.getByRole('button', { name: 'Add' }).click()

  await page.getByRole('button', { name: 'Edit Buy milk' }).click()
  const editor = page.getByRole('textbox', { name: 'Edit Buy milk' })
  await expect(editor).toBeFocused()
  await expect(editor).toHaveValue('Buy milk')
  await editor.fill('Buy oat milk')
  await editor.press('Enter')

  await expect(page.getByRole('checkbox', { name: 'Buy oat milk' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'Buy oat milk' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toHaveCount(0)
})

test('after a delete, focus moves to the next Delete button, then the previous, then the Task field', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const task = page.getByRole('textbox', { name: 'Task' })
  for (const name of ['Buy milk', 'Walk dog', 'Write tests']) {
    await task.fill(name)
    await page.getByRole('button', { name: 'Add' }).click()
  }

  await page.getByRole('button', { name: 'Delete Walk dog' }).click()
  await expect(page.getByRole('button', { name: 'Delete Write tests' })).toBeFocused()
  await expect(page.getByRole('checkbox', { name: 'Walk dog' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Delete Write tests' }).click()
  await expect(page.getByRole('button', { name: 'Delete Buy milk' })).toBeFocused()

  await page.getByRole('button', { name: 'Delete Buy milk' }).click()
  await expect(page.getByRole('textbox', { name: 'Task' })).toBeFocused()
  await expect(page.getByText('No tasks yet')).toBeVisible()
})
