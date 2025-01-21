import Calendar from '@event-calendar/core'
import DayGrid from '@event-calendar/day-grid'
import Alpine from 'alpinejs'

Alpine.start()

window.initCalendar = function (events) {
  const calendarEl = document.getElementById('calendar')
  if (!calendarEl) {
    console.error('Calendar element not found')
    return
  }

  const calendar = new Calendar({
    target: calendarEl,
    props: {
      plugins: [DayGrid],
      options: {
        view: 'dayGridMonth',
        events: events.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        })),
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        },
        height: 'auto'
      }
    }
  })

  return calendar
}