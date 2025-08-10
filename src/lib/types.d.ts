import type { FeedType } from './feedTypes'

interface Author {
  name: string
  url?: string
  avatarUrl?: string
}

/**
 * Saved Feed on DB
 */
interface Feed {
  title: string
  description?: string
  feedUrl: string
  homeUrl: string
  authors?: Author[]
  foundAt: number // unix timestamp
  icon: string // ? feed provided icon otherwise website favicon
  // todo: icon: string
}

/**
 * Fetched Feed by URL nav icon with extra properties for differentiation
 */
interface NewFeed extends Feed {
  type: FeedType
  tags: string[]
  lastUpdate: number // unix timestamp
}

export {
  Author,
  Feed,
  NewFeed,
}
