import { createPlausibleTracker } from '@barbapapazes/plausible-tracker'
import { useAutoFileDownloadsTracking } from '@barbapapazes/plausible-tracker/extensions/file-downloads-tracking'

const plausible = createPlausibleTracker({
  ignoredHostnames: [],
})

const fileDownloadsTracking = useAutoFileDownloadsTracking(plausible, {
  fileTypes: ['svg'],
})

fileDownloadsTracking.install()

document.getElementById('cleanup')!.addEventListener('click', () => {
  fileDownloadsTracking.cleanup()
})
