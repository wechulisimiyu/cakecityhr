import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Department from '#models/department'

export default class extends BaseSeeder {
  async run() {
    const departments = [
      {
        name: 'Information Technology',
      },
      {
        name: 'Human Resources',
      },
      {
        name: 'Finance',
      },
      {
        name: 'Operations',
      },
      {
        name: 'Marketing',
      },
      {
        name: 'Sales',
      },
    ]

    await Department.createMany(departments)
  }
}
