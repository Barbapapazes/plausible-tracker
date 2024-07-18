import type { EventOptions } from './types'

declare global {
  interface Window {
    plausible: (eventName: string, options?: EventOptions) => void
  }
}
