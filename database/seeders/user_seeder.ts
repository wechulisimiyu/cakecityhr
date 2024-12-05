import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Role } from '#enums/roles'
import User from '#models/user'
import Department from '#models/department'

export default class extends BaseSeeder {
  async run() {
    // Create CEO first
    await User.create({
      fullName: 'John Smith',
      email: 'ceo@cakecity.com',
      password: 'password123',
      roleId: Role.CEO,
    })

    // Create HR Manager
    await User.create({
      fullName: 'Sarah Wilson',
      email: 'hr@cakecity.com',
      password: 'password123',
      roleId: Role.HR,
      departmentId: 2, // HR Department
    })

    // Create Finance Head
    await User.create({
      fullName: 'Mike Johnson',
      email: 'finance@cakecity.com',
      password: 'password123',
      roleId: Role.HEAD_OF_FINANCE,
      departmentId: 3, // Finance Department
    })

    // Create Department Heads
    const departments = await Department.all()

    for (const dept of departments) {
      const deptHead = await User.create({
        fullName: `${dept.name} Head`,
        email: `head.${dept.name.toLowerCase().replace(' ', '')}@cakecity.com`,
        password: 'password123',
        roleId: Role.DEPARTMENT_HEAD,
        departmentId: dept.id,
      })

      // Update department with head
      await dept.merge({ departmentHeadId: deptHead.id }).save()

      // Create 2 regular employees for each department
      for (let i = 1; i <= 2; i++) {
        await User.create({
          fullName: `Employee ${i} ${dept.name}`,
          email: `employee${i}.${dept.name.toLowerCase().replace(' ', '')}@cakecity.com`,
          password: 'password123',
          roleId: Role.EMPLOYEE,
          departmentId: dept.id,
        })
      }
    }
  }
}
