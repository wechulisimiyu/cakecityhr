// import '@fullcalendar/core/main.css'
// import '@fullcalendar/daygrid/main.css'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'

window.initCalendar = function(events) {
    const calendarEl = document.getElementById('calendar')
    if (!calendarEl) return
  
    const calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      events: events,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
      },
      height: 'auto'
    })
  
    calendar.render()
  }