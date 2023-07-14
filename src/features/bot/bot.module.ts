import { Module } from '@nestjs/common'
import { DiscordModule } from '@discord-nestjs/core'
import { commands } from './commands'
import { BotGateway } from './bot.gateway'
import { DatabaseModule } from 'src/modules/database/database.module'

@Module({
  imports: [DiscordModule.forFeature(), DatabaseModule],
  providers: [BotGateway, ...commands]
})
export class BotModule {}
