import { Injectable, Scope } from '@nestjs/common'
import { Filter, InjectCauseEvent, InteractionEventCollector, On } from '@discord-nestjs/core'
import { QuestionService } from '../../../question/question.service'
import {
  createAudioResource,
  createAudioPlayer,
  NoSubscriberBehavior,
  VoiceConnectionStatus
} from '@discordjs/voice'
import { joinVoiceChannel } from '@discordjs/voice'
import * as play from 'play-dl'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
  MessageActionRowComponentBuilder,
  StringSelectMenuInteraction
} from 'discord.js'

@Injectable({ scope: Scope.REQUEST })
@InteractionEventCollector({ time: 15000 })
export class QuestionsInteractionCollector {
  private selectedQuestionId: string

  constructor(
    @InjectCauseEvent()
    private readonly causeInteraction: ChatInputCommandInteraction,
    private readonly questionService: QuestionService
  ) {}

  @Filter()
  public filter(interaction: StringSelectMenuInteraction): boolean {
    return this.causeInteraction.id === interaction.message.interaction.id
  }

  @On('collect')
  public async onCollect(
    interaction: StringSelectMenuInteraction | ButtonInteraction
  ): Promise<void> {
    if (interaction.isStringSelectMenu()) {
      return this.handleSelectMenuInteraction(interaction)
    }

    if (interaction.customId === 'watch-button') {
      return this.handleWatchButtonInteraction(interaction)
    }

    if (
      interaction.customId === 'listen-button' &&
      (interaction.member as GuildMember).voice.channelId
    ) {
      return this.handleListenButtonInteraction(interaction)
    } else {
      await interaction.reply({
        content: `Sorunun yanıtını dinleyebilmek için bir ses kanalına katılmalısın! <@${interaction.user.id}>`
      })
    }
  }

  private async handleSelectMenuInteraction(
    interaction: StringSelectMenuInteraction
  ): Promise<void> {
    this.selectedQuestionId = interaction.values[0]

    const watchButton = new ButtonBuilder()
      .setCustomId('watch-button')
      .setLabel('İzle')

      .setStyle(ButtonStyle.Primary)

    const listenButton = new ButtonBuilder()
      .setCustomId('listen-button')
      .setLabel('Dinle')
      .setStyle(ButtonStyle.Success)

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      watchButton,
      listenButton
    )

    await interaction.update({
      content: 'Bir aksiyon seçin:',
      components: [buttonRow],
      embeds: []
    })
  }

  private async handleWatchButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const selectedQuestion = this.questionService.getQuestionById(this.selectedQuestionId)
    const videoLink = `https://www.youtube.com/watch?v=${selectedQuestion.videoId}&t=${selectedQuestion.time.start.minute}m${selectedQuestion.time.start.second}s`

    await interaction.reply({
      content: `Şu sorunun yanıtını aşağıdan izleyebilirsiniz: **${selectedQuestion.title}** \n\n${videoLink}`,
      components: []
    })
  }

  private async handleListenButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const selectedQuestion = this.questionService.getQuestionById(this.selectedQuestionId)

    const startTimeInSeconds =
      Number(selectedQuestion.time.start.minute) * 60 + Number(selectedQuestion.time.start.second)
    const endTimeInMiliseconds =
      Number(selectedQuestion.time.end.minute) * 60000 +
      Number(selectedQuestion.time.end.second) * 1000
    const answerTimeInMiliseconds = endTimeInMiliseconds - startTimeInSeconds * 1000

    const voiceConnection = joinVoiceChannel({
      channelId: (interaction.member as GuildMember).voice.channelId,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator
    })

    const stream = await play.stream(
      `https://www.youtube.com/watch?v=${selectedQuestion.videoId}`,
      { seek: startTimeInSeconds }
    )
    const resource = createAudioResource(stream.stream, { inputType: stream.type })
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    })

    player.play(resource)
    voiceConnection.subscribe(player)

    setTimeout(() => {
      if (voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

      player.stop(true)
      voiceConnection.destroy()
    }, answerTimeInMiliseconds)

    await interaction.reply({
      content: `Şu sorunun yanıtı oynatılıyor: **${selectedQuestion.title}** \n\n${
        !selectedQuestion.time.end
          ? '🚨 Uyarı: Bu sorunun bitiş süresi bulunamadı. Ses video bitene kadar oynamaya devam edecek.'
          : ''
      }`
    })
  }
}
