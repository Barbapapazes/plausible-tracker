import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEventData, isUserSelfExcluded, sendEvent } from '../src/event'
import type { EventPayload } from '../src/types'

describe('`isUserSelfExcluded`', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('should return `true` if the key `plausible_ignore` is set to \'true\'', () => {
    localStorage.setItem('plausible_ignore', 'true')

    expect(isUserSelfExcluded()).toBe(true)
  })

  it('should return `false` if the key `plausible_ignore` is not set', () => {
    localStorage.removeItem('plausible_ignore')

    expect(isUserSelfExcluded()).toBe(false)
  })
})

describe('`createEventData`', () => {
  beforeEach(() => {
    // @ts-expect-error - Mocking the location object
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      href: 'http://example.com',
    })
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('http://referrer.com')
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1920)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should use the href of the current location as the default URL', () => {
    const data = createEventData({
      referrer: 'http://referrer.com',
      deviceWidth: 1920,
    })

    expect(data).toEqual({
      url: 'http://example.com',
      referrer: 'http://referrer.com',
      deviceWidth: 1920,
    })
  })

  it('should use the referrer of the document as the default referrer', () => {
    const data = createEventData({
      url: 'http://example.com',
      deviceWidth: 1920,
    })

    expect(data).toEqual({
      url: 'http://example.com',
      referrer: 'http://referrer.com',
      deviceWidth: 1920,
    })
  })

  it('should use the inner width of the window as the default device width', () => {
    const data = createEventData({
      url: 'http://example.com',
      referrer: 'http://referrer.com',
    })

    expect(data).toEqual({
      url: 'http://example.com',
      referrer: 'http://referrer.com',
      deviceWidth: 1920,
    })
  })
})

describe('`sendEvent`', () => {
  const eventPayload: EventPayload = {
    n: 'test',
    u: 'http://example.com',
    d: 'example.com',
    r: 'http://referrer.com',
    w: 1920,
    h: 0,
  }

  beforeEach(() => {
    vi.spyOn(window, 'fetch').mockResolvedValue({} as Response)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should send an event with the payload to the API `/api/event`', () => {
    sendEvent('https://example.com', eventPayload)

    expect(window.fetch).toHaveBeenCalledWith('https://example.com/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(eventPayload),
    })
  })

  it('should call the callback', async () => {
    const callback = vi.fn()

    await sendEvent('https://example.com', eventPayload, callback)

    expect(callback).toHaveBeenCalled()
  })

  // waiting for https://github.com/vitest-dev/vitest/pull/6056
  // it('should call the callback after the request is complete', async () => {
  //   const callback = vi.fn()

  //   await sendEvent('https://example.com', eventPayload, callback)

  //   expect(callback).toHaveBeenCalledAfter(window.fetch)
  // })

  it('should not call the callback if the request fails', async () => {
    const callback = vi.fn()
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('Failed to fetch'))

    await sendEvent('https://example.com', eventPayload, callback).catch(() => {})

    expect(callback).not.toHaveBeenCalled()
  })
})
