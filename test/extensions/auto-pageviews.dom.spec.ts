import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPlausibleTracker } from '../../src/plausible'
import { useAutoPageviews } from '../../src/extensions'

describe('`auto-pageviews extensions`', () => {
  const plausible = createPlausibleTracker({
    ignoredHostnames: [],
  })

  beforeEach(() => {
    vi.spyOn(window, 'fetch')
  })

  afterEach(() => {
    history.replaceState({}, '', '/')
    vi.restoreAllMocks()
  })

  it('should send `pageview` events on install', () => {
    const pageviews = useAutoPageviews(plausible)

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

    pageviews.cleanup()
  })

  it('should send event on new `popstate` event', () => {
    const pageviews = useAutoPageviews(plausible)

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

    pageviews.cleanup()
  })

  it('should send event on new `hashchange` event', () => {
    const pageviews = useAutoPageviews(createPlausibleTracker({
      ignoredHostnames: [],
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
    const pageviews = useAutoPageviews(plausible)

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

    pageviews.cleanup()
  })

  it('should remove event listeners on cleanup', () => {
    const pageviews = useAutoPageviews(plausible)

    pageviews.install()
    pageviews.cleanup()

    window.dispatchEvent(new PopStateEvent('popstate'))
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    history.pushState({}, '', '/new')

    expect(window.fetch).toHaveBeenCalledTimes(1)
  })

  it('should be able to modify options at any time', () => {
    const pageviews = useAutoPageviews(plausible)

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

    pageviews.cleanup()
  })
})
