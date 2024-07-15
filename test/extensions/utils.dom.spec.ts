import { describe, expect, it, vi } from 'vitest'
import { isOutboundLink, openLink, shouldFollowLink } from '../../src/extensions/utils'

describe('extensions utils', () => {
  describe('`isOutboundLink`', () => {
    it('should return `true` if hostname is different', () => {
      const link = document.createElement('a')
      link.href = 'http://example.com'

      expect(isOutboundLink(link, window.location.host)).toBe(true)
    })

    it('should return `false` if hostname is the same', () => {
      const link = document.createElement('a')
      link.href = window.location.href

      expect(isOutboundLink(link, window.location.host)).toBe(false)
    })
  })

  describe('`shouldFollowLink`', () => {
    it('should not accept prevented events', () => {
      const event = new MouseEvent('click')

      const link = document.createElement('a')
      link.href = 'http://example.com'

      event.preventDefault()

      expect(shouldFollowLink(event, link)).toBe(true)
    })

    it('should not intercept download links', () => {
      const event = new MouseEvent('click')

      const link = document.createElement('a')
      link.href = 'http://example.com'
      link.setAttribute('download', '')

      expect(shouldFollowLink(event, link)).toBe(false)
    })

    it.each([
      '_self',
      '_parent',
      '_top',
    ])('should only accept %s target', (target) => {
      const event = new MouseEvent('click')

      const link = document.createElement('a')
      link.href = 'http://example.com'
      link.target = target

      expect(shouldFollowLink(event, link)).toBe(true)
    })

    it('should not accept _blank target', () => {
      const event = new MouseEvent('click')

      const link = document.createElement('a')
      link.href = 'http://example.com'
      link.target = '_blank'

      expect(shouldFollowLink(event, link)).toBe(false)
    })

    it.each([
      {
        it: 'meta',
        options: { metaKey: true },
      },
      {
        it: 'ctrl',
        options: { ctrlKey: true },
      },
      {
        it: 'shift',
        options: { shiftKey: true },
      },
    ])('should not accept $it key', ({ options }) => {
      const event = new MouseEvent('click', options)

      const link = document.createElement('a')
      link.href = 'http://example.com'

      expect(shouldFollowLink(event, link)).toBe(false)
    })

    it.each([
      'mousedown',
      'mouseup',
      'dblclick',
    ])('should not accept %s event', (eventName) => {
      const event = new MouseEvent(eventName)

      const link = document.createElement('a')
      link.href = 'http://example.com'

      expect(shouldFollowLink(event, link)).toBe(false)
    })
  })

  describe('`openLink`', () => {
    it('should open the link in the same window', () => {
      const link = document.createElement('a')
      link.href = 'http://example.com'

      const openSpy = vi.spyOn(window, 'open')

      openLink(link)

      expect(openSpy).toHaveBeenCalledWith('http://example.com', '_self', '')
    })

    it('should open the link in a new window', () => {
      const link = document.createElement('a')
      link.href = 'http://example.com'
      link.target = '_blank'

      const openSpy = vi.spyOn(window, 'open')

      openLink(link)

      expect(openSpy).toHaveBeenCalledWith('http://example.com', '_blank', '')
    })

    it('should open the link in a new window with features', () => {
      const link = document.createElement('a')
      link.href = 'http://example.com'
      link.rel = 'noopener noreferrer'

      const openSpy = vi.spyOn(window, 'open')

      openLink(link)

      expect(openSpy).toHaveBeenCalledWith('http://example.com', '_self', 'noopener,noreferrer')
    })
  })
})
