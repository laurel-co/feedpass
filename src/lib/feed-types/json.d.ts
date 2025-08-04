export interface JsonFeedItem {
  id: string
  url?: string
  external_url?: string
  title?: string
  content_text?: string
  content_html?: string
  summary?: string
  date_modified?: string
  date_published: string
}

export interface JsonFeed {
  version: string
  title: string
  home_page_url?: string
  feed_url?: string
  description?: string
  icon?: string
  favicon?: string
  language?: string
  author?: string
  authors?: { name: string, url?: string, avatar?: string }[]
  language?: string
  items: JsonFeedItem[]
}
