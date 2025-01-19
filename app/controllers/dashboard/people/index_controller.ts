import { HttpContext } from '@adonisjs/core/http'
import Department from '#models/department'
import User from '#models/user'
import { Role } from '#enums/roles'
import Leave from '#models/leave'

export default class PeopleController {
  async index({ view, request }: HttpContext) {
    const query = request.input('query', '')
    const departmentFilter = request.input('department')
    // Get departments with employees
    const departments = await Department.query().preload('employees', (builder) => {
      if (query) {
        builder.whereILike('full_name', `%${query}%`)
      }
      builder.orderBy('full_name', 'asc')
    })

    // Get special roles separately
    const specialUsers = await User.query()
      .whereIn('role_id', [Role.HR, Role.CEO])
      .if(query, (builder) => {
        builder.whereILike('full_name', `%${query}%`)
      })
      .orderBy('role_id', 'asc')

    const getRoleName = (roleId: number) => {
      switch (roleId) {
        case Role.CEO:
          return 'CEO'
        case Role.HR:
          return 'HR Manager'
        case Role.DEPARTMENT_HEAD:
          return 'Department Head'
        default:
          return 'Employee'
      }
    }

    const result = await User.query().count('* as total')
    const totalEmployees = result[0].$extras.total

    return view.render('pages/dashboard/people/index', {
      departments,
      specialUsers,
      getRoleName,
      query,
      departmentFilter,
      totalEmployees,
    })
  }

  async show({ view, params }: HttpContext) {
    try {
      const user = await User.query().where('id', params.id).preload('department').firstOrFail()

      const currentYear = new Date().getFullYear()
      const leaves = await Leave.query()
        .where('user_id', user.id)
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [currentYear])
        .orderBy('created_at', 'desc')

      // Calculate leave stats
      const leaveStats = {
        annual: 0,
        sick: 0,
        total: leaves.length,
      }

      leaves.forEach((leave) => {
        if (leave.type === 'annual') leaveStats.annual++
        if (leave.type === 'sick') leaveStats.sick++
      })

      return view.render('pages/dashboard/people/show', {
        user,
        leaves: leaves || [],
        leaveStats,
        currentYear,
      })
    } catch (error) {
      return view.render('pages/dashboard/people/show', {
        user: null,
        leaves: [],
        leaveStats: { annual: 0, sick: 0, total: 0 },
        error: 'Unable to fetch employee data',
      })
    }
  }
}
