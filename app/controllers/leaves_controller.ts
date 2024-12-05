import type { HttpContext } from '@adonisjs/core/http'
import Leave from '#models/leave'
import { LeaveStatus } from '#enums/leave_status'
import { LeaveType } from '#enums/leave_type'
import { DateTime } from 'luxon'

export default class LeavesController {
  async index({ view, auth }: HttpContext) {
    const leaves = await Leave.query()
      .where('user_id', auth.user!.id)
      .preload('department')
      .orderBy('created_at', 'desc')

    return view.render('pages/leaves/index', { leaves })
  }

  async create({ view }: HttpContext) {
    return view.render('pages/leaves/create', {
      LeaveType,
    })
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

    // Calculate days between dates
    const startDate = DateTime.fromISO(data.start_date)
    const endDate = DateTime.fromISO(data.end_date)
    const days = endDate.diff(startDate, 'days').days + 1 // Include both start and end dates

    await Leave.create({
      ...data,
      userId: auth.user!.id,
      status: LeaveStatus.PENDING,
      days: Math.max(1, Math.round(days)), // Ensure minimum 1 day
    })

    session.flash('success', 'Leave request submitted successfully')
    return response.redirect().toRoute('leaves.index')
  }
}
