import type { Feed } from './lib/types'
import browser from 'webextension-polyfill'
import { FeedMimeTypes } from './lib/feedTypes'
import parseFeed from './lib/parser'

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

async function sendHrefs() {
  const elements = document.querySelectorAll(':is(link, a)[rel=alternate][type][href]')

  for (const element of elements) {
    if (!element) continue
    if (!element.hasAttribute('type') || !element.hasAttribute('href')) continue
    const type = element.getAttribute('type')!
    const isSupportedFeedType = FeedMimeTypes.includes(type as any)
    if (!isSupportedFeedType) continue
    const title = element.getAttribute('title')
    const description = element.getAttribute('description')
    let feedUrl = element.getAttribute('href')!

    if (feedUrl.startsWith('/')) {
      feedUrl = `https://${window.location.host}${feedUrl}`
    }

    // If feed's url starts with "//"
    if (feedUrl.startsWith('//')) {
      feedUrl = `http:${feedUrl}`
    }

    if (feedUrl && !hrefs.has(feedUrl)) {
      hrefs.add(feedUrl)

      const crawledFeed = await parseFeed(
        type.includes('atom') ? 'atom' : type.includes('rss') ? 'rss' : 'json',
        feedUrl,
      )
      console.debug('crawled feed', crawledFeed, type, feedUrl)
      if (!crawledFeed) continue

      const newFeed: Partial<Feed> = {
        title: crawledFeed.title || title || undefined,
        description: crawledFeed.description || description || undefined,
        feedUrl: crawledFeed.feedUrl || feedUrl,
        homeUrl: crawledFeed.homeUrl || currentUrlSanitized,
        foundAt: Date.now(),
        authors: crawledFeed.authors,
        icon: crawledFeed.icon,
      }
      if (!newFeed.title) continue

      const message = {
        name: 'NEW_FEED',
        args: newFeed,
      }
      browser.runtime.sendMessage(message)
    }
    else {
      console.debug(`Ignored ${feedUrl} because already is in store, store:`, hrefs.values().toArray())
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
