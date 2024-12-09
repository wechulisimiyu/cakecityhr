import type { HttpContext } from '@adonisjs/core/http'
import Leave from '#models/leave'
import { LeaveStatus } from '#enums/leave_status'
import { LeaveType } from '#enums/leave_type'
import { DateTime } from 'luxon'
import { Role } from '#enums/roles'

export default class IndexController {
  async index({ view, auth }: HttpContext) {
    const leaves = await Leave.query()
      .where('user_id', auth.user!.id)
      .preload('department')
      .preload('approvals', (query) => {
        query.preload('approver')
      })
      .orderBy('created_at', 'desc')

    // Get used leave days from approved leaves
    const approvedLeaves = await Leave.query()
      .where('user_id', auth.user!.id)
      .where('status', LeaveStatus.APPROVED)

    const usedDays = {
      annual: 0,
      sick: 0,
      paternity: 0,
      maternity: 0,
    }

    approvedLeaves.forEach((leave) => {
      switch (leave.type) {
        case LeaveType.ANNUAL:
          usedDays.annual += leave.days
          break
        case LeaveType.SICK:
          usedDays.sick += leave.days
          break
        case LeaveType.PATERNITY:
          usedDays.paternity += leave.days
          break
        case LeaveType.MATERNITY:
          usedDays.maternity += leave.days
          break
      }
    })

    const userGender = Number(auth.user!.gender)

    const leaveBalance = {
      annual: 21 - usedDays.annual,
      sick: 14 - usedDays.sick,
      paternity: userGender === 1 ? 14 - usedDays.paternity : null,
      maternity: userGender === 2 ? 90 - usedDays.maternity : null,
    }

    return view.render('pages/leaves/index', { leaves, leaveBalance })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/leaves/create', { LeaveType })
  }

  async show({ view, params, auth }: HttpContext) {
    const leave = await Leave.query()
      .where('id', params.id)
      .where('user_id', auth.user!.id)
      .preload('department')
      .firstOrFail()

    return view.render('pages/leaves/show', { leave })
  }

  async store({ request, response, auth, session }: HttpContext) {
    const data = request.only(['type', 'start_date', 'end_date', 'reason'])
    const startDate = DateTime.fromISO(data.start_date)
    const endDate = DateTime.fromISO(data.end_date)
    const days = Math.max(1, Math.round(endDate.diff(startDate, 'days').days + 1))

    const departmentId = [Role.CEO, Role.HR].includes(auth.user!.roleId)
      ? null
      : auth.user!.departmentId

    console.log(departmentId)

    await Leave.create({
      ...data,
      userId: auth.user!.id,
      departmentId,
      status: LeaveStatus.PENDING,
      days,
    })

    session.flash('success', 'Leave request submitted successfully')
    return response.redirect().toRoute('leaves.index')
  }

  async calendar({ view }: HttpContext) {
    const leaves = await Leave.query()
      .where('status', LeaveStatus.APPROVED)
      .preload('user')
      .orderBy('start_date', 'asc')

    const events = leaves.map((leave) => ({
      id: leave.id,
      title: `${leave.user.fullName} - ${leave.type}`,
      start: leave.startDate.toFormat('yyyy-MM-dd'),
      end: leave.endDate.plus({ days: 1 }).toFormat('yyyy-MM-dd'),
    }))

    return view.render('pages/leaves/calendar', { events })
  }

  //   private getLeaveTypeColor(type: LeaveType): string {
  //     const colors = {
  //       [LeaveType.ANNUAL]: '#34D399',
  //       [LeaveType.SICK]: '#60A5FA',
  //       [LeaveType.MATERNITY]: '#F472B6',
  //       [LeaveType.PATERNITY]: '#A78BFA',
  //       [LeaveType.COMPASSIONATE]: '#FBBF24',
  //       [LeaveType.UNPAID]: '#6B7280',
  //     }
  //     return colors[type]
  //   }
}
