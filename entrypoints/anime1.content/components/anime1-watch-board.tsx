import type { FC } from 'react'
import type { Anime1Category, IAnime1RichEpisode } from '@/libs/query'
import type { WatchBoardEntry, WatchBoardGroup } from '@/libs/watch-board'
import clsx from 'clsx'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { formatRelativeTime } from '@/libs/format'
import { useAnime1CategoriesMutation, useAnime1CategoriesQuery, useAnime1CategoryQuery, useAnime1EpisodeQuery } from '@/libs/query'
import { anime1CategoryUrl, anime1EpisodeUrl } from '@/libs/utils'
import { buildWatchBoard, episodeProgressPercent, hasWatched } from '@/libs/watch-board'

const STATUS_LABEL: Record<Anime1Category['status'], string> = {
  airing: '连载中',
  completed: '已完结',
  ova: 'OVA',
  movie: '剧场版',
  unknown: '',
}

function boardProgressRatio(entry: WatchBoardEntry): number {
  if (entry.latestAvailable != null && entry.latestAvailable > 0) {
    return Math.min(entry.reachedEpisode / entry.latestAvailable, 1)
  }
  const maxProgress = entry.episodes.reduce(
    (max, episode) => Math.max(max, episodeProgressPercent(episode)),
    0,
  )
  return maxProgress / 100
}

function metaLine(entry: WatchBoardEntry): string {
  const progress = entry.latestAvailable != null
    ? `看到 ${entry.reachedEpisode}/${entry.latestAvailable} 集`
    : entry.finishedCount > 0
      ? `看完 ${entry.finishedCount} 集`
      : `上次看到 ${entry.lastWatched.displayCurrentTime}`
  const status = entry.meta ? STATUS_LABEL[entry.meta.status] : ''
  return status ? `${progress} · ${status}` : progress
}

const EpisodeCell: FC<{ episode: IAnime1RichEpisode }> = ({ episode }) => (
  <a
    href={anime1EpisodeUrl(episode.id)}
    className={clsx([
      'flex aspect-square items-center justify-center rounded border-2 text-xs font-medium transition-colors',
      episode.isFinished
        ? 'bg-(--primary) border-(--primary)/40 text-(--text-white)'
        : hasWatched(episode)
          ? 'bg-(--primary)/20 border-(--primary)/40 text-(--primary)'
          : 'bg-(--muted)/10 border-(--muted) text-(--muted-text) hover:text-(--primary)',
      'hover:border-(--primary)',
    ])}
    title={`${episode.title} · 上次看到 ${episode.displayCurrentTime}`}
  >
    {episode.displayEpisodeNumber}
  </a>
)

const WatchBoardCard: FC<{
  entry: WatchBoardEntry
  expanded: boolean
  onToggle: () => void
  onSetArchived: (categoryId: string, archived: boolean) => void
}> = ({ entry, expanded, onToggle, onSetArchived }) => {
  const ratio = boardProgressRatio(entry)
  const isArchived = entry.archivedAt != null
  const lastWatchedLabel = entry.lastWatched.displayEpisodeNumber === '剧场版'
    ? '剧场版'
    : `第 ${entry.lastWatched.displayEpisodeNumber} 话`

  return (
    <div className="mb-3 overflow-hidden rounded-md border bg-(--background)">
      <div
        className="cursor-pointer p-3 transition-colors hover:bg-(--muted)/20"
        onClick={onToggle}
      >
        <div className="flex items-start gap-2">
          <a
            href={anime1CategoryUrl(entry.categoryId)}
            className={clsx(
              'group flex min-w-0 flex-1 items-center gap-0.5 text-sm font-medium hover:text-(--primary)',
              isArchived ? 'text-(--muted-text)' : 'text-(--text)',
            )}
            onClick={event => event.stopPropagation()}
          >
            <span className="truncate underline decoration-(--muted-text) underline-offset-2 group-hover:decoration-(--primary)">
              {entry.title}
            </span>
            <ArrowUpRight
              size={13}
              className="shrink-0 text-(--muted-text) group-hover:text-(--primary)"
            />
          </a>
          <ChevronDown
            size={16}
            className={clsx(
              'mt-0.5 shrink-0 text-(--muted-text) transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>

        <div className="mt-2 mb-2 h-2 w-full overflow-hidden rounded-full bg-(--primary)/40">
          <div
            className={clsx(
              'h-full rounded-full',
              entry.behindCount === 0 ? 'bg-(--primary)/60' : 'bg-(--primary)',
            )}
            style={{ width: `${ratio > 0 ? Math.max(5, ratio * 100) : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-(--muted-text)">
          <span className="truncate">{metaLine(entry)}</span>
          <span className="shrink-0">{formatRelativeTime(entry.lastWatchedAt)}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-3">
          <div className="grid grid-cols-8 gap-2">
            {entry.episodes.map(episode => (
              <EpisodeCell key={episode.id} episode={episode} />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-(--muted-text)">
              上次看到
              {' '}
              {lastWatchedLabel}
              {' · '}
              {entry.lastWatched.displayCurrentTime}
            </p>
            <button
              type="button"
              className={clsx(
                'shrink-0 text-xs transition-colors',
                isArchived
                  ? 'text-(--muted-text) hover:text-(--primary)'
                  : 'text-(--muted-text) hover:text-orange-500',
              )}
              onClick={() => onSetArchived(entry.categoryId, !isArchived)}
            >
              {isArchived ? '恢复' : '废弃'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const WatchBoardGroupSection: FC<{
  group: WatchBoardGroup
  expandedId: string | null
  onToggle: (categoryId: string) => void
  onSetArchived: (categoryId: string, archived: boolean) => void
}> = ({ group, expandedId, onToggle, onSetArchived }) => (
  <section className="mt-3">
    <div className="mb-2 flex items-baseline gap-x-2 px-2">
      <h3 className="text-xs font-semibold text-(--text)">{group.title}</h3>
      <span className="text-xs text-(--muted-text)">{group.entries.length}</span>
      {group.hint && <span className="truncate text-xs text-(--muted-text)">{group.hint}</span>}
    </div>
    <div className="px-1">
      {group.entries.map(entry => (
        <WatchBoardCard
          key={entry.categoryId}
          entry={entry}
          expanded={expandedId === entry.categoryId}
          onToggle={() => onToggle(entry.categoryId)}
          onSetArchived={onSetArchived}
        />
      ))}
    </div>
  </section>
)

const WatchBoardArchivedSection: FC<{
  group: WatchBoardGroup
  expandedId: string | null
  onToggle: (categoryId: string) => void
  onSetArchived: (categoryId: string, archived: boolean) => void
}> = ({ group, expandedId, onToggle, onSetArchived }) => {
  const [open, setOpen] = useState(false)
  return (
    <section className="mt-3">
      <button
        type="button"
        className="mb-2 flex w-full items-center gap-x-2 px-2 text-left"
        onClick={() => setOpen(prev => !prev)}
      >
        <h3 className="text-xs font-semibold text-(--muted-text)">{group.title}</h3>
        <span className="text-xs text-(--muted-text)">{group.entries.length}</span>
        {group.hint && <span className="truncate text-xs text-(--muted-text)">{group.hint}</span>}
        <ChevronDown
          size={12}
          className={clsx(
            'ml-auto shrink-0 text-(--muted-text) transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="px-1">
          {group.entries.map(entry => (
            <WatchBoardCard
              key={entry.categoryId}
              entry={entry}
              expanded={expandedId === entry.categoryId}
              onToggle={() => onToggle(entry.categoryId)}
              onSetArchived={onSetArchived}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export const Anime1WatchBoard: FC = () => {
  const { data: episodes } = useAnime1EpisodeQuery()
  const { data: categories } = useAnime1CategoryQuery()
  const { data: categoryRecords } = useAnime1CategoriesQuery()
  const { mutate: setArchived } = useAnime1CategoriesMutation()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const board = useMemo(
    () => buildWatchBoard(episodes, categories, categoryRecords),
    [episodes, categories, categoryRecords],
  )

  const handleToggle = useCallback((categoryId: string) => {
    setExpandedId(prev => (prev === categoryId ? null : categoryId))
  }, [])
  const handleSetArchived = useCallback((categoryId: string, archived: boolean) => {
    setArchived({ categoryId, archived })
  }, [setArchived])

  if (!episodes) {
    return <p className="px-4 py-10 text-center text-xs text-(--muted-text)">加载中…</p>
  }

  if (board.groups.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-xs text-(--muted-text)">
        <p>还没有观看记录。</p>
        <p className="mt-1">播放任意一集就会自动记录，下次打开直接续播。</p>
      </div>
    )
  }

  const visibleGroups = board.groups.filter(group => group.id !== 'archived')
  const archivedGroup = board.groups.find(group => group.id === 'archived')

  return (
    <div className="px-1 pb-4">
      <div className="flex flex-wrap items-baseline gap-x-2 border-b px-2 pb-2 text-xs text-(--muted-text)">
        <span>
          在追
          {' '}
          <span className="font-medium text-(--text)">{board.followingCount}</span>
          {' '}
          部
        </span>
        {board.behindSeriesCount > 0 && (
          <span>
            ·
            {' '}
            <span className="font-medium text-orange-500">{board.behindSeriesCount}</span>
            {' '}
            部落下
          </span>
        )}
      </div>
      {visibleGroups.map(group => (
        <WatchBoardGroupSection
          key={group.id}
          group={group}
          expandedId={expandedId}
          onToggle={handleToggle}
          onSetArchived={handleSetArchived}
        />
      ))}
      {archivedGroup && (
        <WatchBoardArchivedSection
          group={archivedGroup}
          expandedId={expandedId}
          onToggle={handleToggle}
          onSetArchived={handleSetArchived}
        />
      )}
    </div>
  )
}
