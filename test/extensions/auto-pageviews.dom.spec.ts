import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPlausibleTracker } from '../../src/plausible'
import { useAutoPageviews } from '../../src/extensions'

describe('`auto-pageviews extensions`', () => {
  const plausibleOptions = {
    ignoredHostnames: [], // Ignore no hostnames to avoid ignoring localhost
  }
  const plausible = createPlausibleTracker(plausibleOptions)
  const pageviews = useAutoPageviews(plausible)

  beforeEach(() => {
    vi.spyOn(window, 'fetch').mockResolvedValue({} as Response)
  })

  afterEach(() => {
    pageviews.cleanup()
    vi.restoreAllMocks()

    history.replaceState({}, '', '/')
  })

  it('should send `pageview` events on install', () => {
    pageviews.install()

    expect(window.fetch).toHaveBeenCalledTimes(1)
    expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        n: 'pageview',
        u: 'http://localhost:3000/',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      }),
    })
  })

  it('should send event on new `popstate` event', () => {
    pageviews.install()

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(window.fetch).toHaveBeenCalledTimes(2)
    expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        n: 'pageview',
        u: 'http://localhost:3000/',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      }),
    })
  })

  it('should send event on new `hashchange` event', () => {
    const pageviews = useAutoPageviews(createPlausibleTracker({
      ...plausibleOptions,
      hashMode: true,
    }))

    pageviews.install()

    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(window.fetch).toHaveBeenCalledTimes(2)
    expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        n: 'pageview',
        u: 'http://localhost:3000/',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 1,
        p: undefined,
      }),
    })

    pageviews.cleanup()
  })

  it('should send event when `history.pushState` is called', () => {
    pageviews.install()

    history.pushState({}, '', '/new')

    expect(window.fetch).toHaveBeenCalledTimes(2)
    expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        n: 'pageview',
        u: 'http://localhost:3000/new',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      }),
    })
  })

  it('should remove event listeners on cleanup', () => {
    pageviews.install()
    pageviews.cleanup()

    window.dispatchEvent(new PopStateEvent('popstate'))
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    history.pushState({}, '', '/new')

    expect(window.fetch).toHaveBeenCalledTimes(1)
  })

  it('should be able to modify options at any time', () => {
    pageviews.install()

    pageviews.setEventOptions({ props: { key: 'value' } })

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(window.fetch).toHaveBeenCalledTimes(2)
    expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        n: 'pageview',
        u: 'http://localhost:3000/',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 0,
        p: '{"key":"value"}',
      }),
    })
  })
})
