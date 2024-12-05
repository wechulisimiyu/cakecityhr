import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { LeaveType } from '#enums/leave_type'
import { LeaveStatus } from '#enums/leave_status'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Department from './department.js'
import User from './user.js'

export default class Leave extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare departmentId: number

  @column()
  declare type: LeaveType

  @column()
  declare status: LeaveStatus

  @column.date()
  declare startDate: DateTime

  @column.date()
  declare endDate: DateTime

  @column()
  declare days: number

  @column()
  declare reason: string

  @column()
  declare deptHeadId: number | null

  @column.dateTime()
  declare deptHeadApprovedAt: DateTime | null

  @column()
  declare deptHeadComments: string | null

  @column()
  declare hrId: number | null

  @column.dateTime()
  declare hrApprovedAt: DateTime | null

  @column()
  declare hrComments: string | null

  @column()
  declare ceoId: number | null

  @column.dateTime()
  declare ceoApprovedAt: DateTime | null

  @column()
  declare ceoComments: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => User, {
    foreignKey: 'deptHeadId',
  })
  declare deptHead: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'hrId',
  })
  declare hr: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'ceoId',
  })
  declare ceo: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
