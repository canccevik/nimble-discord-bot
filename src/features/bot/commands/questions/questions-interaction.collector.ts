import * as play from 'play-dl'
import { Inject, Injectable, Scope } from '@nestjs/common'
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice'
import { Filter, InjectCauseEvent, InteractionEventCollector, On } from '@discord-nestjs/core'
import { BaseQuestionsCommand } from './base-questions.command'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { Question } from '../../../../modules/database/schemas'
import {
  LISTEN_BUTTON,
  STOP_BUTTON,
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

let selectedQuestionId = ''

@Injectable({ scope: Scope.REQUEST })
@InteractionEventCollector({})
export class QuestionsInteractionCollector {
  private interactionHandlers = {
    [SELECTION_MENU]: this.handleSelectMenuInteraction.bind(this),
    [WATCH_BUTTON]: this.handleWatchButtonInteraction.bind(this),
    [LISTEN_BUTTON]: this.handleListenButtonInteraction.bind(this),
    [STOP_BUTTON]: this.handleStopButtonInteraction.bind(this),
    [NEXT_PAGE_BUTTON]: this.handleNextPageButtonInteraction.bind(this),
    [PREVIOUS_PAGE_BUTTON]: this.handlePreviousPageButtonInteraction.bind(this)
  }

  constructor(
    @InjectCauseEvent()
    private readonly causeInteraction: ChatInputCommandInteraction,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    private readonly baseQuestionsCommand: BaseQuestionsCommand,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger
  ) {}

  @Filter()
  public filter(interaction: StringSelectMenuInteraction | ButtonInteraction): boolean {
    return this.causeInteraction.channelId === interaction.message.channelId
  }

  @On('collect')
  public async onCollect(
    interaction: StringSelectMenuInteraction | ButtonInteraction
  ): Promise<void> {
    await this.interactionHandlers[interaction.customId](interaction)
  }

  private async handleSelectMenuInteraction(
    interaction: StringSelectMenuInteraction
  ): Promise<void> {
    selectedQuestionId = interaction.values[0]
    const selectedQuestion = await this.questionModel.findById(selectedQuestionId)

    this.logger.log(`${interaction.user.username} selected a question: "${selectedQuestion.title}"`)

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

    await interaction.reply({
      content: `Seçilen soru: **${selectedQuestion.title}** \n\nBir aksiyon seçin:`,
      components: [buttonRow],
      ephemeral: true
    })
  }

  private async handleWatchButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    this.logger.log(`${interaction.user.username} clicked to watch button`)

    const selectedQuestion = await this.questionModel.findById(selectedQuestionId)
    const videoLink = `https://www.youtube.com/watch?v=${selectedQuestion.videoId}&t=${selectedQuestion.startTime.minute}m${selectedQuestion.startTime.second}s`

    await interaction.reply({
      content: `Şu sorunun yanıtını aşağıdan izleyebilirsin: **${selectedQuestion.title}** \n\n${videoLink}`,
      ephemeral: true
    })
  }

  private async handleListenButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    this.logger.log(`${interaction.user.username} clicked to listen button`)

    if (!(interaction.member as GuildMember).voice.channelId) {
      await interaction.reply({
        content: `Sorunun yanıtını dinleyebilmek için bir ses kanalına katılmalısın!`,
        ephemeral: true
      })
      return
    }

    const selectedQuestion = await this.questionModel.findById(selectedQuestionId)

    const startTimeInSeconds =
      Number(selectedQuestion.startTime.minute) * 60 + Number(selectedQuestion.startTime.second)
    const endTimeInMilliseconds =
      Number(selectedQuestion.endTime.minute) * 60000 +
      Number(selectedQuestion.endTime.second) * 1000
    const answerTimeInMilliseconds = endTimeInMilliseconds - startTimeInSeconds * 1000

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

    if (answerTimeInMilliseconds) {
      setTimeout(() => {
        if (voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

        player.stop(true)
        voiceConnection.destroy()
      }, answerTimeInMilliseconds)
    }

    const stopButton = new ButtonBuilder()
      .setCustomId(STOP_BUTTON)
      .setLabel('Durdur')
      .setStyle(ButtonStyle.Danger)

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      stopButton
    )

    await interaction.reply({
      content: `Şu sorunun yanıtı ses kanalında oynatılıyor: **${selectedQuestion.title}** \n\n${
        !selectedQuestion.endTime.minute || !selectedQuestion.endTime.second
          ? '🚨 Uyarı: Bu sorunun bitiş süresi bulunamadı. Ses video bitene kadar oynamaya devam edecek.'
          : ''
      }`,
      ephemeral: true,
      components: [buttonRow]
    })
  }

  private async handleStopButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    this.logger.log(`${interaction.user.username} clicked to stop button`)

    const voiceConnection = getVoiceConnection(interaction.guildId)

    if (!voiceConnection) {
      await interaction.reply({
        content: `Zaten bir ses kanalında değilim!`,
        ephemeral: true
      })
      return
    }

    if (voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return

    voiceConnection.destroy()

    await interaction.reply({
      content: 'Ses kanalından ayrıldım!',
      ephemeral: true
    })
  }

  public async handleNextPageButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    await this.baseQuestionsCommand.run(interaction, { addToCurrentPage: 1 })
  }

  public async handlePreviousPageButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    await this.baseQuestionsCommand.run(interaction, { addToCurrentPage: -1 })
  }
}
