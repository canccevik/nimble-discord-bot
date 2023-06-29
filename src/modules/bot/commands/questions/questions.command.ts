import { CollectorInterceptor, SlashCommandPipe } from '@discord-nestjs/common'
import { UseInterceptors } from '@nestjs/common'
import { QuestionService } from '../../../question/question.service'
import { QuestionsInteractionCollector } from './questions-interaction.collector'
import { Question } from '../../../question/interfaces'
import {
  Command,
  Handler,
  InteractionEvent,
  Param,
  ParamType,
  UseCollectors
} from '@discord-nestjs/core'
import {
  InteractionReplyOptions,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'

class QuestionsDto {
  @Param({
    name: 'anahtar_kelime',
    description: 'Soruları filtrelemek için kullanılacak anahtar kelime.',
    type: ParamType.STRING
  })
  public searchKeyword: string
}

@Command({
  name: 'sorular',
  description: 'Soruları sayfalar şeklinde listeler.'
})
@UseInterceptors(CollectorInterceptor)
@UseCollectors(QuestionsInteractionCollector)
export class QuestionsCommand {
  constructor(private readonly questionService: QuestionService) {}

  @Handler()
  public run(@InteractionEvent(SlashCommandPipe) dto: QuestionsDto): InteractionReplyOptions {
    const { questions, totalResultCount } = this.questionService.getQuestionsByPage({
      page: 0,
      count: 10,
      searchKeyword: dto.searchKeyword
    })

    if (dto.searchKeyword && totalResultCount === 0) {
      return {
        content: `**${dto.searchKeyword}** için bir sonuç bulunamadı!`
      }
    }

    const embed = this.buildEmbed(questions, totalResultCount)
    const buttonRow = this.buildButtonRow()
    const selectionRow = this.buildSelectionRow(questions)

    return {
      embeds: [embed],
      components: [buttonRow, selectionRow]
    }
  }

  private buildEmbed(questions: Question[], totalResultCount: number): EmbedBuilder {
    const embedContent: APIEmbedField[] = questions.map((question, i) => {
      const { start, end } = question.time
      return {
        name: `**${0 * 10 + i + 1}.** ${question.title}`,
        value: `> ${start.minute}:${start.second}-${end ? `${end?.minute}:${end?.second}` : '???'}`
      }
    })

    const embed = new EmbedBuilder()
      .addFields(...embedContent)
      .setTitle(`Bir soru seçin`)
      .setFooter({
        text: `${totalResultCount} soru içerisinden ${0 * questions.length + 1}-${
          0 * questions.length + questions.length
        } aralığı gösteriliyor.`
      })
    return embed
  }

  private buildButtonRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const previousPageButton = new ButtonBuilder()
      .setCustomId('previous-page-button')
      .setLabel('Geri')
      .setStyle(ButtonStyle.Primary)

    const nextPageButton = new ButtonBuilder()
      .setCustomId('next-page-button')
      .setLabel('İleri')
      .setStyle(ButtonStyle.Primary)

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      previousPageButton,
      nextPageButton
    )
  }

  private buildSelectionRow(
    questions: Question[]
  ): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const select = new StringSelectMenuBuilder()
      .setCustomId('select-question')
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
