import { expect, test } from '@playwright/test'
import { plausibleEventRequest, plausibleEventURL } from './utils'

test.describe('`auto-outbound-tracking`', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auto-outbound-tracking')
  })

  test('should track external link clicks', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    await page.getByRole('link', { name: 'External Link', exact: true }).click()

    expect((await requestPromise).postData()).toBe('{"n":"Outbound Link: Click","u":"http://localhost:5173/auto-outbound-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"https://example.com\\"}"}')
  })

  test('should not track internal link clicks', async ({ page }) => {
    await page.route(plausibleEventURL, async () => {
      throw new Error('Unexpected outbound link click')
    })

    await page.getByRole('link', { name: 'Internal Link' }).click()
  })

  test('should respect external link target', async ({ page, context }) => {
    const requestPromise = plausibleEventRequest(page)
    const externalPagePromise = context.waitForEvent('page')

    await page.getByRole('link', { name: 'External Link (_blank)' }).click()

    expect((await requestPromise).postData()).toBe('{"n":"Outbound Link: Click","u":"http://localhost:5173/auto-outbound-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"https://example.com\\"}"}')

    expect((await externalPagePromise).url()).toBe('https://example.com/')
    expect(page.url()).toBe('http://localhost:5173/auto-outbound-tracking')
  })

  test('should respect rel="noopener noreferrer" attribute', async ({ page }) => {
    await page.getByRole('link', { name: 'External Link (noopener noreferrer)' }).click()

    await page.waitForURL('https://example.com/')

    const opener = await page.evaluate(() => window.opener)
    expect(opener).toBe(null)

    const referrer = await page.evaluate(() => document.referrer)
    expect(referrer).toBe('')
  })

  test('should track links after being added to the DOM', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = 'https://example.com'
      link.textContent = 'External Link (Added to DOM)'

      document.body.appendChild(link)
    })

    await page.getByRole('link', { name: 'External Link (Added to DOM)' }).click()

    expect((await requestPromise).postData()).toBe('{"n":"Outbound Link: Click","u":"http://localhost:5173/auto-outbound-tracking","d":"localhost","r":"","w":1280,"h":0,"p":"{\\"url\\":\\"https://example.com\\"}"}')
  })

  test('should stop tracking once extension is cleaned up', async ({ page }) => {
    await page.route(plausibleEventURL, async () => {
      throw new Error('Unexpected outbound link click')
    })

    await page.getByRole('button', { name: 'Cleanup' }).click()
    await page.getByRole('link', { name: 'External Link', exact: true }).click()
  })
})
