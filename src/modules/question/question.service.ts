import { Injectable } from '@nestjs/common'
import { YouTubeService } from './youtube.service'
import { Question } from './interfaces'
import * as fs from 'fs'
import * as questions from '../../../questions.json'

@Injectable()
export class QuestionService {
  constructor(private readonly youtubeService: YouTubeService) {}

  public async createQuestionsFile(forceToCreate = false): Promise<void> {
    const filePath = __dirname + '../../../questions.json'

    if (!forceToCreate && fs.existsSync(filePath)) return

    const questions = await this.youtubeService.qetQuestions()
    fs.appendFileSync(filePath, `${JSON.stringify(questions)}`)
  }

  public getQuestionsByPage(page: number, count: number): Question[] {
    return questions.slice(page * count, page * count + count) as unknown as Question[]
  }

  public getQuestionCount(): number {
    return questions.length || 0
  }
}
