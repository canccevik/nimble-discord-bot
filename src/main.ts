import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { QuestionService } from './modules/question/question.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)

  const questionService = app.get<QuestionService>(QuestionService)

  await questionService.createQuestionsFile()
}
bootstrap()
