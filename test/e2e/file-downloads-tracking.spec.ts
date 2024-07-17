import { expect, test } from '@playwright/test'

test.describe('`file-downloads-tracking`', () => {
  test('should track file downloads', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      if (route.request().method() !== 'POST')
        throw new Error('Expected a POST request')

      const data = route.request().postData()

      if (!data)
        throw new Error('Expected a POST body')

      const parsedData = JSON.parse(data)

      expect(parsedData.n).toBe('File Download')
      expect(parsedData.u).toBe('http://localhost:5173/file-downloads-tracking')
      expect(parsedData.d).toBe('localhost')
      expect(parsedData.p).toBe('{"url":"/file.svg"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.getByRole('link', { name: 'Download SVG', exact: true }).click()
  })

  test('should works without the download attribute', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      if (route.request().method() !== 'POST')
        throw new Error('Expected a POST request')

      const data = route.request().postData()

      if (!data)
        throw new Error('Expected a POST body')

      const parsedData = JSON.parse(data)

      expect(parsedData.n).toBe('File Download')
      expect(parsedData.u).toBe('http://localhost:5173/file-downloads-tracking')
      expect(parsedData.d).toBe('localhost')
      expect(parsedData.p).toBe('{"url":"/file.svg"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.getByRole('link', { name: 'Download SVG without download attribute', exact: true }).click()
  })

  test('should track file opened in a new tab', async ({ page, context }) => {
    await page.route('**/api/event', async (route) => {
      if (route.request().method() !== 'POST')
        throw new Error('Expected a POST request')

      const data = route.request().postData()

      if (!data)
        throw new Error('Expected a POST body')

      const parsedData = JSON.parse(data)

      expect(parsedData.n).toBe('File Download')
      expect(parsedData.u).toBe('http://localhost:5173/file-downloads-tracking')
      expect(parsedData.d).toBe('localhost')
      expect(parsedData.p).toBe('{"url":"/file.svg"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    const externalPagePromise = context.waitForEvent('page')

    await page.getByRole('link', { name: 'Download SVG targeting blank', exact: true }).click()

    const externalPage = await externalPagePromise
    expect(externalPage.url()).toBe('http://localhost:5173/file.svg')
  })

  test('should track file with full URL', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      if (route.request().method() !== 'POST')
        throw new Error('Expected a POST request')

      const data = route.request().postData()

      if (!data)
        throw new Error('Expected a POST body')

      const parsedData = JSON.parse(data)

      expect(parsedData.n).toBe('File Download')
      expect(parsedData.u).toBe('http://localhost:5173/file-downloads-tracking')
      expect(parsedData.d).toBe('localhost')
      expect(parsedData.p).toBe('{"url":"/file.svg"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.getByRole('link', { name: 'Download SVG with full URL', exact: true }).click()
  })

  test('should not track non specified file type', async ({ page }) => {
    await page.route('**/api/event', async () => {
      throw new Error('Unexpected file download')
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.getByRole('link', { name: 'Download PDF', exact: true }).click()
  })

  test('should not track simple links', async ({ page }) => {
    await page.route('**/api/event', async () => {
      throw new Error('Unexpected file download')
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.getByRole('link', { name: 'Simple Link' }).click()
  })

  test('should track file links after being added to the DOM', async ({ page }) => {
    await page.route('**/api/event', async (route) => {
      if (route.request().method() !== 'POST')
        throw new Error('Expected a POST request')

      const data = route.request().postData()

      if (!data)
        throw new Error('Expected a POST body')

      const parsedData = JSON.parse(data)

      expect(parsedData.n).toBe('File Download')
      expect(parsedData.u).toBe('http://localhost:5173/file-downloads-tracking')
      expect(parsedData.d).toBe('localhost')
      expect(parsedData.p).toBe('{"url":"/file.svg"}')

      await route.fulfill()
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = '/file.svg'
      link.download = 'file.svg'
      link.textContent = 'Download SVG after being added to the DOM'
      document.body.appendChild(link)
    })

    await page.getByRole('link', { name: 'Download SVG after being added to the DOM' }).click()
  })

  test('should stop tracking once extension is cleaned up', async ({ page }) => {
    await page.route('**/api/event', async () => {
      throw new Error('Unexpected file download')
    })

    await page.goto('http://localhost:5173/file-downloads-tracking')

    await page.getByRole('button', { name: 'Cleanup' }).click()

    await page.getByRole('link', { name: 'Download SVG', exact: true }).click()
  })
})
