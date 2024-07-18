import { expect, test } from '@playwright/test'
import { plausibleEventRequest } from './utils'

test.describe('Site verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/site-verification')
  })

  test('should be able to verify the site', async ({ page }) => {
    const requestPromise = plausibleEventRequest(page)

    const status = await page.evaluate(async () => {
      let status: number | undefined
      // @ts-expect-error - Plausible is available in the browser
      await window.plausible('site-verification', { callback: (args) => {
        status = args.status
      } })

      return status
    })

    await requestPromise

    expect(status).toBe(202)
  })
})
