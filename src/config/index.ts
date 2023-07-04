import { makeValidators, port, Static, str } from 'nestjs-envalid'

const config = {
  BOT_TOKEN: str(),
  YOUTUBE_API_KEY: str(),
  YOUTUBE_CHANNEL_ID: str(),
  DATABASE_URI: str(),
  PORT: port({ default: 3000 }),
  LOGTAIL_SOURCE_TOKEN: str()
}

export const validators = makeValidators(config)

export type Config = Static<typeof validators>

export const ENV = 'EnvalidModuleEnv'
