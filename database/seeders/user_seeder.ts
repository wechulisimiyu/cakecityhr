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
      gender: 2,
    })

    // Create HR Manager
    await User.create({
      fullName: 'Sarah Wilson',
      email: 'hr@cakecity.com',
      password: 'password123',
      roleId: Role.HR,
      departmentId: 2,
      gender: 2,
    })

    // Get all departments
    const departments = await Department.all()

    // Create Department Heads and Employees
    for (const dept of departments) {
      // Create department head
      const deptHead = await User.create({
        fullName: `${dept.name} Head`,
        email: `head.${dept.name.toLowerCase().replace(/\s+/g, '')}@cakecity.com`,
        password: 'password123',
        roleId: Role.DEPARTMENT_HEAD,
        departmentId: dept.id,
        gender: dept.id % 2 === 0 ? 2 : 1,
      })

      // Update department with head
      await dept.merge({ departmentHeadId: deptHead.id }).save()

      // Create 10 regular employees for each department
      for (let i = 1; i <= 10; i++) {
        await User.create({
          fullName: `Employee ${i} ${dept.name}`,
          email: `employee${i}.${dept.name.toLowerCase().replace(/\s+/g, '')}@cakecity.com`,
          password: 'password123',
          roleId: Role.EMPLOYEE,
          departmentId: dept.id,
          gender: i === 1 ? 2 : 1,
        })
      }
    }
  }
}
