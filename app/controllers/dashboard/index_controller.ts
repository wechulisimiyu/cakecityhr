import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Department from '#models/department'
import Leave from '#models/leave'
import { LeaveStatus } from '#enums/leave_status'
import { DateTime } from 'luxon'

export default class IndexController {
  async handle({ auth, view }: HttpContext) {
    const user = auth.user

    // Calculate dashboard stats
    const [totalEmployees, totalDepartments, activeLeaves, pendingApprovals] = await Promise.all([
      User.query()
        .count('* as count')
        .first()
        .then((result) => Number(result?.$extras.count || 0)),
      Department.query()
        .count('* as count')
        .first()
        .then((result) => Number(result?.$extras.count || 0)),
      Leave.query()
        .where('status', LeaveStatus.APPROVED)
        .where('end_date', '>=', DateTime.now().toSQL())
        .count('* as count')
        .first()
        .then((result) => Number(result?.$extras.count || 0)),
      Leave.query()
        .where('status', LeaveStatus.PENDING)
        .count('* as count')
        .first()
        .then((result) => Number(result?.$extras.count || 0)),
    ])

    const stats = {
      totalEmployees,
      totalDepartments,
      activeLeaves,
      pendingApprovals,
    }

    return view.render('pages/dashboard/index', {
      user,
      stats,
    })
  }
}
