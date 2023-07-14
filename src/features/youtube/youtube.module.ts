import { Module } from '@nestjs/common'
import { YouTubeService } from './youtube.service'
import { DatabaseModule } from '../../modules/database/database.module'

@Module({
  imports: [DatabaseModule],
  providers: [YouTubeService]
})
export class YouTubeModule {}
