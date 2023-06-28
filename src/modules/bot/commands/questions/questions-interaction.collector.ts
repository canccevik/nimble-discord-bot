import { Injectable, Scope } from '@nestjs/common'
import { Filter, InjectCauseEvent, InteractionEventCollector, On } from '@discord-nestjs/core'
import { QuestionService } from '../../../question/question.service'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
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
      this.selectedQuestionId = interaction.values[0]

      const buttonRow = this.buildButtonRow()

      await interaction.update({
        content: 'Bir aksiyon seçin:',
        components: [buttonRow],
        embeds: []
      })
      return
    }

    const selectedQuestion = this.questionService.getQuestionById(this.selectedQuestionId)

    if (interaction.customId === 'watch-button') {
      const videoLink = `https://www.youtube.com/watch?v=${selectedQuestion.videoId}&t=${selectedQuestion.time.start.minute}m${selectedQuestion.time.start.second}s`

      await interaction.reply({
        content: videoLink,
        components: []
      })
    }
  }

  private buildButtonRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const watchButton = new ButtonBuilder()
      .setCustomId('watch-button')
      .setLabel('İzle')
      .setStyle(ButtonStyle.Primary)

    const listenButton = new ButtonBuilder()
      .setCustomId('listen-button')
      .setLabel('Dinle')
      .setStyle(ButtonStyle.Success)

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      watchButton,
      listenButton
    )
  }
}
