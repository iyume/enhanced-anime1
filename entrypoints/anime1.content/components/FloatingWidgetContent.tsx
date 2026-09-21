import type { FC } from 'react'
import { Anime1DataPanel } from './anime1-data-panel'
import { Anime1WatchBoard } from './anime1-watch-board'
import Tabs from './ui/tabs/Tabs'
import TabsContent from './ui/tabs/TabsContent'
import TabsList from './ui/tabs/TabsList'
import TabsTrigger from './ui/tabs/TabsTrigger'

const FloatWidgetContent: FC = () => {
  return (
    <div className="p-2 bg-(--background) text-(--text)">
      <Tabs className="flex flex-col h-[calc(100vh-1rem)]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="board">追番看板</TabsTrigger>
          <TabsTrigger value="data">数据</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="flex-grow overflow-y-auto">
          <Anime1WatchBoard />
        </TabsContent>
        <TabsContent value="data" className="flex-grow overflow-y-auto">
          <Anime1DataPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FloatWidgetContent
