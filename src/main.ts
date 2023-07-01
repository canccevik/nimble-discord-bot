import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { YouTubeService } from './modules/youtube/youtube.service'
import { createServer } from 'http'
import { Config, ENV } from './config'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)

  const config = app.get<Config>(ENV)
  createServer((_, res) => res.end()).listen(config.PORT)

  const youtubeService = app.get<YouTubeService>(YouTubeService)
  await youtubeService.fetchAndCreateQuestions()
}
bootstrap()
