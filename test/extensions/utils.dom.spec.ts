import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isOutboundLink, openLink, shouldFollowLink } from '../../../src/extensions/utils'

describe('extensions utils', () => {
  let link: HTMLAnchorElement = document.createElement('a')

  beforeEach(() => {
    link = document.createElement('a')
    link.href = 'http://example.com'
  })

  describe('`isOutboundLink`', () => {
    it('should return `true` if hostname is different', () => {
      expect(isOutboundLink(link, window.location.host)).toBe(true)
    })

    it('should return `false` if hostname is the same', () => {
      link.href = window.location.href

      expect(isOutboundLink(link, window.location.host)).toBe(false)
    })
  })

  describe('`shouldFollowLink`', () => {
    it('should not accept prevented events', () => {
      const event = new MouseEvent('click')
      event.preventDefault()

      expect(shouldFollowLink(event, link)).toBe(true)
    })

    it('should not intercept download links', () => {
      const event = new MouseEvent('click')

      link.setAttribute('download', '')

      expect(shouldFollowLink(event, link)).toBe(false)
    })

    it.each([
      '_self',
      '_parent',
      '_top',
    ])('should accept %s target', (target) => {
      const event = new MouseEvent('click')

      link.target = target

      expect(shouldFollowLink(event, link)).toBe(true)
    })

    it('should not accept _blank target', () => {
      const event = new MouseEvent('click')

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

      expect(shouldFollowLink(event, link)).toBe(false)
    })

    it.each([
      'mousedown',
      'mouseup',
      'dblclick',
    ])('should not accept %s event', (eventName) => {
      const event = new MouseEvent(eventName)

      expect(shouldFollowLink(event, link)).toBe(false)
    })
  })

  describe('`openLink`', () => {
    beforeEach(() => {
      vi.stubGlobal('open', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should open the link in the same window', () => {
      openLink(link)

      expect(window.open).toHaveBeenCalledWith('http://example.com', '_self', '')
    })

    it('should open the link in a new window', () => {
      link.target = '_blank'

      openLink(link)

      expect(window.open).toHaveBeenCalledWith('http://example.com', '_blank', '')
    })

    it('should open the link in a new window with features', () => {
      link.rel = 'noopener noreferrer'

      openLink(link)

      expect(window.open).toHaveBeenCalledWith('http://example.com', '_self', 'noopener,noreferrer')
    })
  })
})
