import { Inject, Injectable } from '@nestjs/common'
import { InjectDiscordClient, On } from '@discord-nestjs/core'
import { Client } from 'discord.js'
import { Config, ENV } from '../../config'

@Injectable()
export class BotGateway {
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    @Inject(ENV) private readonly config: Config
  ) {}

  @On('ready')
  public onReady(): void {
    this.client.login(this.config.BOT_TOKEN)
  }
}
