import { CollectorInterceptor, SlashCommandPipe } from '@discord-nestjs/common'
import { UseInterceptors } from '@nestjs/common'
import { QuestionService } from '../../../question/question.service'
import { QuestionsInteractionCollector } from './questions-interaction.collector'
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
  APIEmbedField
} from 'discord.js'

class QuestionsDto {
  @Param({
    name: 'page',
    description: 'page',
    type: ParamType.NUMBER,
    minValue: 1
  })
  public page: number
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
    const page = dto.page ? dto.page - 1 : 0
    const questions = this.questionService.getQuestionsByPage(page, 10)
    const totalQuestionCount = this.questionService.getQuestionCount()

    const embedContent: APIEmbedField[] = questions.map((question, i) => {
      const { start, end } = question.time
      return {
        name: `**${page * 10 + i + 1}.** ${question.title}`,
        value: `> ${start.minute}:${start.second}-${end ? `${end?.minute}:${end?.second}` : '???'}`
      }
    })

    const embed = new EmbedBuilder().addFields(...embedContent)

    if (questions.length) {
      embed.setTitle(`Bir soru seçin`)
      embed.setFooter({
        text: `${totalQuestionCount} soru içerisinden ${page * questions.length + 1}-${
          page * questions.length + questions.length
        } aralığı gösteriliyor.`
      })
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('select-question')
      .setPlaceholder('Seçim yap')
      .addOptions(
        ...questions.map((question) =>
          new StringSelectMenuOptionBuilder().setLabel(question.title).setValue(question.id)
        )
      )

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select)

    return {
      embeds: [embed],
      components: [row]
    }
  }
}
