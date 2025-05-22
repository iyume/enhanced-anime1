import type { FC } from 'react'
import { sendMainWorldMessage } from '@/libs/messaging'
import { useAnime1EpisodeQuery } from '@/libs/query'
import { useEffectAsync } from '../hooks/common/useEffectAsync'

const Anime1CategoryAutoScroll: FC = () => {
  const { data } = useAnime1EpisodeQuery()
  // Controls only scroll once
  const firstScrolled = useRef(false)

  useEffectAsync(async () => {
    // When the page is loaded, scroll to the last watched episode
    if (!data || firstScrolled.current)
      return
    firstScrolled.current = true
    const categoryId = await sendMainWorldMessage('getCategoryId', undefined)
    if (!categoryId)
      return
    const episodes = Object.values(data ?? {}).filter(ep => ep.categoryId === categoryId)
    if (episodes.length === 0)
      return
    const lastEpisode = episodes.reduce((prev, curr) => {
      return prev.updatedAt > curr.updatedAt ? prev : curr
    })
    const element = document.querySelector(`#post-${lastEpisode.id}`)
    if (element) {
      element.scrollIntoView({
        behavior: 'auto',
        block: 'start',
        inline: 'start',
      })
    }
  }, [data])

  return null
}

export const Anime1CategoryControls: FC = () => {
  return (
    <>
      <Anime1CategoryAutoScroll />
    </>
  )
}
