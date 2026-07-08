export interface Holiday {
  mes: number;
  dia: number;
  motivo: string;
}

const HOLIDAYS_2026: Holiday[] = [
  { mes: 1,  dia: 1,  motivo: 'Año Nuevo' },
  { mes: 3,  dia: 24, motivo: 'Día de la Memoria' },
  { mes: 4,  dia: 2,  motivo: 'Día del Veterano' },
  { mes: 4,  dia: 3,  motivo: 'Viernes Santo' },
  { mes: 5,  dia: 1,  motivo: 'Día del Trabajador' },
  { mes: 5,  dia: 25, motivo: 'Revolución de Mayo' },
  { mes: 6,  dia: 22, motivo: 'Día de la Bandera' },
  { mes: 7,  dia: 9,  motivo: 'Día de la Independencia' },
  { mes: 8,  dia: 17, motivo: 'Paso a la Inmortalidad de San Martín' },
  { mes: 10, dia: 12, motivo: 'Día del Respeto a la Diversidad Cultural' },
  { mes: 11, dia: 23, motivo: 'Día de la Soberanía Nacional' },
  { mes: 12, dia: 8,  motivo: 'Inmaculada Concepción' },
  { mes: 12, dia: 25, motivo: 'Navidad' },
];

export function getHolidays(): Holiday[] {
  return HOLIDAYS_2026;
}
