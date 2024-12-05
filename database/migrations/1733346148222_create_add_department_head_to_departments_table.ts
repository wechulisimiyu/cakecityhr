import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'departments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('department_head_id').unsigned().references('id').inTable('users').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('department_head_id')
    })
  }
}
