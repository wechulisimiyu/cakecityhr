import { DateTime } from 'luxon'
import Holiday from '#models/holiday'
import Leave from '#models/leave'
import { LeaveStatus } from '#enums/leave_status'
import { LeaveType } from '#enums/leave_type'

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
}
