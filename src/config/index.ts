import { makeValidators, Static, str } from 'nestjs-envalid'

const config = {
  BOT_TOKEN: str(),
  YOUTUBE_API_KEY: str(),
  YOUTUBE_CHANNEL_ID: str(),
  DATABASE_URI: str()
}

export const validators = makeValidators(config)

export type Config = Static<typeof validators>

export const ENV = 'EnvalidModuleEnv'
