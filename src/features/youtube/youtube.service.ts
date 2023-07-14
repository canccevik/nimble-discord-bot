import { Config, ENV } from '../../config'
import { Inject, Injectable } from '@nestjs/common'
import { VideoIdListResponse, VideoListResponse } from './interfaces'
import axios from 'axios'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Question } from '../../modules/database/schemas'

@Injectable()
export class YouTubeService {
  constructor(
    @Inject(ENV) private readonly config: Config,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>
  ) {}

  public async fetchAndCreateQuestions(): Promise<void> {
    const questionCount = await this.questionModel.find().count()

    if (questionCount > 0) return

    const videoIdList = await this.getVideoIdList()
    const questions: Question[] = []

    for (let i = 0; i < videoIdList.length; i += 49) {
      const idParameters = videoIdList.slice(i, i + 49).join('&id=')
      let data: VideoListResponse

      try {
        const response = await axios.get<VideoListResponse>(
          `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${idParameters}&key=${this.config.YOUTUBE_API_KEY}`
        )
        data = response.data
      } catch (error) {
        throw new Error(JSON.stringify(error.response.data.error, null, 2))
      }

      data.items.forEach((item) => {
        const pattern = /(.*?)\(([0-9]{2}):([0-9]{2})\)/gm
        const { description } = item.snippet
        const lines = [...description.matchAll(pattern)]

        lines.forEach(async (line, i) => {
          let title = line[1].trim()

          if (title.startsWith('-')) {
            title = title.slice(1).trim()
          }

          const startTime = { minute: line[2], second: line[3] }
          const endTime = lines[i + 1] ? { minute: lines[i + 1][2], second: lines[i + 1][3] } : null

          questions.push({ title, endTime, startTime, videoId: item.id })
        })
      })
    }
    await this.questionModel.insertMany(questions)
  }

  private async getVideoIdList(): Promise<string[]> {
    const videoIdList: string[] = []
    let pageToken: string | null = null

    do {
      try {
        const { data } = await axios.get<VideoIdListResponse>(
          `https://youtube.googleapis.com/youtube/v3/search?channelId=${
            this.config.YOUTUBE_CHANNEL_ID
          }&maxResults=50&order=date&type=video&key=${this.config.YOUTUBE_API_KEY}${
            pageToken ? `&pageToken=${pageToken}` : ''
          }`
        )

        const videoIds = data.items.map((item) => item.id.videoId)
        videoIdList.push(...videoIds)

        pageToken = data.nextPageToken
      } catch (error) {
        throw new Error(JSON.stringify(error.response.data.error, null, 2))
      }
    } while (pageToken)

    return videoIdList
  }
}
