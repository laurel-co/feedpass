import type { NewFeed } from 'lib/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import browser from 'webextension-polyfill'

dayjs.extend(relativeTime)

function dayKey(ts: number) {
  const d = new Date(ts)

  // YYYY-MM-DD en zona local
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function formatSectionTitle(ts: number) {
  const date = new Date(ts)
  return new Intl.DateTimeFormat(navigator.language, {
    day: '2-digit',
    month: 'long',
  }).format(date)
}

function getFavicon(url: string, fallback?: string) {
  try {
    const u = new URL(url)
    return fallback || `${u.origin}/favicon.ico`
  }
  catch {
    return fallback || '/favicon.ico'
  }
}

function renderFeedItem(feed: NewFeed) {
  const li = document.createElement('li')
  li.className = 'feed-item'

  const article = document.createElement('article')
  article.className = 'feed'

  // Header
  const header = document.createElement('header')

  const img = document.createElement('img')
  img.className = 'feed-icon'
  img.src = feed.icon || getFavicon(feed.homeUrl)
  img.alt = ''

  const feedText = document.createElement('div')
  feedText.className = 'feed-text'

  const feedTitleSect = document.createElement('div')
  feedTitleSect.className = 'feed-title-section'

  const title = document.createElement('h4')
  title.className = 'feed-title'
  title.textContent = feed.title

  const lastUpdate = document.createElement('span')
  lastUpdate.className = 'feed-lastupdate'
  lastUpdate.textContent = `Active ${dayjs.unix(feed.lastUpdate).fromNow()}`

  feedTitleSect.appendChild(title)
  feedTitleSect.appendChild(lastUpdate)

  const desc = document.createElement('p')
  desc.className = 'feed-description'
  desc.textContent = feed.description || ''

  feedText.appendChild(feedTitleSect)
  feedText.appendChild(desc)
  header.appendChild(img)
  header.appendChild(feedText)

  const buttons = document.createElement('div')
  buttons.className = 'buttons'
  buttons.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      class="lucide lucide-plus-icon lucide-plus">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      class="lucide lucide-copy-icon lucide-copy">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  `

  article.appendChild(header)
  // article.appendChild(buttons)
  li.appendChild(article)
  return li
}

function renderSection(dateTs: number, items: NewFeed[]) {
  const section = document.createElement('section')
  section.className = 'feed-section'

  const h3 = document.createElement('h3')
  h3.className = 'feed-section-title'
  h3.textContent = formatSectionTitle(dateTs)

  const ul = document.createElement('ul')
  ul.className = 'feed-list'

  for (const feed of items) {
    ul.appendChild(renderFeedItem(feed))
  }

  section.appendChild(h3)
  section.appendChild(ul)
  return section
}

async function main() {
  const stored = await browser.storage.local.get() as unknown as Record<string, NewFeed>
  const feeds = Object.values(stored || {})

  const mainEl = document.getElementById('feeds')
  if (!mainEl) return

  // Limpia el contenido inicial
  mainEl.innerHTML = ''

  // Ordena por fecha (desc)
  feeds.sort((a, b) => (b.foundAt || 0) - (a.foundAt || 0))

  // Agrupa por día local
  const groups = new Map<string, { ts: number, items: NewFeed[] }>()
  for (const feed of feeds) {
    const key = dayKey(feed.foundAt || Date.now())
    const bucket = groups.get(key)
    if (bucket) {
      bucket.items.push(feed)
      bucket.ts = Math.max(bucket.ts, feed.foundAt || Date.now())
    }
    else {
      groups.set(key, { ts: feed.foundAt || Date.now(), items: [feed] })
    }
  }

  // Pinta secciones por orden cronológico descendente
  const sortedDays = Array.from(groups.entries())
    .sort((a, b) => b[1].ts - a[1].ts)

  for (const [, { ts, items }] of sortedDays) {
    mainEl.appendChild(renderSection(ts, items))
  }
}

void main()
