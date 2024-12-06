import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Leave from './leave.js'

export default class LeaveApproval extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare leaveId: number

  @column()
  declare approverId: number

  @column()
  declare approverRole: 'DEPARTMENT_HEAD' | 'HR' | 'CEO'

  @column()
  declare action: 'APPROVED' | 'REJECTED'

  @column()
  declare comments: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Leave)
  declare leave: BelongsTo<typeof Leave>

  @belongsTo(() => User, {
    foreignKey: 'approverId',
  })
  declare approver: BelongsTo<typeof User>
}
