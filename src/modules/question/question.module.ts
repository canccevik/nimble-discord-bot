import { Module } from '@nestjs/common'
import { QuestionService } from './question.service'
import { YouTubeService } from './youtube.service'

@Module({
  providers: [QuestionService, YouTubeService],
  exports: [QuestionService]
})
export class QuestionModule {}
