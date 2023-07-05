import { Logtail } from '@logtail/node'
import { Inject, Injectable } from '@nestjs/common'
import { Config, ENV } from '../../config'
import { LogtailTransport } from '@logtail/winston'
import { WinstonModuleOptionsFactory, WinstonModuleOptions, utilities } from 'nest-winston'
import * as winston from 'winston'

@Injectable()
export class LoggerConfigService implements WinstonModuleOptionsFactory {
  private logtail: Logtail

  constructor(@Inject(ENV) private readonly config: Config) {
    this.logtail = new Logtail(config.LOGTAIL_SOURCE_TOKEN)
  }

  public createWinstonModuleOptions(): WinstonModuleOptions {
    const transports: winston.transport[] = [new LogtailTransport(this.logtail)]

    if (this.config.isDevelopment) {
      transports.push(new winston.transports.Console())
    }

    return {
      transports,
      exitOnError: false,
      exceptionHandlers: transports,
      rejectionHandlers: transports,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'MM-DD-YYYY hh:mm:ss A'
        }),
        utilities.format.nestLike('Logger')
      )
    }
  }
}
