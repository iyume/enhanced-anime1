import type { IAnime1RichEpisode } from '@/libs/query'
import type { FC } from 'react'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { cn } from '@/libs/utils'
import clsx from 'clsx'
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

const FloatWidgetContent: FC = () => {
  const { data } = useAnime1EpisodeQuery()

  return (
    <div className="p-4 bg-(--background) text-(--text)">
      <Tabs>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">观看历史</TabsTrigger>
          <TabsTrigger value="category">番剧列表</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          {/* TODO: scroll */}
          <div>
            {Object.values(data ?? {}).map((episode) => {
              return (
                <div key={episode.id} className="w-full max-w-sm mb-4">
                  <EpisodeCard episode={episode} />
                </div>
              )
            })}
          </div>
        </TabsContent>
        <TabsContent value="category"></TabsContent>
      </Tabs>
    </div>
  )
}

export default FloatWidgetContent
