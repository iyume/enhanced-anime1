import type { ChangeEvent, FC } from 'react'
import type { StorageAnime1Episode } from '@/libs/storage'
import { formatRelativeTime } from '@/libs/format'
import {
  createProgressFile,
  mergeCategories,
  mergeEpisodes,
  parseProgressFile,
  progressFileName,
  summarizeEpisodes,
} from '@/libs/progress-transfer'
import { useAnime1CategoriesQuery, useAnime1CategoriesRefetch, useAnime1EpisodeQuery, useAnime1EpisodeRefetch } from '@/libs/query'
import { storageAnime1Categories, storageAnime1Episodes } from '@/libs/storage'
import { downloadJsonFile } from '@/libs/utils'

interface Status {
  type: 'success' | 'error'
  message: string
}

const actionButtonClass = 'w-full rounded-md border bg-(--background) px-3 py-2 text-sm font-medium '
  + 'text-(--text) transition-colors hover:bg-(--muted)/40 disabled:cursor-not-allowed disabled:opacity-50'

export const Anime1DataPanel: FC = () => {
  const { data } = useAnime1EpisodeQuery()
  const { data: categoryState } = useAnime1CategoriesQuery()
  const refetchEpisodes = useAnime1EpisodeRefetch()
  const refetchCategories = useAnime1CategoriesRefetch()
  const [status, setStatus] = useState<Status | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Strip the derived fields added by the query, only the stored shape is exported
  const episodes = useMemo<StorageAnime1Episode[]>(() => {
    return Object.values(data ?? {}).map(episode => ({
      id: episode.id,
      categoryId: episode.categoryId,
      title: episode.title,
      currentTime: episode.currentTime,
      duration: episode.duration,
      updatedAt: episode.updatedAt,
      finished: episode.finished,
    }))
  }, [data])

  const summary = useMemo(() => summarizeEpisodes(episodes), [episodes])
  const archivedCount = Object.values(categoryState ?? {})
    .filter(category => category.archivedAt != null)
    .length

  // Kept synchronous on purpose: the download has to start within the click's
  // user activation, so it cannot wait on an async storage read first
  const handleExport = () => {
    if (episodes.length === 0)
      return
    downloadJsonFile(
      progressFileName(),
      createProgressFile(episodes, Object.values(categoryState ?? {}), browser.runtime.getManifest().version),
    )
    setStatus({ type: 'success', message: `已导出 ${episodes.length} 集进度` })
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so that picking the same file again still fires a change event
    event.target.value = ''
    if (!file)
      return

    setIsBusy(true)
    try {
      const imported = parseProgressFile(await file.text())
      const stored = await storageAnime1Episodes.getValue()
      const merged = mergeEpisodes(stored, imported.episodes)
      await storageAnime1Episodes.setValue(merged.episodes)
      const storedCategories = await storageAnime1Categories.getValue()
      const mergedCategories = mergeCategories(storedCategories, imported.categories)
      await storageAnime1Categories.setValue(mergedCategories.categories)
      await Promise.all([refetchEpisodes(), refetchCategories()])
      const archivedSuffix = mergedCategories.added > 0 ? ` · 废弃 ${mergedCategories.added} 部` : ''
      setStatus({
        type: 'success',
        message: `新增 ${merged.added} 集 · 更新 ${merged.updated} 集 · 跳过 ${merged.skipped} 集${archivedSuffix}`,
      })
    }
    catch (error) {
      console.error('[Enhanced Anime1] Import failed', error)
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '导入失败',
      })
    }
    finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="p-3 space-y-5">
      <section>
        <h4 className="mb-2 text-xs font-medium text-(--muted-text)">当前进度</h4>
        <div className="rounded-md border p-3">
          <p className="text-sm text-(--text)">
            追番
            {' '}
            <span className="font-medium">{summary.categoryCount}</span>
            {' '}
            部 · 记录
            {' '}
            <span className="font-medium">{summary.episodeCount}</span>
            {' '}
            集
          </p>
          <p className="mt-1 text-xs text-(--muted-text)">
            {summary.lastUpdatedAt === null
              ? '还没有任何观看记录，看一集就会自动记录'
              : `最后更新：${formatRelativeTime(summary.lastUpdatedAt)}`}
            {archivedCount > 0 && ` · 已废弃 ${archivedCount} 部`}
          </p>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-medium text-(--muted-text)">导出</h4>
        <p className="mb-2 text-xs text-(--muted-text)">
          把全部观看进度保存为 JSON 文件，换设备或换浏览器时导入即可恢复。
        </p>
        <button
          type="button"
          className={actionButtonClass}
          disabled={!data || episodes.length === 0}
          onClick={handleExport}
        >
          导出为 JSON
        </button>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-medium text-(--muted-text)">导入</h4>
        <p className="mb-2 text-xs text-(--muted-text)">
          选择之前导出的文件，与当前进度合并。同一集保留较新的记录，不会删除现有数据。
        </p>
        <button
          type="button"
          className={actionButtonClass}
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          选择文件导入
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImport}
        />
      </section>

      {status && (
        <p
          className={
            status.type === 'success'
              ? 'text-xs text-emerald-600 dark:text-emerald-400'
              : 'text-xs text-red-600 dark:text-red-400'
          }
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
