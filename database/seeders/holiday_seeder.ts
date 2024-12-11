import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Holiday from '#models/holiday'
import { DateTime } from 'luxon'

export default class HolidaySeeder extends BaseSeeder {
  async run() {
    // Delete existing records
    await Holiday.truncate()

    const currentYear = DateTime.now().year

    // Fixed date holidays
    const fixedHolidays = [
      {
        name: 'New Year Day',
        date: `${currentYear}-01-01`,
        isRecurringYearly: true,
      },
      {
        name: 'Labour Day',
        date: `${currentYear}-05-01`,
        isRecurringYearly: true,
      },
      {
        name: 'Madaraka Day',
        date: `${currentYear}-06-01`,
        isRecurringYearly: true,
      },
      {
        name: 'Utamaduni Day',
        date: `${currentYear}-10-10`,
        isRecurringYearly: true,
      },
      {
        name: 'Mashujaa Day',
        date: `${currentYear}-10-20`,
        isRecurringYearly: true,
      },
      {
        name: 'Jamhuri Day',
        date: `${currentYear}-12-12`,
        isRecurringYearly: true,
      },
      {
        name: 'Christmas Day',
        date: `${currentYear}-12-25`,
        isRecurringYearly: true,
      },
      {
        name: 'Boxing Day',
        date: `${currentYear}-12-26`,
        isRecurringYearly: true,
      },
    ]

    // Variable date holidays for current year
    const variableHolidays = [
      {
        name: 'Good Friday',
        date: '2024-03-29', // Changes yearly
        isRecurringYearly: false,
      },
      {
        name: 'Easter Monday',
        date: '2024-04-01', // Changes yearly
        isRecurringYearly: false,
      },
      {
        name: 'Idd-ul-Fitr',
        date: '2024-04-10', // Approximate, changes yearly
        isRecurringYearly: false,
      },
      {
        name: 'Idd-ul-Adha',
        date: '2024-06-17', // Approximate, changes yearly
        isRecurringYearly: false,
      },
    ]

    // Combine and create all holidays
    const allHolidays = [...fixedHolidays, ...variableHolidays]

    for (const holiday of allHolidays) {
      await Holiday.create({
        name: holiday.name,
        date: DateTime.fromISO(holiday.date),
        isRecurringYearly: holiday.isRecurringYearly,
      })
    }

    console.log('Holidays seeded successfully')
  }
}
