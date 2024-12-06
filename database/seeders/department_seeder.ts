import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Department from '#models/department'

export default class extends BaseSeeder {
  async run() {
    const departments = [
      {
        name: 'Food Production',
      },
      {
        name: 'Finance',
      },
      {
        name: 'Internal Controls',
      },
      {
        name: 'Marketing',
      },
      {
        name: 'Sales',
      },
      {
        name: 'Transport and Logistics',
      },
      {
        name: 'Procurement',
      },
    ]

    await Department.createMany(departments)
  }
}
