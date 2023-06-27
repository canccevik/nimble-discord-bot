import { makeValidators, Static } from 'nestjs-envalid'

const config = {}

export const validators = makeValidators(config)

export type Config = Static<typeof validators>

export const ENV = 'EnvalidModuleEnv'
