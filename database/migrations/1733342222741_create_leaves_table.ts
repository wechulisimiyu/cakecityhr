import { BaseSchema } from '@adonisjs/lucid/schema'
import { LeaveStatus } from '#enums/leave_status'
import { LeaveType } from '#enums/leave_type'

export default class extends BaseSchema {
  protected tableName = 'leaves'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('department_id').unsigned().references('id').inTable('departments')
      table.enum('type', Object.values(LeaveType))
      table.enum('status', Object.values(LeaveStatus)).defaultTo(LeaveStatus.PENDING)
      table.date('start_date')
      table.date('end_date')
      table.integer('days').notNullable()
      table.text('reason')

      // Track approvals with timestamps, comments, and approver IDs
      table.integer('dept_head_id').unsigned().references('id').inTable('users').nullable()
      table.timestamp('dept_head_approved_at').nullable()
      table.text('dept_head_comments').nullable()

      table.integer('hr_id').unsigned().references('id').inTable('users').nullable()
      table.timestamp('hr_approved_at').nullable()
      table.text('hr_comments').nullable()

      table.integer('ceo_id').unsigned().references('id').inTable('users').nullable()
      table.timestamp('ceo_approved_at').nullable()
      table.text('ceo_comments').nullable()

      table.timestamp('rejected_at').nullable()
      table.integer('rejected_by').unsigned().references('id').inTable('users').nullable()
      table.text('rejection_reason').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
