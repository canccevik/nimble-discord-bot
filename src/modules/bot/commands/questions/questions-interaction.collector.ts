import * as play from 'play-dl'
import { Injectable, Scope } from '@nestjs/common'
import { joinVoiceChannel } from '@discordjs/voice'
import { Filter, InjectCauseEvent, InteractionEventCollector, On } from '@discord-nestjs/core'
import { BaseQuestionsCommand } from './base-questions.command'
import { InjectModel } from '@nestjs/mongoose'
import { Question } from 'src/modules/database/schemas'
import { Model } from 'mongoose'
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

let selectedQuestionId = ''

@Injectable({ scope: Scope.REQUEST })
@InteractionEventCollector({})
export class QuestionsInteractionCollector {
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
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    private readonly baseQuestionsCommand: BaseQuestionsCommand
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
    if (!interaction.isStringSelectMenu()) return

    selectedQuestionId = interaction.values[0]
    const selectedQuestion = await this.questionModel.findById(selectedQuestionId)

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
      content: `Seçilen soru: **${selectedQuestion.title}** \n\nBir aksiyon seçin <@${interaction.user.id}>:`,
      components: [buttonRow],
      embeds: []
    })
  }

  private async handleWatchButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.isButton()) return

    const selectedQuestion = await this.questionModel.findById(selectedQuestionId)
    const videoLink = `https://www.youtube.com/watch?v=${selectedQuestion.videoId}&t=${selectedQuestion.startTime.minute}m${selectedQuestion.startTime.second}s`

    await interaction.reply({
      content: `Şu sorunun yanıtını aşağıdan izleyebilirsin <@${interaction.user.id}>: **${selectedQuestion.title}** \n\n${videoLink}`,
      components: [],
      embeds: []
    })
  }

  private async handleListenButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.isButton()) return

    if (!(interaction.member as GuildMember).voice.channelId) {
      await interaction.reply({
        content: `Sorunun yanıtını dinleyebilmek için bir ses kanalına katılmalısın! <@${interaction.user.id}>`,
        components: [],
        embeds: []
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

    await interaction.reply({
      content: `<@${interaction.user.id}> için şu sorunun yanıtı oynatılıyor: **${
        selectedQuestion.title
      }** \n\n${
        !selectedQuestion.endTime
          ? '🚨 Uyarı: Bu sorunun bitiş süresi bulunamadı. Ses video bitene kadar oynamaya devam edecek.'
          : ''
      }`,
      components: [],
      embeds: []
    })
  }

  public async handleNextPageButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.isButton()) return
    await this.baseQuestionsCommand.run(interaction, { addToCurrentPage: 1 })
  }

  public async handlePreviousPageButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.isButton()) return
    await this.baseQuestionsCommand.run(interaction, { addToCurrentPage: -1 })
  }
}
