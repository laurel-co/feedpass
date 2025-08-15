import type { NewFeed } from './lib/types'
import browser from 'webextension-polyfill'
import { absolutify, isValid, purify } from '../src/utils'
import { FeedMimeTypes } from './lib/feedTypes'
import parseFeed from './lib/parser'

let currentUrlSanitized = purify(window.location.toString())
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
      feedUrl = absolutify(feedUrl)
    }

    // If feed's url starts with "//"
    if (feedUrl.startsWith('//')) {
      feedUrl = `http:${feedUrl}`
    }

    feedUrl = absolutify(feedUrl)

    if (!isValid(feedUrl)) continue

    if (feedUrl && !hrefs.has(feedUrl)) {
      hrefs.add(feedUrl)

      const crawledFeed = await parseFeed(
        type.includes('atom') ? 'atom' : type.includes('rss') ? 'rss' : 'json',
        feedUrl,
      )
      console.debug('crawled feed', crawledFeed, type, feedUrl)
      if (!crawledFeed) continue

      const newFeed: Partial<NewFeed> = {
        title: crawledFeed.title || title || undefined,
        description: crawledFeed.description || description || undefined,
        feedUrl: crawledFeed.feedUrl || feedUrl,
        homeUrl: crawledFeed.homeUrl || currentUrlSanitized,
        foundAt: Date.now(),
        authors: crawledFeed.authors,
        icon: crawledFeed.icon,
        ...crawledFeed,
      }
      if (!newFeed.title) continue
      console.debug('final feed', newFeed)

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
  const testCurrentUrlSanitized = purify(window.location.toString())
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
