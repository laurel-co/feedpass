import type { FeedType } from './feedTypes'

export interface Feed {
  title: string
  description?: string
  href: string
  viewedAt: number
  // todo: icon: string
}

export interface NewFeed {
  title: string
  description?: string
  href: string
  viewedAt: number
  type: FeedType
  // todo: icon: string
}
