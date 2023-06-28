import { Module } from '@nestjs/common'
import { DiscordModule } from '@discord-nestjs/core'
import { commands } from './commands'
import { QuestionModule } from '../question/question.module'

@Module({
  imports: [DiscordModule.forFeature(), QuestionModule],
  providers: [...commands]
})
export class BotModule {}
