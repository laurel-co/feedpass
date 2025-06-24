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
] as const

export type FeedType = typeof FeedTypes[number]
