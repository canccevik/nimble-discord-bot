import { Injectable, Scope } from '@nestjs/common'
import { Filter, InjectCauseEvent, InteractionEventCollector, On } from '@discord-nestjs/core'
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
  constructor(
    @InjectCauseEvent()
    private readonly causeInteraction: ChatInputCommandInteraction
  ) {}

  @Filter()
  public filter(interaction: StringSelectMenuInteraction): boolean {
    return this.causeInteraction.id === interaction.message.interaction.id
  }

  @On('collect')
  public async onCollect(
    interaction: StringSelectMenuInteraction | ButtonInteraction
  ): Promise<void> {
    const watchButton = new ButtonBuilder()
      .setCustomId('watch-button')
      .setLabel('İzle')
      .setStyle(ButtonStyle.Primary)

    const listenButton = new ButtonBuilder()
      .setCustomId('listen-button')
      .setLabel('Dinle')
      .setStyle(ButtonStyle.Success)

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      watchButton,
      listenButton
    )

    await interaction.update({
      content: 'Bir aksiyon seçin:',
      components: [row],
      embeds: []
    })
  }
}
