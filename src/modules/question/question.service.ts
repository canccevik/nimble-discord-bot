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

  public getQuestionsByPage(options: { page: number; count: number; searchKeyword: string }): {
    totalResultCount: number
    questions: Question[]
  } {
    const results = options.searchKeyword
      ? questions.filter((question) =>
          question.title.toLowerCase().includes(options.searchKeyword.toLowerCase())
        )
      : questions

    const filteredQuestions = results.slice(
      options.page * options.count,
      options.page * options.count + options.count
    )

    return {
      totalResultCount: results.length || 0,
      questions: filteredQuestions
    }
  }

  public getQuestionById(id: string): Question {
    return questions.find((question) => question.id === id)
  }
}
