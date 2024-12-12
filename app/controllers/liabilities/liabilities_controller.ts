import { HttpContext } from '@adonisjs/core/http'
import { LeaveService } from '#services/leave_service'

export default class LiabilityController {
  async index({ view }: HttpContext) {
    const companyLiability = await LeaveService.calculateCompanyLiability()
    return view.render('pages/dashboard/liability/index', { companyLiability })
  }

  async department({ view, params }: HttpContext) {
    const departmentLiability = await LeaveService.calculateDepartmentLiability(params.id)
    return view.render('pages/dashboard/liability/department', { departmentLiability })
  }

  async employee({ view, params }: HttpContext) {
    const employeeLiability = await LeaveService.calculateEmployeeLiability(params.id)
    return view.render('pages/dashboard/liability/employee', { employeeLiability })
  }
}
