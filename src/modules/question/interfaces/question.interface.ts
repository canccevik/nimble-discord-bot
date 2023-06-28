export interface Question {
  videoId: string
  title: string
  time: {
    start: {
      minute: string
      second: string
    }
    end?: {
      minute: string
      second: string
    }
  }
}
