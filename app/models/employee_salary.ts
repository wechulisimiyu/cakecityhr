import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class EmployeeSalary extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare annualBaseSalary: number

  @column()
  declare effectiveFrom: DateTime

  @column()
  declare effectiveTo: DateTime | null

  @column()
  declare isCurrentSalary: boolean

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
