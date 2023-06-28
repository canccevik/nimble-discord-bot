import { Module } from '@nestjs/common'
import { DiscordModule as DiscordModuleHost } from '@discord-nestjs/core'
import { DiscordConfigService } from './discord-config.service'

@Module({
  imports: [
    DiscordModuleHost.forRootAsync({
      useClass: DiscordConfigService
    })
  ]
})
export class DiscordModule {}
