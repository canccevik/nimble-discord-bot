import { Module } from '@nestjs/common'
import { DiscordModule } from '@discord-nestjs/core'
import { commands } from './commands'
import { DatabaseModule } from '../database/database.module'
import { BotGateway } from './bot.gateway'

@Module({
  imports: [DiscordModule.forFeature(), DatabaseModule],
  providers: [BotGateway, ...commands]
})
export class BotModule {}
