import { Inject, Injectable } from '@nestjs/common'
import { Param, ParamType } from '@discord-nestjs/core'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston'
import { Question, QuestionDocument } from '../../../../modules/database/schemas'
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

  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger
  ) {}

  public async run(
    interaction: MessageComponentInteraction | CommandInteraction,
    options?: { searchKeyword?: string; addToCurrentPage?: number }
  ): Promise<void> {
    if (options.searchKeyword) this.searchKeyword = options.searchKeyword
    if (options.addToCurrentPage) this.currentPage += options.addToCurrentPage

    this.logger.log(
      `Questions command used by "${interaction.user.username}" for page "${this.currentPage}"
       ${this.searchKeyword.length > 0 ? ` with "${this.searchKeyword}" keyword` : ''}`
    )

    await interaction.deferReply({ ephemeral: true })

    const { questions, totalQuestionCount } = await this.getQuestions()

    if (!questions.length) {
      if (this.searchKeyword) {
        await interaction.editReply({
          content: `**${this.searchKeyword}** için bir sonuç bulunamadı!`
        })
        return
      }

      this.logger.error(new Error('No questions found in database!'))
      await interaction.editReply({
        content: `Bir sonuç bulunamadı!`
      })
      return
    }

    const embed = this.buildEmbed(interaction, questions, this.currentPage, totalQuestionCount)
    const buttonRow = this.buildButtonRow(this.currentPage, questions.length, totalQuestionCount)
    const selectionRow = this.buildSelectionRow(questions)

    await interaction.editReply({
      embeds: [embed],
      components: [buttonRow, selectionRow]
    })
  }

  public resetState(): void {
    this.currentPage = 0
    this.searchKeyword = ''
  }

  private async getQuestions(): Promise<{
    questions: QuestionDocument[]
    totalQuestionCount: number
  }> {
    const findQuery =
      this.searchKeyword === ''
        ? {}
        : {
            title: { $regex: this.searchKeyword, $options: 'i' }
          }

    const totalQuestionCount = await this.questionModel.find(findQuery).count().exec()
    const questions = await this.questionModel
      .find(findQuery)
      .skip(this.currentPage * QUESTION_COUNT_PER_PAGE)
      .limit(QUESTION_COUNT_PER_PAGE)

    return { questions, totalQuestionCount }
  }

  private buildEmbed(
    interaction: MessageComponentInteraction | CommandInteraction,
    questions: QuestionDocument[],
    page: number,
    totalQuestionCount: number
  ): EmbedBuilder {
    const embedContent: APIEmbedField[] = questions.map((question, i) => {
      const { startTime, endTime } = question
      return {
        name: `**${page * QUESTION_COUNT_PER_PAGE + i + 1}.** ${question.title}`,
        value: `> ${startTime.minute}:${startTime.second}-${
          endTime.minute !== undefined && endTime.second !== undefined
            ? `${endTime.minute}:${endTime.second}`
            : '???'
        }`
      }
    })

    return new EmbedBuilder()
      .addFields(...embedContent)
      .setTitle(`Bir soru seçin:`)
      .setFooter({
        text: `${totalQuestionCount} soru içerisinden ${page * QUESTION_COUNT_PER_PAGE + 1}-${
          page * QUESTION_COUNT_PER_PAGE + questions.length
        } aralığı gösteriliyor.`
      })
  }

  private buildButtonRow(
    page: number,
    questionCount: number,
    totalQuestionCount: number
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
      .setDisabled(totalQuestionCount === page * QUESTION_COUNT_PER_PAGE + questionCount)

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      previousPageButton,
      nextPageButton
    )
  }

  private buildSelectionRow(
    questions: QuestionDocument[]
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
