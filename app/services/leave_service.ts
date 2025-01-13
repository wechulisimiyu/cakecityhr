import { DateTime } from 'luxon'
import Holiday from '#models/holiday'
import Leave from '#models/leave'
import User from '#models/user'
import Department from '#models/department'
import EmployeeSalary from '#models/employee_salary'
import { LeaveStatus } from '#enums/leave_status'
import { LeaveType } from '#enums/leave_type'

interface LiabilityReport {
  employeeId: number
  employeeName: string | null // this will be a problem I know
  departmentId: number | null
  departmentName: string // Will be 'Management' for null departments
  annualLeaveBalance: number
  dailyRate: number
  totalLiability: number
}

interface DepartmentLiability {
  departmentId: number
  departmentName: string
  total: number
}

export class LeaveService {
  /**
   * Calculate working days between two dates excluding weekends and holidays
   */
  static async calculateWorkingDays(startDate: DateTime, endDate: DateTime) {
    if (!startDate || !endDate || endDate < startDate) {
      throw new Error('Invalid date range')
    }

    // Get holidays between dates
    const holidays = await Holiday.query().whereBetween('date', [
      startDate.toFormat('yyyy-MM-dd'),
      endDate.toFormat('yyyy-MM-dd'),
    ])

    const holidayDates = new Set(holidays.map((h) => h.date.toFormat('yyyy-MM-dd')))

    let workingDays = 0
    let currentDate = startDate.startOf('day')
    const lastDate = endDate.endOf('day')

    while (currentDate <= lastDate) {
      // Skip weekends (6 = Saturday, 7 = Sunday)
      if (currentDate.weekday < 6) {
        // Skip holidays
        if (!holidayDates.has(currentDate.toFormat('yyyy-MM-dd'))) {
          workingDays++
        }
      }
      currentDate = currentDate.plus({ days: 1 })
    }

    return workingDays
  }

  /**
   * Calculate used leave days from approved leaves for a given year
   */
  static async calculateUsedLeaveDays(userId: number, year: number) {
    const startOfYear = DateTime.local(year, 1, 1)
    const endOfYear = DateTime.local(year, 12, 31)

    const approvedLeaves = await Leave.query()
      .where('user_id', userId)
      .where('status', LeaveStatus.APPROVED)
      .whereBetween('start_date', [
        startOfYear.toFormat('yyyy-MM-dd'),
        endOfYear.toFormat('yyyy-MM-dd'),
      ])

    const usedDays = {
      annual: 0,
      sick: 0,
      paternity: 0,
      maternity: 0,
      compassionate: 0,
      unpaid: 0,
    }

    for (const leave of approvedLeaves) {
      const workingDays = await this.calculateWorkingDays(leave.startDate, leave.endDate)

      switch (leave.type) {
        case LeaveType.ANNUAL:
          usedDays.annual += workingDays
          break
        case LeaveType.SICK:
          usedDays.sick += workingDays
          break
        case LeaveType.PATERNITY:
          usedDays.paternity += workingDays
          break
        case LeaveType.MATERNITY:
          usedDays.maternity += workingDays
          break
        case LeaveType.COMPASSIONATE:
          usedDays.compassionate += workingDays
          break
        case LeaveType.UNPAID:
          usedDays.unpaid += workingDays
          break
        default:
          console.warn(`Unhandled leave type: ${leave.type}`)
      }
    }

    return usedDays
  }

  /**
   * Calculate remaining leave balance for a user
   */
  static async calculateLeaveBalance(userId: number, year: number) {
    const usedDays = await this.calculateUsedLeaveDays(userId, year)

    return {
      annual: 21 - usedDays.annual,
      sick: 14 - usedDays.sick,
      paternity: 14 - usedDays.paternity,
      maternity: 90 - usedDays.maternity,
      compassionate: 7 - usedDays.compassionate,
      unpaid: Infinity,
    }
  }

  static readonly WORKING_DAYS_PER_YEAR = 260

  static async calculateEmployeeLiability(userId: number): Promise<LiabilityReport> {
    const user = await User.findOrFail(userId)
    const currentSalary = await EmployeeSalary.query()
      .where('user_id', userId)
      .where('is_current_salary', true)
      .firstOrFail()

    if (!currentSalary) {
      return {
        employeeId: userId,
        employeeName: user.fullName,
        departmentId: user.departmentId,
        departmentName: user.department?.name ?? 'Management',
        annualLeaveBalance: 0,
        dailyRate: 0,
        totalLiability: 0,
      }
    }

    // For users without department (CEO, HR), return Management
    const department = await user.related('department').query().first()
    const departmentName = department?.name ?? 'Management'

    const leaveBalance = await this.calculateLeaveBalance(userId, DateTime.now().year)
    const dailyRate = currentSalary.annualBaseSalary / this.WORKING_DAYS_PER_YEAR
    const liability = leaveBalance.annual * dailyRate

    return {
      employeeId: userId,
      employeeName: user.fullName,
      departmentId: department?.id ?? null,
      departmentName,
      annualLeaveBalance: leaveBalance.annual,
      dailyRate,
      totalLiability: liability,
    }
  }

  static async calculateDepartmentLiability(departmentId: number): Promise<{
    departmentName: string
    totalLiability: number
    employeeLiabilities: LiabilityReport[]
  }> {
    const department = await Department.findOrFail(departmentId)
    if (!department.name) {
      throw new Error(`Department ${departmentId} must have a name`)
    }

    const employees = await User.query().where('department_id', departmentId)
    const liabilities = await Promise.all(
      employees.map((employee) => this.calculateEmployeeLiability(employee.id))
    )

    return {
      departmentName: department.name,
      totalLiability: liabilities.reduce((sum, l) => sum + l.totalLiability, 0),
      employeeLiabilities: liabilities,
    }
  }

  static async calculateCompanyLiability(): Promise<{
    totalLiability: number
    departmentLiabilities: DepartmentLiability[]
    managementLiability: number
  }> {
    const departments = await Department.all()
    const departmentLiabilities = await Promise.all(
      departments.map(async (dept) => {
        const deptLiability = await this.calculateDepartmentLiability(dept.id)
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          total: deptLiability.totalLiability,
        }
      })
    )

    // Calculate liability for users without department
    const managementUsers = await User.query().whereNull('department_id')
    const managementLiability = await Promise.all(
      managementUsers.map((user) => this.calculateEmployeeLiability(user.id))
    ).then((managementResults) => managementResults.reduce((sum, l) => sum + l.totalLiability, 0))

    return {
      totalLiability:
        departmentLiabilities.reduce((sum, l) => sum + l.total, 0) + managementLiability,
      departmentLiabilities,
      managementLiability,
    }
  }
}
