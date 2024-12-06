// new migration: create_leave_approvals_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leaves'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('department_id').unsigned().references('id').inTable('departments').nullable()
      table.enum('type', ['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid'])
      table.enum('status', ['pending', 'pending_hr', 'pending_ceo', 'approved', 'rejected'])
      table.date('start_date')
      table.date('end_date')
      table.integer('days').notNullable()
      table.text('reason')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
