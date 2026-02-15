declare module 'bangumi-data' {
  const data: {
    siteMeta?: {
      bangumi?: {
        urlTemplate?: string
      }
    }
    items: Array<{
      title: string
      titleTranslate?: Record<string, string[]>
      sites: Array<{ site: string; id: string }>
    }>
  }
  export default data
}
