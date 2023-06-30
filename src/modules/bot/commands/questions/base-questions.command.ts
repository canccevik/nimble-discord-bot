import { Injectable } from '@nestjs/common'
import { Param, ParamType } from '@discord-nestjs/core'
import { Question } from '../../../question/interfaces'
import { QuestionService } from '../../../question/question.service'
import {
  NEXT_PAGE_BUTTON,
  PREVIOUS_PAGE_BUTTON,
  QUESTION_COUNT_PER_PAGE,
  SELECTION_MENU
} from './constants'
import {
  APIEmbedField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  MessageComponentInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js'

export class QuestionsDto {
  @Param({
    name: 'anahtar_kelime',
    description: 'Soruları filtrelemek için kullanılacak anahtar kelime.',
    type: ParamType.STRING
  })
  public searchKeyword: string
}

@Injectable()
export class BaseQuestionsCommand {
  private currentPage = 0
  private searchKeyword = ''

  constructor(private readonly questionService: QuestionService) {}

  public async run(
    interaction: MessageComponentInteraction | CommandInteraction,
    options?: { searchKeyword?: string; addToCurrentPage?: number }
  ): Promise<void> {
    if (options.searchKeyword) this.searchKeyword = options.searchKeyword
    if (options.addToCurrentPage) this.currentPage += options.addToCurrentPage

    if (!interaction.deferred) {
      await interaction.deferReply()
    }

    const { questions, totalResultCount } = this.questionService.getQuestionsByPage({
      count: QUESTION_COUNT_PER_PAGE,
      page: this.currentPage,
      searchKeyword: this.searchKeyword
    })

    if (this.searchKeyword && totalResultCount === 0) {
      await interaction.editReply(`**${this.searchKeyword}** için bir sonuç bulunamadı!`)
    }

    const embed = this.buildEmbed(questions, this.currentPage, totalResultCount)
    const buttonRow = this.buildButtonRow(this.currentPage, questions.length, totalResultCount)
    const selectionRow = this.buildSelectionRow(questions)

    await interaction.editReply({
      embeds: [embed],
      components: [buttonRow, selectionRow]
    })
  }

  public resetCurrentPage(): void {
    this.currentPage = 0
  }

  private buildEmbed(questions: Question[], page: number, totalResultCount: number): EmbedBuilder {
    const embedContent: APIEmbedField[] = questions.map((question, i) => {
      const { start, end } = question.time
      return {
        name: `**${page * QUESTION_COUNT_PER_PAGE + i + 1}.** ${question.title}`,
        value: `> ${start.minute}:${start.second}-${end ? `${end?.minute}:${end?.second}` : '???'}`
      }
    })

    return new EmbedBuilder()
      .addFields(...embedContent)
      .setTitle(`Bir soru seçin`)
      .setFooter({
        text: `${totalResultCount} soru içerisinden ${page * QUESTION_COUNT_PER_PAGE + 1}-${
          page * QUESTION_COUNT_PER_PAGE + questions.length
        } aralığı gösteriliyor.`
      })
  }

  private buildButtonRow(
    page: number,
    questionCount: number,
    totalResultCount: number
  ): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const previousPageButton = new ButtonBuilder()
      .setCustomId(PREVIOUS_PAGE_BUTTON)
      .setLabel('Geri')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(this.currentPage <= 0)

    const nextPageButton = new ButtonBuilder()
      .setCustomId(NEXT_PAGE_BUTTON)
      .setLabel('İleri')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(totalResultCount === page * QUESTION_COUNT_PER_PAGE + questionCount)

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      previousPageButton,
      nextPageButton
    )
  }

  private buildSelectionRow(
    questions: Question[]
  ): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const select = new StringSelectMenuBuilder()
      .setCustomId(SELECTION_MENU)
      .setPlaceholder('Seçim yap')
      .addOptions(
        ...questions.map((question) => {
          const title = question.title.slice(0, 100)
          return new StringSelectMenuOptionBuilder().setLabel(title).setValue(question.id)
        })
      )

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select)
  }
}
