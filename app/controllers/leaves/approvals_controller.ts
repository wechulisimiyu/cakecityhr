import type { HttpContext } from '@adonisjs/core/http'
import Leave from '#models/leave'
import LeaveApproval from '#models/leave_approval'
import { LeaveStatus } from '#enums/leave_status'
import { Role } from '#enums/roles'

export default class ApprovalsController {
  async index({ view, auth, response }: HttpContext) {
    if (![Role.DEPARTMENT_HEAD, Role.HR, Role.CEO].includes(auth.user!.roleId)) {
      return response.redirect().toRoute('leaves.index')
    }

    const user = auth.user!
    await user.load('department')

    let leavesQuery = Leave.query()
      .preload('user')
      .preload('approvals')
      .preload('department')
      .orderBy('created_at', 'desc')

    switch (auth.user!.roleId) {
      case Role.DEPARTMENT_HEAD:
        if (!auth.user?.departmentId) {
          return response
            .status(400)
            .json({ error: 'Department head must have a department assigned' })
        }
        leavesQuery = leavesQuery
          .where('department_id', auth.user.departmentId)
          .where('status', LeaveStatus.PENDING)
        break
      case Role.HR:
        leavesQuery = leavesQuery.where('status', LeaveStatus.PENDING_HR)
        break
      case Role.CEO:
        leavesQuery = leavesQuery.where('status', LeaveStatus.PENDING_CEO)
        break
    }

    const leaves = await leavesQuery

    return view.render('pages/leaves/approvals', {
      leaves,
      userRole: auth.user!.roleId,
      department: user.department,
    })
  }

  async store({ params, auth, response, session, request }: HttpContext) {
    const user = auth.user!
    if (![Role.DEPARTMENT_HEAD, Role.HR, Role.CEO].includes(user.roleId)) {
      return response.redirect().back()
    }

    const { comments } = request.only(['comments'])
    const leave = await Leave.query()
      .where('id', params.id)
      .where(
        'status',
        user.roleId === Role.DEPARTMENT_HEAD
          ? LeaveStatus.PENDING
          : user.roleId === Role.HR
            ? LeaveStatus.PENDING_HR
            : LeaveStatus.PENDING_CEO
      )
      .firstOrFail()

    await LeaveApproval.create({
      leaveId: leave.id,
      approverId: user.id,
      approverRole:
        user.roleId === Role.DEPARTMENT_HEAD
          ? 'DEPARTMENT_HEAD'
          : user.roleId === Role.HR
            ? 'HR'
            : 'CEO',
      action: 'APPROVED',
      comments,
    })

    await leave
      .merge({
        status:
          user.roleId === Role.DEPARTMENT_HEAD
            ? LeaveStatus.PENDING_HR
            : user.roleId === Role.HR
              ? LeaveStatus.PENDING_CEO
              : LeaveStatus.APPROVED,
      })
      .save()

    session.flash('success', 'Leave request approved')
    return response.redirect().back()
  }
}
