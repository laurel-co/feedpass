import type { Feed } from 'lib/types'
import browser from 'webextension-polyfill'

async function main() {
  const feeds = await browser.storage.local.get() as unknown as Record<string, Feed>

  const feedList = document.getElementById('feed-list')!

  console.debug('popup script run!!', feeds)

  for (const [, feed] of Object.entries(feeds)) {
    const child = document.createElement('p')
    child.textContent = `${feed.title} ${feed.href}`
    feedList.appendChild(child)
  }
}

void main()
