import { Injectable } from '@nestjs/common'
import { YouTubeService } from './youtube.service'
import * as fs from 'fs'

@Injectable()
export class QuestionService {
  constructor(private readonly youtubeService: YouTubeService) {}

  public async createQuestionsFile(): Promise<void> {
    const questions = await this.youtubeService.qetQuestions()
    const filePath = __dirname + '/questions.json'

    fs.appendFileSync(filePath, JSON.stringify(questions))
  }
}
