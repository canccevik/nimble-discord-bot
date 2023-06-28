import { Module } from '@nestjs/common'
import { EnvalidModule } from 'nestjs-envalid'
import { validators } from '../config'
import { DiscordModule } from './discord/discord.module'
import { BotModule } from './bot/bot.module'
import { QuestionModule } from './question/question.module'

@Module({
  imports: [
    EnvalidModule.forRoot({
      validators,
      useDotenv: true,
      isGlobal: true
    }),
    DiscordModule,
    BotModule,
    QuestionModule
  ]
})
export class AppModule {}
