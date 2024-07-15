import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Plausible } from '../../src'
import { createPlausibleTracker } from '../../src'
import { useAutoOutboundTracking } from '../../src/extensions'

describe('`auto-pageviews extensions`', () => {
  const plausible: Plausible = {
    trackEvent: vi.fn(),
    trackPageview: vi.fn(),
    options: {
      apiHost: 'https://example.com',
      domain: 'localhost',
      enabled: true,
      hashMode: false,
      ignoredHostnames: [],
      ignoreSubDomains: false,
      logIgnored: false,
    },
  }

  beforeEach(() => {
    vi.stubGlobal('open', vi.fn())
    // @ts-expect-error Should be void
    vi.spyOn(window, 'location', 'set').mockReturnValue(vi.fn())
    vi.spyOn(window, 'fetch').mockResolvedValue(new Response())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should send \'Outbound Link: Click\' event when external link is clicked', () => {
    const outboundTracking = useAutoOutboundTracking(plausible)

    const link = document.createElement('a')
    link.href = 'http://example.com'
    document.body.appendChild(link)

    outboundTracking.install()

    link.click()

    expect(plausible.trackEvent).toMatchInlineSnapshot(`
      [MockFunction spy] {
        "calls": [
          [
            "Outbound Link: Click",
            {
              "callback": [Function],
              "props": {
                "url": "http://example.com",
              },
            },
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `, `Object {
     "callback": [Function followLink],
     "props": Object {
       "url": "http://example.com",
     },
   }`)

    outboundTracking.cleanup()
  })

  it.each(
    [
      '_self',
      '_parent',
      '_top',
    ],
  )('should respect the anchor target %s', async (target) => {
    const outboundTracking = useAutoOutboundTracking(createPlausibleTracker({
      ignoredHostnames: [],
    }))

    const link = document.createElement('a')
    link.href = 'http://example.com'
    link.target = target

    document.body.appendChild(link)

    outboundTracking.install()

    link.click()

    // Empty the event loop
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(window.open).toHaveBeenCalledWith('http://example.com', target, '')

    outboundTracking.cleanup()
  })

  it('should track link with blank target', async () => {
    const outboundTracking = useAutoOutboundTracking(createPlausibleTracker({
      ignoredHostnames: [],
    }))

    const link = document.createElement('a')
    link.href = 'http://example.com'
    link.target = '_blank'
    document.body.appendChild(link)

    outboundTracking.install()

    link.click()

    expect(window.open).not.toHaveBeenCalled()
    expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
      body: JSON.stringify({
        n: 'Outbound Link: Click',
        u: 'http://localhost:3000/',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 0,
        p: '{"url":"http://example.com"}',
      }),
      headers: {
        'Content-Type': 'text/plain',
      },
      method: 'POST',
    })

    outboundTracking.cleanup()
  })

  it('should track link added after install', () => {
    const outboundTracking = useAutoOutboundTracking(plausible)

    const link = document.createElement('a')
    link.href = 'http://example.com'

    outboundTracking.install()

    document.body.appendChild(link)
    link.click()

    expect(plausible.trackEvent).toMatchInlineSnapshot(`[MockFunction spy]`, `Object {
     "callback": [Function followLink],
     "props": Object {
       "url": "http://example.com",
     },
   }`)

    outboundTracking.cleanup()
  })

  it('should remove event listeners on cleanup', () => {
    const outbound = useAutoOutboundTracking(createPlausibleTracker({
      ignoredHostnames: [],
    }))

    const link = document.createElement('a')
    link.href = 'http://example.com'
    link.target = '_blank'
    document.body.appendChild(link)

    outbound.install()
    outbound.cleanup()

    link.click()

    expect(window.fetch).not.toHaveBeenCalled()
  })
})
