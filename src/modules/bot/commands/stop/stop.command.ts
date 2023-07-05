import { Command, Handler, InteractionEvent } from '@discord-nestjs/core'
import { Interaction, InteractionReplyOptions } from 'discord.js'
import { VoiceConnectionStatus, getVoiceConnection } from '@discordjs/voice'
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { Inject } from '@nestjs/common'

@Command({
  name: 'durdur',
  description: 'Botun oynattığı sesi durdurur.'
})
export class StopCommand {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger) {}

  @Handler()
  public run(@InteractionEvent() interaction: Interaction): InteractionReplyOptions {
    this.logger.log(`Stop command used by "${interaction.user.username}"`)

    const voiceConnection = getVoiceConnection(interaction.guildId)

    if (!voiceConnection) {
      return {
        content: `Zaten bir ses kanalında değilim!`,
        ephemeral: true
      }
    }

    if (voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

    voiceConnection.destroy()

    return {
      content: 'Ses kanalından ayrıldım!',
      ephemeral: true
    }
  }
}
