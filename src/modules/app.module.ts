import { Module } from '@nestjs/common'
import { EnvalidModule } from 'nestjs-envalid'
import { validators } from '../config'
import { DiscordModule } from './discord/discord.module'
import { DatabaseModule } from './database/database.module'
import { LoggerModule } from './logger/logger.module'
import { FeaturesModule } from 'src/features/features.module'

@Module({
  imports: [
    EnvalidModule.forRoot({
      validators,
      useDotenv: true,
      isGlobal: true
    }),
    FeaturesModule,
    LoggerModule,
    DatabaseModule,
    DiscordModule
  ]
})
export class AppModule {}
