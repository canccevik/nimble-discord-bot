import { Module } from '@nestjs/common'
import { BotModule } from './bot/bot.module'
import { YouTubeModule } from './youtube/youtube.module'

@Module({
  imports: [BotModule, YouTubeModule]
})
export class FeaturesModule {}
