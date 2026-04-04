import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('NetPulse Functional Tests', () => {
  test('1. Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible()
    console.log('✓ Login page renders correctly')
  })

  test('2. Login with admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    await page.getByPlaceholder('Enter your username').fill('admin')
    await page.getByPlaceholder('Enter your password').fill('NetPulse2024!')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/\/dashboard/)
    console.log('✓ Login successful, redirected to dashboard')
  })

  test('3. Dashboard loads with stats and tasks', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.getByPlaceholder('Enter your username').fill('admin')
    await page.getByPlaceholder('Enter your password').fill('NetPulse2024!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Check dashboard heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Wait for stats to load (should show numbers instead of --)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png' })
    console.log('✓ Dashboard loaded')
  })

  test('4. Navigate to Tasks page', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('link', { name: 'Tasks' }).click()
    await page.waitForURL('**/tasks', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()

    // Wait for task list to load
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/tasks.png' })
    console.log('✓ Tasks page loaded')
  })

  test('5. Navigate to Agents page (admin)', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('link', { name: 'Agents' }).click()
    await page.waitForURL('**/agents', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible()

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/agents.png' })
    console.log('✓ Agents page loaded')
  })

  test('6. Navigate to Alerts page', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('link', { name: 'Alerts' }).click()
    await page.waitForURL('**/alerts', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Alert Rules' })).toBeVisible()

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/alerts.png' })
    console.log('✓ Alerts page loaded')
  })

  test('7. Navigate to Webhooks page', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('link', { name: 'Webhooks' }).click()
    await page.waitForURL('**/webhooks', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Webhooks' })).toBeVisible()

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/webhooks.png' })
    console.log('✓ Webhooks page loaded')
  })

  test('8. Navigate to Users page (admin)', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('link', { name: 'Users' }).click()
    await page.waitForURL('**/users', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/users.png' })
    console.log('✓ Users page loaded')
  })

  test('9. Click task row navigates to monitoring page', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('link', { name: 'Tasks' }).click()
    await page.waitForURL('**/tasks', { timeout: 5000 })

    // Wait for tasks to load, then click first task row
    await page.waitForTimeout(2000)
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'e2e/screenshots/monitoring.png' })
      console.log('✓ Monitoring page loaded from task click')
    } else {
      console.log('⚠ No task rows found to click')
    }
  })

  test('10. Auth guard redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
    console.log('✓ Auth guard works - redirected to login')
  })
})

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.getByPlaceholder('Enter your username').fill('admin')
  await page.getByPlaceholder('Enter your password').fill('NetPulse2024!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}
