import { Module } from '@nestjs/common'
import { DiscordModule } from '@discord-nestjs/core'
import { commands } from './commands'
import { DatabaseModule } from '../database/database.module'

@Module({
  imports: [DiscordModule.forFeature(), DatabaseModule],
  providers: [...commands]
})
export class BotModule {}
