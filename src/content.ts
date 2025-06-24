import type { Feed } from 'lib/types'
import browser from 'webextension-polyfill'

export const FeedTypes = [
  'application/feed+json',
  'application/rss+xml',
  'application/atom+xml',
  'application/rdf+xml',
  'application/json',
  'application/rss',
  'application/atom',
  'application/rdf',
  'text/rss+xml',
  'text/atom+xml',
  'text/rdf+xml',
  'text/rss',
  'text/atom',
  'text/rdf',
]

function getCurrentUrlSanitized() {
  const url = new URL(window.location.toString())

  // Delete hash
  url.hash = ''

  // Delete UTM parameters https://en.wikipedia.org/wiki/UTM_parameters#UTM_parameters
  url.searchParams.delete('utm_source')
  url.searchParams.delete('utm_medium')
  url.searchParams.delete('utm_campaign')
  url.searchParams.delete('utm_term')
  url.searchParams.delete('utm_content')

  // Delete yahoo trackers https://github.com/brave/adblock-lists/pull/978/files
  url.searchParams.delete('guccounter')
  url.searchParams.delete('guce_referrer')
  url.searchParams.delete('guce_referrer_sig')

  return url.toString()
}

let currentUrlSanitized = getCurrentUrlSanitized()
const hrefs: Set<string> = new Set()

function sendHrefs() {
  const elements = document.querySelectorAll(':is(link, a)[rel=alternate][type][href]')

  for (const element of elements) {
    if (!element) continue
    if (!element.hasAttribute('type') || !element.hasAttribute('href')) continue
    const type = element.getAttribute('type')!
    const isSupportedFeedType = FeedTypes.includes(type)
    if (!isSupportedFeedType) continue
    const title = element.getAttribute('title')
    const description = element.getAttribute('description')
    let href = element.getAttribute('href')!

    if (href.startsWith('/')) {
      href = `https://${window.location.host}${href}`
    }

    // If feed's url starts with "//"
    if (href.startsWith('//')) {
      href = `http:${href}`
    }

    if (href && !hrefs.has(href)) {
      hrefs.add(href)

      const newFeed: Partial<Feed> = {
        title: title ?? undefined,
        description: description ?? undefined,
        href,
      }

      const message = {
        name: 'NEW_FEED',
        args: newFeed,
      }
      browser.runtime.sendMessage(message)
    }
    else {
      console.debug(`Ignored ${href} because already is in store, store:`, hrefs.values().toArray())
    }
  }
}

new MutationObserver(() => {
  const testCurrentUrlSanitized = getCurrentUrlSanitized()
  if (currentUrlSanitized !== testCurrentUrlSanitized) {
    currentUrlSanitized = testCurrentUrlSanitized
    console.debug('Cleared URLs')
    hrefs.clear()
  }
  console.debug('Observed mutation')

  sendHrefs()
}).observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributeFilter: ['rel'],
})

sendHrefs()
console.log('Hello world!')
