import type { FC } from 'react'
import type { IAnime1RichEpisode } from '@/libs/query'
import clsx from 'clsx'
import { useAnime1CategoryQuery, useAnime1EpisodeQuery } from '@/libs/query'
import { cn, openAnime1CategoryPage } from '@/libs/utils'
import Badge from './ui/badge'
import Tabs from './ui/tabs/Tabs'
import TabsContent from './ui/tabs/TabsContent'
import TabsList from './ui/tabs/TabsList'
import TabsTrigger from './ui/tabs/TabsTrigger'

const EpisodeCard: FC<{ episode: IAnime1RichEpisode }> = ({ episode }) => {
  const daysAgo = Math.floor((Date.now() - episode.updatedAt) / (1000 * 60 * 60 * 24))
  const timeAgo = daysAgo === 0 ? '今天' : daysAgo === 1 ? '昨天' : `${daysAgo} 天前`

  return (
    <div
      className={clsx([
        'p-3 rounded-md border',
        episode.isFinished && 'bg-(--muted)/50',
      ])}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 mr-2">
          <h4 className={clsx([
            'font-medium text-sm line-clamp-1',
            episode.isFinished && 'line-through text-(--muted-text)',
          ])}
          >
            {episode.title}
          </h4>
        </div>
        <div className="ext-badge">
          {/* {episode.isFinished ? <CheckIcon size={16} className="mr-1" /> : <ClockIcon size={16} className="mr-1" />} */}
        </div>
      </div>

      <div className="w-full h-2 bg-(--primary)/40 rounded-full mb-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full', episode.isFinished ? 'bg-(--primary)/60' : 'bg-(--primary)')}
          style={{ width: `${Math.max(5, episode.progressPercent)}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-(--muted-text)">
        <div className="flex items-center">
          <span>
            {episode.displayCurrentTime}
            /
            {episode.displayDuration}
          </span>
        </div>
        <span>{timeAgo}</span>
      </div>
    </div>
  )
}

interface ICategory {
  id: string
  episodes: IAnime1RichEpisode[]
  updatedAt: number
}

const CategoryCard: FC<{ category: ICategory }> = ({ category }) => {
  const daysAgo = Math.floor((Date.now() - category.updatedAt) / (1000 * 60 * 60 * 24))
  const timeAgo = daysAgo === 0 ? '今天' : daysAgo === 1 ? '昨天' : `${daysAgo} 天前`
  const { data } = useAnime1CategoryQuery()

  const categoryDataSource = data?.[category.id]

  const sortedEpisodes = useMemo(() => {
    return [...category.episodes].sort((a, b) => {
      if (a.episodeNumber === null || b.episodeNumber === null)
        return 1
      return a.episodeNumber - b.episodeNumber
    })
  }, [category.episodes])

  return (
    <div
      className="p-3 rounded-md border bg-(--background) mb-4 cursor-pointer transition-colors hover:bg-(--muted)/20"
      onClick={
        () => openAnime1CategoryPage(category.id)
      }
    >
      <div className="mb-2">
        <h3 className="font-medium text-base text-(--text) line-clamp-1">{data?.[category.id]?.title ?? '...'}</h3>
        <div className="flex flex-wrap mt-1 mb-1 gap-1">
          {data
            ? categoryDataSource
              ? categoryDataSource.status === 'airing'
                ? (
                    <>
                      <Badge variant="lime">连载中</Badge>
                      {categoryDataSource.parsedEpisode && (
                        <Badge variant="teal">
                          更新至
                          {' '}
                          {categoryDataSource.parsedEpisode}
                          {' '}
                          话
                        </Badge>
                      )}
                    </>
                  )
                : (
                    <>
                      <Badge variant="purple">已完结</Badge>
                      {categoryDataSource.rawEpisode && <Badge variant="teal">{categoryDataSource.rawEpisode }</Badge>}
                    </>
                  )
              : null // 找不到数据？
            : (<p className="text-xs">加载中...</p>)}
        </div>
        <div className="flex justify-between items-center mt-1 text-xs text-(--muted-text)">
          <p>
            看过
            {' '}
            {category.episodes.length}
            {' '}
            集
          </p>
          <p>
            {timeAgo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {sortedEpisodes.map(episode => (
          <div
            key={episode.id}
            className={clsx([
              'aspect-square rounded border-2 flex items-center justify-center text-xs font-medium transition-colors',
              episode.isFinished
                ? 'bg-(--primary) border-(--primary)/40 text-(--text-white)' // Finished
                : episode.progressPercent > 0
                  ? 'bg-(--primary)/20 border-(--primary)/40 text-(--primary)' // In progress
                  : 'bg-(--muted)/10 border-(--muted) text-(--muted-text)', // In record but not started
            ])}
            title={`上次看到 ${episode.displayCurrentTime}`}
          >
            {episode.displayEpisodeNumber}
          </div>
        ))}
      </div>
    </div>
  )
}

const FloatWidgetContent: FC = () => {
  const { data } = useAnime1EpisodeQuery()

  const episodes = useMemo(() => {
    if (!data)
      return []
    return Object.values(data).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [data])

  // Group episodes by category, and sort by updatedAt
  const categories = useMemo(() => {
    if (!data)
      return []
    const grouped = Object.values(data).reduce((acc, episode) => {
      const category = episode.categoryId
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(episode)
      return acc
    }, {} as Record<string, IAnime1RichEpisode[]>)
    const result = Object.entries(grouped).map(([categoryId, episodes]) => ({
      id: categoryId,
      episodes,
      updatedAt: Math.max(...episodes.map(ep => ep.updatedAt)),
    } satisfies ICategory))
    // TODO: category filter
    result.sort((a, b) => b.updatedAt - a.updatedAt)
    return result
  }, [data])

  return (
    <div className="p-2 bg-(--background) text-(--text)">
      <Tabs className="flex flex-col h-[calc(100vh-1rem)]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="category">番剧列表</TabsTrigger>
          <TabsTrigger value="history">观看历史</TabsTrigger>
        </TabsList>
        <TabsContent value="category" className="flex-grow overflow-y-auto">
          <div>
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="history" className="flex-grow overflow-y-auto">
          <div>
            {episodes.map((episode) => {
              return (
                <div key={episode.id} className="w-full max-w-sm mb-4">
                  <EpisodeCard episode={episode} />
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FloatWidgetContent
