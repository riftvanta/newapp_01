import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E Tests', () => {
  // Helper function to login
  async function loginAsAdmin(page: any) {
    await page.goto('/login')
    await page.fill('input[placeholder="أدخل اسم المستخدم"]', 'admin')
    await page.fill('input[placeholder="أدخل كلمة المرور"]', 'admin123')
    await page.click('button:has-text("دخول")')
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
  }

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display dashboard content in Arabic', async ({ page }) => {
    // Check header
    await expect(page.locator('h1:has-text("لوحة التحكم")')).toBeVisible()

    // Check welcome message
    await expect(page.locator('text=مرحباً بك في لوحة التحكم')).toBeVisible()
    await expect(page.locator('text=أهلاً وسهلاً')).toBeVisible()

    // Check description
    await expect(page.locator('text=هذه لوحة التحكم الخاصة بك')).toBeVisible()

    // Check logout button
    await expect(page.locator('button:has-text("خروج")')).toBeVisible()
  })

  test('should display statistics cards', async ({ page }) => {
    // Check users card
    await expect(page.locator('text=المستخدمون')).toBeVisible()
    await expect(page.locator('text=مشرف واحد نشط')).toBeVisible()

    // Check status card
    await expect(page.locator('text=الحالة')).toBeVisible()
    await expect(page.locator('text=نشط')).toBeVisible()
    await expect(page.locator('text=النظام يعمل بشكل جيد')).toBeVisible()

    // Check last login card
    await expect(page.locator('text=آخر تسجيل دخول')).toBeVisible()
    await expect(page.locator('text=الآن')).toBeVisible()
    await expect(page.locator('text=جلسة نشطة')).toBeVisible()
  })

  test('should have correct RTL layout on dashboard', async ({ page }) => {
    // Check that the page maintains RTL
    const htmlDir = await page.locator('html').getAttribute('dir')
    expect(htmlDir).toBe('rtl')

    // Check that header is aligned correctly
    const headerElement = page.locator('header').first()
    const headerStyles = await headerElement.evaluate((el) => {
      return window.getComputedStyle(el).direction
    })
    expect(headerStyles).toBe('rtl')
  })

  test('should handle logout from dashboard', async ({ page }) => {
    // Click logout button
    await page.click('button:has-text("خروج")')

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 })

    // Verify cannot access dashboard after logout
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should display responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that content is still visible
    await expect(page.locator('h1:has-text("لوحة التحكم")')).toBeVisible()
    await expect(page.locator('button:has-text("خروج")')).toBeVisible()

    // Check cards stack vertically on mobile
    const cards = page.locator('.grid > div')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should refresh session on page reload', async ({ page }) => {
    // Reload the page
    await page.reload()

    // Should still be on dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('h1:has-text("لوحة التحكم")')).toBeVisible()
  })

  test('should handle browser back button correctly', async ({ page }) => {
    // Go back
    await page.goBack()

    // Should go to login but redirect back to dashboard since we're logged in
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
  })

  test('should use Arabic fonts', async ({ page }) => {
    // Check that Cairo font is applied
    const bodyElement = page.locator('body')
    const fontFamily = await bodyElement.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily
    })

    expect(fontFamily.toLowerCase()).toContain('cairo')
  })
})