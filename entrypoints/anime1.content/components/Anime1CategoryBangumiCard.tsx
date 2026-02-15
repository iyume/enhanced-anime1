import React, { type FC } from 'react'
import type { BgmSubject } from '@/libs/bangumi-resolve'
import { resolveBgmSubjectBySeriesTitle, trimAnime1SeriesTitle } from '@/libs/bangumi-resolve'
import { useAnime1State } from '../providers/anime1-state-provider'
import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'

const BANGUMI_CARD_CONTAINER_ID = 'enhanced-anime1-bangumi-card'

const cardStyles = {
  card: {
    margin: '0 0 24px 0',
    padding: '16px',
    width: '100%',
    maxHeight: '360px',
    background: 'var(--background, #fff)',
    border: '1px solid var(--border, #e4e4e7)',
    borderRadius: '8px',
    display: 'flex',
    gap: '16px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden' as const,
  },
  image: {
    width: 'auto',
    //maxWidth: '60%',
    height: 'auto',
    maxHeight: '328px',
    objectFit: 'cover' as const,
    borderRadius: '4px',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflow: 'auto' as const,
  },
  name: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text, #1a1a1a)',
  },
  nameCn: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: 'var(--text, #666)',
    opacity: 0.85,
  },
  summary: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'var(--text, #333)',
    whiteSpace: 'pre-wrap' as const,
    maxHeight: '120px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 5,
    WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
  },
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  tag: {
    padding: '2px 8px',
    fontSize: '12px',
    background: 'var(--primary, #77cc6d)',
    color: 'var(--text, #fff)',
    borderRadius: '9999px',
  },
  tagCount: {
    marginLeft: '4px',
    fontSize: '8px',
    color: '#dbdbdb',
  },
} as const

const BangumiCardContent: FC<{ subject: BgmSubject }> = ({ subject }) => {
  const topTags = subject.tags.slice(0, 15) // only show 15 tags
  const summary = (subject.summary || '').replace(/\r\n/g, '\n').trim()

  return (
    <div style={cardStyles.card}>
      {subject.images?.common
        ? (
            subject.bangumi_url
              ? (
                  <a href={subject.bangumi_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <img src={subject.images.common} alt="" style={cardStyles.image} />
                  </a>
                )
              : (
                  <img src={subject.images.common} alt="" style={cardStyles.image} />
                )
          )
        : null}
      <div style={cardStyles.content}>
        <h2 style={cardStyles.name}>{subject.name}</h2>
        {subject.name_cn ? <p style={cardStyles.nameCn}>{subject.name_cn}</p> : null}
        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--border, #e4e4e7)' }} />
        {summary ? <p style={cardStyles.summary}>{summary}</p> : null}
        <div style={cardStyles.tagsWrap}>
          {topTags.map(tag => (
            <span key={tag.name} style={cardStyles.tag}>
              {tag.name}
              {tag.count != null && (
                <small style={cardStyles.tagCount}> {tag.count}</small>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export const Anime1CategoryBangumiCard: FC = () => {
  const { posts } = useAnime1State()
  const injectedRef = useRef<{ container: HTMLElement; root: ReturnType<typeof ReactDOM.createRoot> } | null>(null)

  useEffect(() => {
    if (!posts.length) return

    const firstPost = posts[0]
    const seriesTitle = trimAnime1SeriesTitle(firstPost.title)
    if (!seriesTitle) {
      console.warn('[enhanced-anime1] Bangumi card: empty series title after trim', { rawTitle: firstPost.title })
      return
    }

    const main = document.getElementById('main')
    if (!main) {
      console.error('[enhanced-anime1] Bangumi card: #main not found', { debug: { seriesTitle } })
      return
    }

    let cancelled = false

    void resolveBgmSubjectBySeriesTitle(seriesTitle).then((result) => {
      if (cancelled) return
      if (!result) return

      const { subject, debug } = result
      console.log('[enhanced-anime1] Bangumi card: inject success', debug)

      const existing = document.getElementById(BANGUMI_CARD_CONTAINER_ID)
      if (existing) existing.remove()

      const container = document.createElement('div')
      container.id = BANGUMI_CARD_CONTAINER_ID
      main.insertBefore(container, main.firstChild)

      const root = ReactDOM.createRoot(container)
      root.render(<BangumiCardContent subject={subject} />)
      injectedRef.current = { container, root }
    })

    return () => {
      cancelled = true
      const prev = injectedRef.current
      if (prev) {
        prev.root.unmount()
        prev.container.remove()
        injectedRef.current = null
      }
    }
  }, [posts])

  return null
}
