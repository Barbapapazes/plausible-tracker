import type { Page } from '@playwright/test'

export const plausibleEventURL = 'https://plausible.io/api/event'

export function plausibleEventRequest(page: Page) {
  return page.waitForRequest((request) => {
    return request.url() === plausibleEventURL && request.method() === 'POST'
  })
}
