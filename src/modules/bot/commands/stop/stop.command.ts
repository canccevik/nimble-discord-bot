import { Command, Handler, InteractionEvent } from '@discord-nestjs/core'
import { Interaction } from 'discord.js'
import { VoiceConnectionStatus, getVoiceConnection } from '@discordjs/voice'

@Command({
  name: 'durdur',
  description: 'Botun oynattığı sesi durdurur.'
})
export class StopCommand {
  @Handler()
  public run(@InteractionEvent() interaction: Interaction): string {
    const voiceConnection = getVoiceConnection(interaction.guildId)

    if (!voiceConnection) {
      return `Zaten bir ses kanalında değilim! <@${interaction.user.id}>`
    }

    if (voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

    voiceConnection.destroy()

    return 'Ses kanalından ayrıldım!'
  }
}
