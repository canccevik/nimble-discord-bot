import { Injectable, Inject } from '@nestjs/common'
import { GatewayIntentBits } from 'discord.js'
import { DiscordOptionsFactory, DiscordModuleOption } from '@discord-nestjs/core'
import { Config, ENV } from '@config/index'

@Injectable()
export class DiscordConfigService implements DiscordOptionsFactory {
  constructor(@Inject(ENV) private readonly config: Config) {}

  public createDiscordOptions(): DiscordModuleOption {
    return {
      token: this.config.BOT_TOKEN,
      discordClientOptions: {
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
      },
      failOnLogin: true
    }
  }
}
