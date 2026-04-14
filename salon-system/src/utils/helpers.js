/**
 * Slugify for SEO filenames: remove diacritics, spaces, special chars.
 * e.g. "Čištění pleti" -> "cisteni-pleti"
 */
export function slugify(text) {
  if (text == null || typeof text !== 'string') return '';
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Normalized category: STANDARD (cosmetics) vs PMU. Handles legacy lowercase 'pmu'. */
function normalizeCategory(category) {
  const c = (category || 'STANDARD').toString().toUpperCase();
  return c === 'PMU' ? 'PMU' : 'STANDARD';
}

/** Known PMU service name substrings – used when category is not set in Firestore. */
const KNOWN_PMU_NAMES = ['meziřasová linka', 'rty', 'pudrové obočí', 'soft lips'];

function isPmuByName(name) {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase();
  return KNOWN_PMU_NAMES.some((pattern) => lower.includes(pattern));
}

/** True if service is PMU (category 'PMU' or 'pmu', or known PMU name when category missing). */
export function isPmuService(service) {
  if (!service) return false;
  if (service.category !== undefined && service.category !== null && String(service.category).trim() !== '') {
    return normalizeCategory(service.category) === 'PMU';
  }
  return isPmuByName(service.name);
}

/** Služby bez PMU: category === 'STANDARD' nebo ne-PMU. PMU = category 'PMU' nebo známé PMU názvy. */
export function filterCosmeticsServices(services) {
  if (!Array.isArray(services)) return [];
  return services.filter((s) => !isPmuService(s));
}

/** Služby s category === 'PMU' (case-insensitive). */
export function filterPmuServices(services) {
  if (!Array.isArray(services)) return [];
  return services.filter((s) => isPmuService(s));
}

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

  /** dateKey DD-MM-YYYY → krátký den v týdnu (Po, Út, …) */
  getDayOfWeekShort: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const labels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return labels[day] || '';
  },

  /** dateKey → "Po 02/02" pro zobrazení v seznamu směn */
  formatDateWithDayShort: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-').map(Number);
    const dayIdx = new Date(y, m - 1, d).getDay();
    const labels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
    return `${labels[dayIdx] || ''} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  },

  /** dateKey → "Úterý 03/02" pro nadpis editace */
  formatDateWithDayLong: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-').map(Number);
    const dayIdx = new Date(y, m - 1, d).getDay();
    const labels = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    return `${labels[dayIdx] || ''} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  },

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

  /** dateKey DD-MM-YYYY → ISO YYYY-MM-DD (pro type="date" a setAdminDateInput). */
  getISOFromDateKey: (dateKey) => {
    if (!dateKey) return '';
    const [d, m, y] = dateKey.split('-');
    return `${y}-${m}-${d}`;
  },

  /**
   * Vrátí nejbližší datum s alespoň jednou rezervací (dnes nebo v budoucnu).
   * reservations: pole objektů s .date (DD-MM-YYYY).
   * Návrat: ISO řetězec YYYY-MM-DD.
   */
  getNearestDateWithReservations: (reservations) => {
    const todayISO = Utils.getLocalISODate();
    const todayKey = Utils.getDateKeyFromISO(todayISO);
    const todayNum = parseInt(todayKey.split('-').reverse().join(''), 10); // YYYYMMDD pro porovnání
    const futureDates = [...new Set((reservations || []).map((r) => r.date).filter(Boolean))]
      .map((key) => ({ key, num: parseInt(key.split('-').reverse().join(''), 10) }))
      .filter(({ num }) => num >= todayNum)
      .sort((a, b) => a.num - b.num);
    if (futureDates.length === 0) return todayISO;
    const firstKey = futureDates[0].key;
    return firstKey === todayKey ? todayISO : Utils.getISOFromDateKey(firstKey);
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

  /**
   * HTTPS URL na Cloud Function calendarIcs – tlačítko „Přidat do Apple Kalendáře“ v e-mailu.
   * projectId: např. import.meta.env.VITE_FIREBASE_PROJECT_ID
   */
  createCalendarIcsHttpUrl: (projectId, dateStr, timeStr, durationMinutes, title, description) => {
    if (!projectId) return '';
    let year, month, day;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        [year, month, day] = parts;
      } else {
        [day, month, year] = parts;
      }
    } else {
      return '';
    }
    const startDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    if (Number.isNaN(startDate.getTime())) return '';
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const compact = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const base = `https://europe-west1-${projectId}.cloudfunctions.net/calendarIcs`;
    const params = new URLSearchParams({
      start: compact(startDate),
      end: compact(endDate),
      sum: (title || 'Rezervace Skin Studio').slice(0, 500),
    });
    if (description) params.set('desc', String(description).slice(0, 4000));
    params.set('loc', 'Masarykovo nám. 72, Uherský Brod');
    return `${base}?${params.toString()}`;
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