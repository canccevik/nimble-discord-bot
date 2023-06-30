import { Inject, Injectable } from '@nestjs/common'
import { MongooseOptionsFactory, MongooseModuleOptions } from '@nestjs/mongoose'
import { Config, ENV } from '../../config'

@Injectable()
export class DatabaseConfigService implements MongooseOptionsFactory {
  constructor(@Inject(ENV) private readonly config: Config) {}

  public createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: this.config.DATABASE_URI
    }
  }
}
