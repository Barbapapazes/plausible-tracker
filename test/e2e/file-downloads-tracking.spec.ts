import { expect, test } from '@playwright/test'
import { plausibleEventRequest, plausibleEventURL } from './utils'

test.describe('`file-downloads-tracking`', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/file-downloads-tracking')
  })

  test('should track file downloads', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    await page.getByRole('link', { name: 'Download SVG', exact: true }).click()

    expect((await requestPromise).postData()).toBe('{"n":"File Download","u":"http://localhost:5173/file-downloads-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"/file.svg\\"}"}')
  })

  test('should works without the download attribute', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    await page.getByRole('link', { name: 'Download SVG without download attribute', exact: true }).click()

    expect((await requestPromise).postData()).toBe('{"n":"File Download","u":"http://localhost:5173/file-downloads-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"/file.svg\\"}"}')
  })

  test('should track file opened in a new tab', async ({ page, context }) => {
    const requestPromise = plausibleEventRequest(page)
    const externalPagePromise = context.waitForEvent('page')

    await page.getByRole('link', { name: 'Download SVG targeting blank', exact: true }).click()

    expect((await requestPromise).postData()).toBe('{"n":"File Download","u":"http://localhost:5173/file-downloads-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"/file.svg\\"}"}')

    expect((await externalPagePromise).url()).toBe('http://localhost:5173/file.svg')
    expect(page.url()).toBe('http://localhost:5173/file-downloads-tracking')
  })

  test('should track file with full URL', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    await page.getByRole('link', { name: 'Download SVG with full URL', exact: true }).click()

    expect((await requestPromise).postData()).toBe('{"n":"File Download","u":"http://localhost:5173/file-downloads-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"/file.svg\\"}"}')
  })

  test('should not track non specified file type', async ({ page }) => {
    await page.route(plausibleEventURL, async () => {
      throw new Error('Unexpected file download')
    })

    await page.getByRole('link', { name: 'Download PDF', exact: true }).click()
  })

  test('should not track simple links', async ({ page }) => {
    await page.route(plausibleEventURL, async () => {
      throw new Error('Unexpected file download')
    })

    await page.getByRole('link', { name: 'Simple Link' }).click()
  })

  test('should track file links after being added to the DOM', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = '/file.svg'
      link.download = 'file.svg'
      link.textContent = 'Download SVG after being added to the DOM'
      document.body.appendChild(link)
    })

    await page.getByRole('link', { name: 'Download SVG after being added to the DOM' }).click()

    expect((await requestPromise).postData()).toBe('{"n":"File Download","u":"http://localhost:5173/file-downloads-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"/file.svg\\"}"}')
  })

  test('should stop tracking once extension is cleaned up', async ({ page }) => {
    await page.route(plausibleEventURL, async () => {
      throw new Error('Unexpected file download')
    })

    await page.getByRole('button', { name: 'Cleanup' }).click()
    await page.getByRole('link', { name: 'Download SVG', exact: true }).click()
  })
})
