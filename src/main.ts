import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { YouTubeService } from './modules/youtube/youtube.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)

  const youtubeService = app.get<YouTubeService>(YouTubeService)

  await youtubeService.fetchAndCreateQuestions()
}
bootstrap()
