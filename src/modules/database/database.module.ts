import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DatabaseConfigService } from './database-config.service'
import { Question, QuestionSchema } from './schemas'

const questionModelProvider = MongooseModule.forFeature([
  { name: Question.name, schema: QuestionSchema }
])

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: DatabaseConfigService
    }),
    questionModelProvider
  ],
  exports: [questionModelProvider]
})
export class DatabaseModule {}
