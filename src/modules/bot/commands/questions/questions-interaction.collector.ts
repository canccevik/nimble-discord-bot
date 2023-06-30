import * as play from 'play-dl'
import { Injectable, Scope } from '@nestjs/common'
import { joinVoiceChannel } from '@discordjs/voice'
import { Filter, InjectCauseEvent, InteractionEventCollector, On } from '@discord-nestjs/core'
import { QuestionService } from '../../../question/question.service'
import { BaseQuestionsCommand } from './base-questions.command'
import {
  LISTEN_BUTTON,
  NEXT_PAGE_BUTTON,
  PREVIOUS_PAGE_BUTTON,
  SELECTION_MENU,
  WATCH_BUTTON
} from './constants'
import {
  createAudioResource,
  createAudioPlayer,
  NoSubscriberBehavior,
  VoiceConnectionStatus
} from '@discordjs/voice'
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
@InteractionEventCollector({})
export class QuestionsInteractionCollector {
  private selectedQuestionId: string

  private interactionHandlers = {
    [SELECTION_MENU]: this.handleSelectMenuInteraction.bind(this),
    [WATCH_BUTTON]: this.handleWatchButtonInteraction.bind(this),
    [LISTEN_BUTTON]: this.handleListenButtonInteraction.bind(this),
    [NEXT_PAGE_BUTTON]: this.handleNextPageButtonInteraction.bind(this),
    [PREVIOUS_PAGE_BUTTON]: this.handlePreviousPageButtonInteraction.bind(this)
  }

  constructor(
    @InjectCauseEvent()
    private readonly causeInteraction: ChatInputCommandInteraction,
    private readonly baseQuestionsCommand: BaseQuestionsCommand,
    private readonly questionService: QuestionService
  ) {}

  @Filter()
  public filter(interaction: StringSelectMenuInteraction | ButtonInteraction): boolean {
    return this.causeInteraction.channelId === interaction.message.channelId
  }

  @On('collect')
  public async onCollect(
    interaction: StringSelectMenuInteraction | ButtonInteraction
  ): Promise<void> {
    if (!interaction.deferred) {
      await interaction.deferUpdate()
    }
    await this.interactionHandlers[interaction.customId](interaction)
  }

  private async handleSelectMenuInteraction(
    interaction: StringSelectMenuInteraction
  ): Promise<void> {
    this.selectedQuestionId = interaction.values[0]

    const watchButton = new ButtonBuilder()
      .setCustomId(WATCH_BUTTON)
      .setLabel('İzle')
      .setStyle(ButtonStyle.Primary)

    const listenButton = new ButtonBuilder()
      .setCustomId(LISTEN_BUTTON)
      .setLabel('Dinle')
      .setStyle(ButtonStyle.Success)

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      watchButton,
      listenButton
    )

    await interaction.editReply({
      content: 'Bir aksiyon seçin:',
      components: [buttonRow],
      embeds: []
    })
  }

  private async handleWatchButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const selectedQuestion = this.questionService.getQuestionById(this.selectedQuestionId)
    const videoLink = `https://www.youtube.com/watch?v=${selectedQuestion.videoId}&t=${selectedQuestion.time.start.minute}m${selectedQuestion.time.start.second}s`

    await interaction.editReply({
      content: `Şu sorunun yanıtını aşağıdan izleyebilirsiniz: **${selectedQuestion.title}** \n\n${videoLink}`,
      components: [],
      embeds: []
    })
  }

  private async handleListenButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!(interaction.member as GuildMember).voice.channelId) {
      await interaction.editReply({
        content: `Sorunun yanıtını dinleyebilmek için bir ses kanalına katılmalısın! <@${interaction.user.id}>`,
        components: [],
        embeds: []
      })
      return
    }

    const selectedQuestion = this.questionService.getQuestionById(this.selectedQuestionId)

    const startTimeInSeconds =
      Number(selectedQuestion.time.start.minute) * 60 + Number(selectedQuestion.time.start.second)
    const endTimeInMiliseconds =
      Number(selectedQuestion.time.end?.minute) * 60000 +
      Number(selectedQuestion.time.end?.second) * 1000
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

    if (answerTimeInMiliseconds) {
      setTimeout(() => {
        if (voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

        player.stop(true)
        voiceConnection.destroy()
      }, answerTimeInMiliseconds)
    }

    await interaction.editReply({
      content: `Şu sorunun yanıtı oynatılıyor: **${selectedQuestion.title}** \n\n${
        !selectedQuestion.time.end
          ? '🚨 Uyarı: Bu sorunun bitiş süresi bulunamadı. Ses video bitene kadar oynamaya devam edecek.'
          : ''
      }`,
      components: [],
      embeds: []
    })
  }

  public async handleNextPageButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    await this.baseQuestionsCommand.run(interaction, { addToCurrentPage: 1 })
  }

  public async handlePreviousPageButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    await this.baseQuestionsCommand.run(interaction, { addToCurrentPage: -1 })
  }
}
