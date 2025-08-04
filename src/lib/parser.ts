import type { JsonFeed } from './feed-types/json'
import type { FeedType } from './feedTypes'
import type { Author, Feed, NewFeed } from './types'

interface Response {
  type: '' | 'document' | 'json' | 'text' | 'arraybuffer'
  response: ArrayBuffer | Blob | Document | object | string
}

// ? see: https://stackoverflow.com/a/48969580
function makeRequest(method: string, url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        console.debug(!!this.responseXML, this.responseType)
        resolve({
          response: this.responseXML || this.response,
          // @ts-expect-error ignore shitty api types
          type: this.responseXML ? 'document' : this.responseType,
        })
      }
      else {
        reject(new Error(this.statusText))
      }
    }
    xhr.onerror = function () {
      reject(new Error(this.statusText))
    }
    xhr.send()
  })
}

// Helper function for Atom authors
function getTextFromParent(parent: Element, tag: string): string | undefined {
  const el = parent.querySelector(tag)
  return el ? el.textContent || undefined : undefined
}

export default async function parseFeed(feedType: FeedType, url: string): Promise<Partial<Feed> | Partial<NewFeed> | false> {
  console.debug(`Parsing ${url} of ${feedType}`)
  const response = await makeRequest('get', url)

  // * JSON Feed
  if (feedType === 'json' && response.type === 'json') {
    const document = response.response as Partial<JsonFeed>

    const authors = document.author || document.authors
      ? document.version!.includes('1.1') && document.authors
        ? document.authors
        : [{ name: document.author! }]
      : undefined

    const lastUpdate = document.items
      ? new Date(document.items
        .filter(d => d.date_published)
        .reduce((a, b) => new Date(a.date_published).getTime() > new Date(b.date_published).getTime() ? a : b)
        .date_published,
      )
      : undefined

    return {
      title: document.title,
      homeUrl: document.home_page_url,
      feedUrl: document.feed_url ?? url,
      description: document.description,
      foundAt: Date.now(),
      type: 'json',
      authors,
      icon: document.icon ?? document.favicon,
      lastUpdate,
    }
  }

  // * Atom Feed
  if (feedType === 'atom' && response.type === 'document') {
    const document = response.response as XMLDocument
    const getText = (tag: string) => {
      const el = document.querySelector(tag)
      return el ? el.textContent || undefined : undefined
    }
    const authors = Array.from(document.querySelectorAll('author'))
      .map(author => ({
        name: getTextFromParent(author, 'name'),
        url: getTextFromParent(author, 'uri'),
      }))
      .filter(a => a !== undefined && !!a) as Exclude<Author, 'avatarUrl'>[]

    const icon = getText('icon') || getText('logo')

    // Find the most recent updated/published date
    const entries = Array.from(document.querySelectorAll('entry'))
    const lastUpdate = entries.length
      ? new Date(
        entries
          .map(e => e.querySelector('updated')?.textContent || e.querySelector('published')?.textContent)
          .filter(Boolean)
          .sort()
          .reverse()[0] as string,
      )
      : undefined

    return {
      title: getText('title'),
      homeUrl: getText('link[rel="alternate"]') || document.querySelector('link')?.getAttribute('href') || undefined,
      feedUrl: getText('link[rel="self"]') || url,
      description: getText('subtitle'),
      foundAt: Date.now(),
      type: 'atom',
      authors: authors.length ? authors : undefined,
      icon,
      lastUpdate,
    }
  }

  // * RSS Feed
  if (feedType === 'rss' && response.type === 'document') {
    const document = response.response as Document
    const getText = (tag: string) => {
      const el = document.querySelector(tag)
      return el ? el.textContent || undefined : undefined
    }
    const channel = document.querySelector('channel')

    const authorTag = channel?.querySelector('managingEditor, author')
    const authors = authorTag
      ? [{ name: authorTag.textContent || '' }]
      : undefined

    const items = Array.from(channel?.querySelectorAll('item') || [])
    const lastUpdate = items.length
      ? new Date(
        items
          .map(i => i.querySelector('pubDate')?.textContent)
          .filter(Boolean)
          .sort()
          .reverse()[0] as string,
      )
      : undefined

    console.debug('aaa', getText('channel > description'))

    return {
      title: getText('title'),
      homeUrl: getText('link'),
      feedUrl: url,
      description: getText('description'),
      foundAt: Date.now(),
      type: 'rss',
      authors,
      icon: getText('image > url') || undefined,
      lastUpdate,
    }
  }

  return false
}
