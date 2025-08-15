import type { NewFeed } from 'lib/types'
import browser from 'webextension-polyfill'

function isEmpty(obj: object) {
  return Object.keys(obj).length === 0
}

browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details)
})

browser.runtime.onMessage.addListener(async (msg: any) => {
  if (msg && msg.name === 'NEW_FEED') {
    const feed = msg.args as NewFeed
    console.debug('New feed', feed)
    const alreadyExists = await browser.storage.local.get(feed.feedUrl)
    console.debug(alreadyExists)
    if (!isEmpty(alreadyExists)) return

    browser.storage.local.set({
      [feed.feedUrl]: feed,
    })
  }
})
