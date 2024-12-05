import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Role as RoleEnum } from '#enums/roles'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    await Role.createMany([
      {
        id: RoleEnum.EMPLOYEE,
        name: 'Employee',
      },
      {
        id: RoleEnum.DEPARTMENT_HEAD,
        name: 'Department Head',
      },
      {
        id: RoleEnum.HR,
        name: 'HR',
      },
      {
        id: RoleEnum.HEAD_OF_FINANCE,
        name: 'Head of Finance',
      },
      {
        id: RoleEnum.CEO,
        name: 'CEO',
      },
      {
        id: RoleEnum.ADMIN,
        name: 'Admin',
      },
    ])
  }
}
