import type { HttpContext } from '@adonisjs/core/http'
import Leave from '#models/leave'
import LeaveApproval from '#models/leave_approval'
import { LeaveStatus } from '#enums/leave_status'
import { Role } from '#enums/roles'
import { DateTime } from 'luxon'
import { LeaveService } from '#services/leave_service'

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

    return view.render('pages/approvals/approvals', {
      leaves,
      userRole: auth.user!.roleId,
      department: user.department,
    })
  }

  async show({ params, view, auth, response }: HttpContext) {
    const user = auth.user!
    if (![Role.DEPARTMENT_HEAD, Role.HR, Role.CEO].includes(user.roleId)) {
      return response.redirect().toRoute('leaves.index')
    }

    const leave = await Leave.query()
      .where('id', params.id)
      .preload('user')
      .preload('approvals', (query) => {
        query.orderBy('created_at', 'desc')
      })
      .preload('department')
      .firstOrFail()

    // Verify user has permission to view this approval
    const canView =
      user.roleId === Role.DEPARTMENT_HEAD
        ? leave.status === LeaveStatus.PENDING && leave.departmentId === user.departmentId
        : user.roleId === Role.HR
          ? leave.status === LeaveStatus.PENDING_HR
          : user.roleId === Role.CEO && leave.status === LeaveStatus.PENDING_CEO

    if (!canView) {
      return response.redirect().back()
    }

    // Get leave balance
    const currentYear = DateTime.now().year
    const leaveBalance = await LeaveService.calculateLeaveBalance(leave.userId, currentYear)

    // Get leave history
    const leaveHistory = await Leave.query()
      .where('user_id', leave.userId)
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [currentYear])
      .orderBy('created_at', 'desc')

    return view.render('pages/approvals/approval_details', {
      leave,
      userRole: user.roleId,
      leaveBalance,
      leaveHistory,
    })
  }

  async accept({ params, auth, response, session, request }: HttpContext) {
    const user = auth.user!

    if (![Role.DEPARTMENT_HEAD, Role.HR, Role.CEO].includes(user.roleId)) {
      session.flash('error', 'Unauthorized')
      return response.redirect().toRoute('leaves.index')
    }

    try {
      // 2. Find and verify leave status
      const leave = await Leave.query().where('id', params.id).firstOrFail()

      // 3. Verify correct status for role
      const validStatus =
        (user.roleId === Role.DEPARTMENT_HEAD && leave.status === LeaveStatus.PENDING) ||
        (user.roleId === Role.HR && leave.status === LeaveStatus.PENDING_HR) ||
        (user.roleId === Role.CEO && leave.status === LeaveStatus.PENDING_CEO)

      if (!validStatus) {
        session.flash('error', 'Invalid leave status for approval')
        return response.redirect().toRoute('approvals.index')
      }

      // 4. Create approval record
      const { comments } = request.only(['comments'])
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

      // 5. Update leave status
      const newStatus =
        user.roleId === Role.DEPARTMENT_HEAD
          ? LeaveStatus.PENDING_HR
          : user.roleId === Role.HR
            ? LeaveStatus.PENDING_CEO
            : LeaveStatus.APPROVED

      await leave.merge({ status: newStatus }).save()

      session.flash('success', 'Leave request approved')
      return response.redirect().toRoute('approvals.index')
    } catch (error) {
      session.flash('error', 'Failed to process approval')
      return response.redirect().toRoute('approvals.index')
    }
  }

  async reject({ params, auth, response, session, request }: HttpContext) {
    const user = auth.user!

    if (![Role.DEPARTMENT_HEAD, Role.HR, Role.CEO].includes(user.roleId)) {
      session.flash('error', 'Unauthorized')
      return response.redirect().toRoute('leaves.index')
    }

    try {
      const leave = await Leave.query().where('id', params.id).firstOrFail()

      const validStatus =
        (user.roleId === Role.DEPARTMENT_HEAD && leave.status === LeaveStatus.PENDING) ||
        (user.roleId === Role.HR && leave.status === LeaveStatus.PENDING_HR) ||
        (user.roleId === Role.CEO && leave.status === LeaveStatus.PENDING_CEO)

      if (!validStatus) {
        session.flash('error', 'Invalid leave status for rejection')
        return response.redirect().toRoute('approvals.index')
      }

      const { comments } = request.only(['comments'])
      await LeaveApproval.create({
        leaveId: leave.id,
        approverId: user.id,
        approverRole:
          user.roleId === Role.DEPARTMENT_HEAD
            ? 'DEPARTMENT_HEAD'
            : user.roleId === Role.HR
              ? 'HR'
              : 'CEO',
        action: 'REJECTED',
        comments,
      })

      await leave.merge({ status: LeaveStatus.REJECTED }).save()

      session.flash('success', 'Leave request rejected')
      return response.redirect().toRoute('approvals.index')
    } catch (error) {
      session.flash('error', 'Failed to process rejection')
      return response.redirect().toRoute('approvals.index')
    }
  }
}
