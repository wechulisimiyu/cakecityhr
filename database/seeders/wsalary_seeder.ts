import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'
import EmployeeSalary from '#models/employee_salary'
import { Role } from '#enums/roles'

export default class extends BaseSeeder {
  private readonly SALARY_BY_ROLE: { [key: number]: number } = {
    [Role.EMPLOYEE]: 80000,
    [Role.DEPARTMENT_HEAD]: 120000,
    [Role.HR]: 160000,
    [Role.CEO]: 200000,
    [Role.ADMIN]: 80000,
  }

  async run() {
    // Get all users
    const users = await User.all()
    const currentDate = DateTime.now()

    for (const user of users) {
      await EmployeeSalary.create({
        userId: user.id,
        annualBaseSalary: this.SALARY_BY_ROLE[user.roleId],
        effectiveFrom: currentDate,
        effectiveTo: null,
        isCurrentSalary: true,
      })
    }
  }
}
