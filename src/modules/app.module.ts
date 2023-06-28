import { Module } from '@nestjs/common'
import { EnvalidModule } from 'nestjs-envalid'
import { validators } from '@config/index'
import { DiscordModule } from './discord/discord.module'

@Module({
  imports: [
    EnvalidModule.forRoot({
      validators,
      useDotenv: true,
      isGlobal: true
    }),
    DiscordModule
  ]
})
export class AppModule {}
