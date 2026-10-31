import { expect, test } from '@playwright/test'

test('added tasks are still listed after a reload', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.getByText('No tasks yet')).toBeVisible()

  const task = page.getByRole('textbox', { name: 'Task' })
  await task.fill('Buy milk')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(task).toHaveValue('')
  await expect(task).toBeFocused()

  await task.fill('Walk dog')
  await task.press('Enter')

  const items = page.getByRole('listitem')
  await expect(items).toHaveCount(2)
  await expect(items.nth(0).getByRole('checkbox')).toHaveAccessibleName('Buy milk')
  await expect(items.nth(1).getByRole('checkbox')).toHaveAccessibleName('Walk dog')

  await page.reload()

  await expect(items).toHaveCount(2)
  await expect(items.nth(0).getByRole('checkbox')).toHaveAccessibleName('Buy milk')
  await expect(items.nth(1).getByRole('checkbox')).toHaveAccessibleName('Walk dog')
})
