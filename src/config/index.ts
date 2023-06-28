import { makeValidators, Static, str } from 'nestjs-envalid'

const config = {
  BOT_TOKEN: str()
}

export const validators = makeValidators(config)

export type Config = Static<typeof validators>

export const ENV = 'EnvalidModuleEnv'
