import { Command, Handler, InteractionEvent } from '@discord-nestjs/core'
import { Interaction, InteractionReplyOptions } from 'discord.js'
import { VoiceConnectionStatus, getVoiceConnection } from '@discordjs/voice'

@Command({
  name: 'durdur',
  description: 'Botun oynattığı sesi durdurur.'
})
export class StopCommand {
  @Handler()
  public run(@InteractionEvent() interaction: Interaction): InteractionReplyOptions {
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
