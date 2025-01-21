import type { HttpContext } from '@adonisjs/core/http'
import Leave from '#models/leave'
import { LeaveStatus } from '#enums/leave_status'
import { LeaveType } from '#enums/leave_type'
import { DateTime } from 'luxon'
import { LeaveService } from '#services/leave_service'

// Types
interface LeaveRequestData {
  type: LeaveType
  start_date: string
  end_date: string
  reason: string
}

const LEAVE_ENTITLEMENTS = {
  [LeaveType.ANNUAL]: 21,
  [LeaveType.SICK]: 14,
  [LeaveType.PATERNITY]: 14,
  [LeaveType.MATERNITY]: 90,
  [LeaveType.COMPASSIONATE]: 7,
  [LeaveType.UNPAID]: Infinity,
} as const

export default class IndexController {
  async index({ view, auth }: HttpContext) {
    const leaves = await Leave.query()
      .where('user_id', auth.user!.id)
      .preload('department')
      .preload('approvals', (query) => {
        query.preload('approver')
      })
      .orderBy('created_at', 'desc')

    const currentYear = DateTime.now().year
    const leaveBalance = await LeaveService.calculateLeaveBalance(auth.user!.id, currentYear)

    // Cast gender to number since it's stored as a numeric enum (1 = male, 2 = female)
    const gender = Number(auth.user!.gender)

    return view.render('pages/leaves/index', { leaves, leaveBalance, LeaveType, gender })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/leaves/create', {
      LeaveType, // Pass the enum directly instead of Object.values()
    })
  }

  async show({ view, params, auth }: HttpContext) {
    const leave = await Leave.query()
      .where('id', params.id)
      .where('user_id', auth.user!.id)
      .preload('department')
      .preload('approvals', (query) => {
        query.preload('approver')
      })
      .firstOrFail()

    return view.render('pages/leaves/show', { leave })
  }

  async store({ request, response, auth, session }: HttpContext) {
    try {
      const data = request.only(['type', 'start_date', 'end_date', 'reason']) as LeaveRequestData
      const startDate = DateTime.fromISO(data.start_date)
      const endDate = DateTime.fromISO(data.end_date)

      // Validate dates
      if (!startDate.isValid || !endDate.isValid) {
        session.flash('error', 'Invalid dates provided')
        return response.redirect().back()
      }

      if (endDate < startDate) {
        session.flash('error', 'End date cannot be before start date')
        return response.redirect().back()
      }

      // Validate leave type
      if (!Object.values(LeaveType).includes(data.type)) {
        session.flash('error', 'Invalid leave type')
        return response.redirect().back()
      }

      // Gender-specific leave validation
      if (data.type === LeaveType.MATERNITY && auth.user!.gender !== 2) {
        session.flash('error', 'Maternity leave is only available for female employees')
        return response.redirect().back()
      }

      if (data.type === LeaveType.PATERNITY && auth.user!.gender !== 1) {
        session.flash('error', 'Paternity leave is only available for male employees')
        return response.redirect().back()
      }

      const workingDays = await LeaveService.calculateWorkingDays(startDate, endDate)
      const year = startDate.year
      const usedDays = await LeaveService.calculateUsedLeaveDays(auth.user!.id, year)

      // Calculate remaining days based on leave type and gender
      const remainingDays: Record<LeaveType, number> = {
        [LeaveType.ANNUAL]: LEAVE_ENTITLEMENTS.annual - usedDays.annual,
        [LeaveType.SICK]: LEAVE_ENTITLEMENTS.sick - usedDays.sick,
        [LeaveType.PATERNITY]:
          auth.user!.gender === 1 ? LEAVE_ENTITLEMENTS.paternity - usedDays.paternity : 0,
        [LeaveType.MATERNITY]:
          auth.user!.gender === 2 ? LEAVE_ENTITLEMENTS.maternity - usedDays.maternity : 0,
        [LeaveType.COMPASSIONATE]: LEAVE_ENTITLEMENTS.compassionate - usedDays.compassionate,
        [LeaveType.UNPAID]: LEAVE_ENTITLEMENTS.unpaid,
      }

      if (workingDays > remainingDays[data.type]) {
        session.flash('error', 'Insufficient leave balance')
        return response.redirect().back()
      }

      // Create leave request
      await Leave.create({
        ...data,
        userId: auth.user!.id,
        departmentId: auth.user!.departmentId,
        status: LeaveStatus.PENDING,
        days: workingDays,
        startDate,
        endDate,
      })

      session.flash('success', 'Leave request submitted successfully')
      return response.redirect().toRoute('leaves.index')
    } catch (error) {
      console.error('Leave request error:', error)
      session.flash('error', 'An error occurred while processing your request')
      return response.redirect().back()
    }
  }

  async calendar({ view }: HttpContext) {
    const leaves = await Leave.query()
      .where('status', LeaveStatus.APPROVED)
      .preload('user')
      .orderBy('start_date', 'asc')

    const events = leaves.map((leave) => ({
      id: leave.id.toString(),
      title: `${leave.user.fullName} - ${leave.type}`,
      start: leave.startDate.toFormat('yyyy-MM-dd'),
      end: leave.endDate.plus({ days: 1 }).toFormat('yyyy-MM-dd'),
      classNames: this.getLeaveTypeColor(leave.type as LeaveType),
    }))

    return view.render('pages/leaves/calendar', { events })
  }

  private getLeaveTypeColor(type: LeaveType): string {
    const colors: Record<LeaveType, string> = {
      [LeaveType.ANNUAL]: 'bg-green-200 text-green-800',
      [LeaveType.SICK]: 'bg-blue-200 text-blue-800',
      [LeaveType.MATERNITY]: 'bg-pink-200 text-pink-800',
      [LeaveType.PATERNITY]: 'bg-purple-200 text-purple-800',
      [LeaveType.COMPASSIONATE]: 'bg-yellow-200 text-yellow-800',
      [LeaveType.UNPAID]: 'bg-gray-200 text-gray-800',
    }
    return colors[type]
  }
}
