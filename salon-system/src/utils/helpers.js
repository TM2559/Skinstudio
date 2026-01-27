export const Utils = {
  timeToMinutes: (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },
  
  minutesToTime: (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },
  
  formatDateKey: (dateObj) => {
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  },
  
  formatDateDisplay: (dateKey) => dateKey ? dateKey.replace(/-/g, '/') : "",
  
  getDateKeyFromISO: (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split('-').map(Number);
    return `${d.toString().padStart(2, '0')}-${m.toString().padStart(2, '0')}-${y}`;
  },
  
  getLocalISODate: () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  },
  
  generateTimeOptions: () => {
    const opts = [];
    for (let i = 6; i <= 22; i++) {
      const h = i.toString().padStart(2, '0');
      opts.push(`${h}:00`, `${h}:30`);
    }
    return opts;
  },

  // --- HYBRIDNÍ LOGIKA (CLUSTERING v2) ---
  getSmartSlots: (periods, duration, bookedIntervals, step = 30) => {
    let slots = [];
    
    // Zjistíme, jestli už je ten den někdo objednaný
    const hasBookings = bookedIntervals.length > 0;

    // ZMĚNA: Přísný "Magnet" režim zapínáme JEN PRO KRÁTKÉ SLUŽBY a JEN POKUD UŽ NĚKDO JE OBJEDNANÝ.
    // Pokud je den prázdný (!hasBookings), chováme se "Free" i pro krátké služby.
    const isStrict = (duration <= 30) && hasBookings;
    
    periods.forEach(p => {
      const startMin = Utils.timeToMinutes(p.start);
      const endMin = Utils.timeToMinutes(p.end);

      for (let t = startMin; t <= endMin - duration; t += step) {
        const tEnd = t + duration;
        const timeStr = Utils.minutesToTime(t);

        const isCollision = bookedIntervals.some(r => (t < r.end && tEnd > r.start));
        
        if (!isCollision) {
          if (!isStrict) {
            // VOLNÝ REŽIM (buď je to dlouhá služba, NEBO je den prázdný) -> Bereme vše
            if (!slots.includes(timeStr)) slots.push(timeStr);
          } else {
            // PŘÍSNÝ MAGNET REŽIM (krátká služba A den už má rezervace)
            
            // Lepíme se JEN k existujícím rezervacím
            const touchesPrevRes = bookedIntervals.some(r => r.end === t);
            const touchesNextRes = bookedIntervals.some(r => r.start === tEnd);

            if (touchesPrevRes || touchesNextRes) {
               if (!slots.includes(timeStr)) slots.push(timeStr);
            }
          }
        }
      }
    });

    return slots.sort();
  },

  // ... (Kalendářové funkce) ...
  createGoogleCalendarLink: (dateStr, timeStr, durationMinutes, title, description) => {
    let year, month, day;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) { [year, month, day] = parts; } 
        else { [day, month, year] = parts; }
    }
    const startDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const format = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = new URL("https://www.google.com/calendar/render");
    url.searchParams.append("action", "TEMPLATE");
    url.searchParams.append("text", title);
    url.searchParams.append("dates", `${format(startDate)}/${format(endDate)}`);
    url.searchParams.append("details", description);
    url.searchParams.append("location", "Skin Studio");
    return url.toString();
  },

  downloadICSFile: (dateStr, timeStr, durationMinutes, title, description) => {
    let year, month, day;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) { [year, month, day] = parts; } 
        else { [day, month, year] = parts; }
    }
    const startDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`, `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${description}`, 'LOCATION:Skin Studio',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'rezervace_skinstudio.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};