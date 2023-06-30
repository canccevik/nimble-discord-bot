export interface VideoIdListResponse {
  nextPageToken: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: {
    id: {
      videoId: string
    }
  }[]
}
