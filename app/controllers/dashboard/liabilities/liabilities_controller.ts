import { HttpContext } from '@adonisjs/core/http'
import { LeaveService } from '#services/leave_service'

export default class LiabilityController {
  async index({ view }: HttpContext) {
    try {
      const companyLiability = await LeaveService.calculateCompanyLiability()
      return view.render('pages/dashboard/liability/index', {
        companyLiability,
        title: 'Company Leave Liability',
      })
    } catch (error) {
      return view.render('pages/errors/server_error', { error })
    }
  }

  async department({ view, params }: HttpContext) {
    try {
      const departmentLiability = await LeaveService.calculateDepartmentLiability(params.id)
      return view.render('pages/dashboard/liability/department', {
        departmentLiability,
        employees: departmentLiability.employeeLiabilities,
        title: `${departmentLiability.departmentName} Department Liability`,
      })
    } catch (error) {
      return view.render('pages/errors/server-error')
    }
  }

  async employee({ view, params }: HttpContext) {
    try {
      const employeeLiability = await LeaveService.calculateEmployeeLiability(params.id)
      const leaveBalance = await LeaveService.calculateLeaveBalance(
        params.id,
        new Date().getFullYear()
      )

      return view.render('pages/dashboard/liability/employee', {
        employeeLiability,
        leaveBalance,
        title: `${employeeLiability.employeeName}'s Leave Liability`,
      })
    } catch (error) {
      return view.render('pages/errors/server-error')
    }
  }
}
