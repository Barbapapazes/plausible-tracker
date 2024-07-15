/* eslint-disable no-console */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPlausibleTracker } from '../src/plausible'
import type { PlausibleOptions } from '../src/types'

describe('`createPlausibleTracker`', () => {
  it('should return `trackEvent`, `trackPageview` and `options`', () => {
    const plausible = createPlausibleTracker()

    expect(plausible.trackEvent).toBeDefined()
    expect(plausible.trackPageview).toBeDefined()
    expect(plausible.options).toBeDefined()
  })

  describe('`options`', () => {
    it('should return the default options', () => {
      const plausible = createPlausibleTracker()

      expect(plausible.options).toEqual({
        enabled: true,
        hashMode: false,
        domain: 'localhost',
        apiHost: 'https://plausible.io',
        ignoredHostnames: ['localhost'],
        ignoreSubDomains: false,
        logIgnored: false,
      })
    })

    it('should override all default options with the init options', () => {
      const plausible = createPlausibleTracker({
        enabled: false,
        domain: 'example.com',
        apiHost: 'https://example.com',
        hashMode: true,
        ignoredHostnames: ['example.com'],
        ignoreSubDomains: true,
        logIgnored: true,
      })

      expect(plausible.options).toEqual({
        enabled: false,
        hashMode: true,
        domain: 'example.com',
        apiHost: 'https://example.com',
        ignoredHostnames: ['example.com'],
        ignoreSubDomains: true,
        logIgnored: true,
      })
    })

    it.each([
      {
        enabled: false,
      },
      {
        domain: 'example.com',
      },
      {
        apiHost: 'https://example.com',
      },
      {
        hashMode: true,
      },
      {
        ignoredHostnames: ['example.com'],
      },
      {
        ignoreSubDomains: true,
      },
      {
        logIgnored: true,
      },
    ])('should override some default options with the init options (%j)', (option) => {
      const plausible = createPlausibleTracker(option)

      const defaultOptions: PlausibleOptions = {
        enabled: true,
        hashMode: false,
        domain: location.hostname,
        apiHost: 'https://plausible.io',
        ignoredHostnames: ['localhost'],
        ignoreSubDomains: false,
        logIgnored: false,
      }

      expect(plausible.options).toEqual({
        ...defaultOptions,
        ...option,
      })
    })
  })

  describe('`sendEvent`', () => {
    beforeEach(() => {
      vi.spyOn(console, 'info')
      localStorage.clear()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    afterAll(() => {
      localStorage.clear()
    })

    it('should send the data to the API', () => {
      vi.spyOn(window, 'fetch').mockResolvedValue({} as Response)

      const plausible = createPlausibleTracker({
        ignoredHostnames: [], // Ignore no hostnames
      })

      plausible.trackEvent('test')

      expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
        body: JSON.stringify({
          n: 'test',
          u: 'http://localhost:3000/',
          d: 'localhost',
          r: '',
          w: 1024,
          h: 0,
          p: undefined,
        }),
        headers: {
          'Content-Type': 'text/plain',
        },
        method: 'POST',
      })
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should send the data to the API with the props', () => {
      vi.spyOn(window, 'fetch').mockResolvedValue({} as Response)

      const plausible = createPlausibleTracker({
        ignoredHostnames: [], // Ignore no hostnames
      })

      plausible.trackEvent('test', {
        props: {
          key: 'value',
        },
      })

      expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
        body: JSON.stringify({
          n: 'test',
          u: 'http://localhost:3000/',
          d: 'localhost',
          r: '',
          w: 1024,
          h: 0,
          p: '{"key":"value"}',
        }),
        headers: {
          'Content-Type': 'text/plain',
        },
        method: 'POST',
      })
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should call the callback after the event is sent', async () => {
      vi.spyOn(window, 'fetch').mockResolvedValue({} as Response)

      const plausible = createPlausibleTracker({
        ignoredHostnames: [], // Ignore no hostnames
      })

      const callback = vi.fn()
      await plausible.trackEvent('test', {
        callback,
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should not send the payload if plausible is disabled', () => {
      vi.spyOn(window, 'fetch')

      const plausible = createPlausibleTracker({
        enabled: false,
      })

      const callback = vi.fn()
      plausible.trackEvent('test', {
        callback,
      })

      expect(window.fetch).not.toHaveBeenCalled()
      expect(callback).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should not send the payload if the protocol is file', () => {
    // @ts-expect-error - Mocking the location object
      vi.spyOn(window, 'location', 'get').mockReturnValue({
        protocol: 'file:',
      })
      vi.spyOn(window, 'fetch')

      const plausible = createPlausibleTracker({
        ignoredHostnames: [],
      })

      const callback = vi.fn()
      plausible.trackEvent('test', {
        callback,
      })

      expect(window.fetch).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith('[Plausible] test', {
        n: 'test',
        u: undefined,
        d: undefined,
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      })
    })

    it('should not send the payload if the hostname is ignored', () => {
      vi.spyOn(window, 'fetch')

      const plausible = createPlausibleTracker({
        domain: 'example.com',
        ignoredHostnames: ['example.com'],
      })

      const callback = vi.fn()
      plausible.trackEvent('test', {
        callback,
      })

      expect(window.fetch).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith('[Plausible] test', {
        n: 'test',
        u: 'http://localhost:3000/',
        d: 'example.com',
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      })
    })

    it('should not send the payload if the subdomain is ignored', () => {
      vi.spyOn(window, 'fetch')

      const plausible = createPlausibleTracker({
        domain: 'sub.example.com',
        ignoredHostnames: ['example.com'],
        ignoreSubDomains: true,
      })

      const callback = vi.fn()
      plausible.trackEvent('test', {
        callback,
      })

      expect(window.fetch).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith('[Plausible] test', {
        n: 'test',
        u: 'http://localhost:3000/',
        d: 'sub.example.com',
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      })
    })

    it('should not send the payload if the user excluded himself', () => {
      vi.spyOn(window, 'fetch')

      const plausible = createPlausibleTracker()

      localStorage.setItem('plausible_ignore', 'true')

      const callback = vi.fn()
      plausible.trackEvent('test', {
        callback,
      })

      expect(window.fetch).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalledWith('[Plausible] test', {
        n: 'test',
        u: 'http://localhost:3000/',
        d: 'localhost',
        r: '',
        w: 1024,
        h: 0,
        p: undefined,
      })
    })

    it('should allow to ignore log', () => {
      vi.spyOn(window, 'fetch')

      const plausible = createPlausibleTracker({
        logIgnored: true,
      })

      const callback = vi.fn()
      plausible.trackEvent('test', {
        callback,
      })

      expect(window.fetch).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
    })
  })

  describe('`trackPageview`', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should send a `pageview` event', async () => {
      vi.spyOn(window, 'fetch').mockResolvedValue({} as Response)
      vi.spyOn(console, 'info')

      const plausible = createPlausibleTracker({
        ignoredHostnames: [],
      })

      const callback = vi.fn()
      await plausible.trackPageview({
        callback,
      })

      expect(window.fetch).toHaveBeenCalledWith('https://plausible.io/api/event', {
        body: JSON.stringify({
          n: 'pageview',
          u: 'http://localhost:3000/',
          d: 'localhost',
          r: '',
          w: 1024,
          h: 0,
          p: undefined,
        }),
        headers: {
          'Content-Type': 'text/plain',
        },
        method: 'POST',
      })
      expect(callback).toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
    })
  })
})
