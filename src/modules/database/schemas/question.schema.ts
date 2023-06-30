import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type QuestionDocument = HydratedDocument<Question>

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: false,
    updatedAt: false
  }
})
export class Question {
  @Prop({
    type: String,
    required: true
  })
  public videoId: string

  @Prop({
    type: String,
    required: true
  })
  public title: string

  @Prop(
    raw({
      minute: { type: String },
      second: { type: String }
    })
  )
  public startTime: { minute: string; second: string }

  @Prop(
    raw({
      minute: { type: String },
      second: { type: String }
    })
  )
  public endTime: { minute: string; second: string }
}

export const QuestionSchema = SchemaFactory.createForClass(Question)
