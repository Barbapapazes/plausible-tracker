import { expect, test } from '@playwright/test'

test.describe('`auto-outbound-tracking`', () => {
  test('should track external link clicks', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      if (route.request().method() !== 'POST')
        throw new Error('Expected a POST request')

      const data = route.request().postData()

      if (!data)
        throw new Error('Expected a POST body')

      const parsedData = JSON.parse(data)

      expect(parsedData.n).toBe('Outbound Link: Click')
      expect(parsedData.u).toBe('http://localhost:5173/auto-outbound-tracking')
      expect(parsedData.d).toBe('localhost')
      expect(parsedData.p).toBe('{"url":"https://example.com"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/auto-outbound-tracking')

    await page.getByRole('link', { name: 'External Link', exact: true }).click()
  })

  test('should not track internal link clicks', async ({ page }) => {
    await page.route('**/api/event', async () => {
      throw new Error('Unexpected outbound link click')
    })

    await page.goto('http://localhost:5173/auto-outbound-tracking')

    await page.getByRole('link', { name: 'Internal Link' }).click()
  })

  test('should respect external link target', async ({ page, context }) => {
    await page.route('**/api/event', async (route) => {
      const data = JSON.parse(route.request().postData()!)
      expect(data.n).toBe('Outbound Link: Click')
      expect(data.u).toBe('http://localhost:5173/auto-outbound-tracking')
      expect(data.d).toBe('localhost')
      expect(data.p).toBe('{"url":"https://example.com"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/auto-outbound-tracking')

    const externalPagePromise = context.waitForEvent('page')

    await page.getByRole('link', { name: 'External Link (_blank)' }).click()

    const externalPage = await externalPagePromise

    expect(externalPage.url()).toBe('https://example.com/')
    expect(page.url()).toBe('http://localhost:5173/auto-outbound-tracking')
  })

  test('should respect rel="noopener noreferrer" attribute', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      const data = JSON.parse(route.request().postData()!)
      expect(data.n).toBe('Outbound Link: Click')
      expect(data.u).toBe('http://localhost:5173/auto-outbound-tracking')
      expect(data.d).toBe('localhost')
      expect(data.p).toBe('{"url":"https://example.com"}')

      await route.fulfill()
    })

    await page.route('https://example.com/', async (route) => {
      const headers = route.request().headers()

      expect(headers.referer).toBe(undefined)

      await route.continue()
    })

    await page.goto('http://localhost:5173/auto-outbound-tracking')

    await page.getByRole('link', { name: 'External Link (noopener noreferrer)' }).click()

    expect(await page.opener()).toBe(null)

    await page.waitForURL('https://example.com/')
  })

  test('should track link after being added to the DOM', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      const data = JSON.parse(route.request().postData()!)
      expect(data.n).toBe('Outbound Link: Click')
      expect(data.u).toBe('http://localhost:5173/auto-outbound-tracking')
      expect(data.d).toBe('localhost')
      expect(data.p).toBe('{"url":"https://example.com"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/auto-outbound-tracking')

    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = 'https://example.com'
      link.textContent = 'External Link (Added to DOM)'

      document.body.appendChild(link)
    })

    await page.getByRole('link', { name: 'External Link (Added to DOM)' }).click()
  })
})
