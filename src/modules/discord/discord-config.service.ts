import { Injectable, Inject } from '@nestjs/common'
import { GatewayIntentBits } from 'discord.js'
import { DiscordOptionsFactory, DiscordModuleOption } from '@discord-nestjs/core'
import { Config, ENV } from '../../config'

@Injectable()
export class DiscordConfigService implements DiscordOptionsFactory {
  constructor(@Inject(ENV) private readonly config: Config) {}

  public createDiscordOptions(): DiscordModuleOption {
    return {
      token: this.config.BOT_TOKEN,
      discordClientOptions: {
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildVoiceStates
        ]
      },
      failOnLogin: true
    }
  }
}
