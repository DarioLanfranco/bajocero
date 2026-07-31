interface Holiday {
  mes: number;
  dia: number;
  motivo?: string;
}

export function initStatusBadge(): void {
  const badge = document.getElementById('status-badge');
  if (!badge) throw new Error('status-badge not found');
  const dot = badge.querySelector('.status-badge__dot');
  const textEl = badge.querySelector('.status-badge__text');
  if (!dot || !textEl) throw new Error('status-badge children not found');

  const TZ = 'America/Argentina/Cordoba';
  const MORNING_OPEN = 9 * 60;
  const MORNING_CLOSE = 14 * 60;
  const AFTERNOON_OPEN = 16 * 60;
  const AFTERNOON_CLOSE = 20 * 60 + 30;

  let holidays: Holiday[] = [];
  try {
    holidays = JSON.parse(badge.dataset.holidays || '[]');
  } catch {}

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(now);

  const get = (t: string) => {
    const f = parts.find((p) => p.type === t);
    return f ? parseInt(f.value, 10) : 0;
  };
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const weekday = (() => {
    const wd = parts.find((p) => p.type === 'weekday');
    const MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return wd ? MAP[wd.value] ?? 0 : 0;
  })();

  const totalMin = hour * 60 + minute;
  const isHoliday = holidays.some((h) => h.mes === month && h.dia === day);
  let isOpen: boolean;
  let text: string;

  if (isHoliday) {
    const h = holidays.find((hh) => hh.mes === month && hh.dia === day);
    isOpen = false;
    text = h && h.motivo ? 'Cerrado por Feriado | ' + h.motivo : 'Cerrado por Feriado';
  } else if (weekday === 0) {
    isOpen = false;
    text = 'Cerrado | Abrimos el lunes a las 09:00';
  } else if (totalMin >= MORNING_OPEN && totalMin < MORNING_CLOSE) {
    isOpen = true;
    text = 'Abierto ahora | Cierra a las 14:00';
  } else if (totalMin >= AFTERNOON_OPEN && totalMin < AFTERNOON_CLOSE) {
    isOpen = true;
    text = 'Abierto ahora | Cierra a las 20:30';
  } else if (totalMin >= MORNING_CLOSE && totalMin < AFTERNOON_OPEN) {
    isOpen = false;
    text = 'Cerrado | Abrimos hoy a las 16:00';
  } else if (totalMin < MORNING_OPEN) {
    isOpen = false;
    text = 'Cerrado | Abrimos hoy a las 09:00';
  } else if (weekday === 6) {
    isOpen = false;
    text = 'Cerrado | Abrimos el lunes a las 09:00';
  } else {
    isOpen = false;
    text = 'Cerrado | Abrimos mañana a las 09:00';
  }

  badge.classList.add(isOpen ? 'status-badge--open' : 'status-badge--closed');
  textEl.textContent = text;
}
