import { Module } from '@nestjs/common'
import { EnvalidModule } from 'nestjs-envalid'
import { validators } from '@config/index'

@Module({
  imports: [
    EnvalidModule.forRoot({
      validators,
      useDotenv: true,
      isGlobal: true
    })
  ]
})
export class AppModule {}
