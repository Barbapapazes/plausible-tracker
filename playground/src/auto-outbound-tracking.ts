import { createPlausibleTracker } from '@barbapapazes/plausible-tracker'
import { useAutoOutboundTracking } from '@barbapapazes/plausible-tracker/extensions/auto-outbound-tracking'

const plausible = createPlausibleTracker({
  ignoredHostnames: [],
})

const autoOutboundTracking = useAutoOutboundTracking(plausible)

autoOutboundTracking.install()
