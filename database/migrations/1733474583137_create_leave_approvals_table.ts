import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leave_approvals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('leave_id').unsigned().references('id').inTable('leaves').onDelete('CASCADE')
      table.integer('approver_id').unsigned().references('id').inTable('users')
      table.enum('approver_role', ['DEPARTMENT_HEAD', 'HR', 'CEO']).notNullable()
      table.enum('action', ['APPROVED', 'REJECTED']).notNullable()
      table.text('comments')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
