import { CollectorInterceptor, SlashCommandPipe } from '@discord-nestjs/common'
import { Injectable, UseInterceptors } from '@nestjs/common'
import { QuestionsInteractionCollector } from './questions-interaction.collector'
import { Command, Handler, InteractionEvent, UseCollectors } from '@discord-nestjs/core'
import { BaseQuestionsCommand, QuestionsDto } from './base-questions.command'
import { CommandInteraction } from 'discord.js'

@Injectable()
@Command({
  name: 'sorular',
  description: 'Soruları sayfalar şeklinde listeler.'
})
@UseInterceptors(CollectorInterceptor)
@UseCollectors(QuestionsInteractionCollector)
export class QuestionsCommand {
  constructor(private readonly baseQuestionsCommand: BaseQuestionsCommand) {}

  @Handler()
  public async run(
    @InteractionEvent(SlashCommandPipe) dto: QuestionsDto,
    @InteractionEvent() interaction: CommandInteraction
  ): Promise<void> {
    this.baseQuestionsCommand.resetState()
    return this.baseQuestionsCommand.run(interaction, {
      searchKeyword: dto.searchKeyword
    })
  }
}
