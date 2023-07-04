import { Module } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import { LoggerConfigService } from './logger-config.service'

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useClass: LoggerConfigService
    })
  ]
})
export class LoggerModule {}
