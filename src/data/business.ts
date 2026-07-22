import type { BusinessInfo } from "../types/Business";

export const business: BusinessInfo = {
  name: "Bajo Cero",
  slogan: "El sabor del instante.",
  description:
    "De tu freezer a la mesa en minutos. Descubrí una experiencia gastronómica única con ingredientes seleccionados.",
  phone: "+54 358 4201263",
  whatsapp: "+543586006854",
  email: "",
  address: "Av. Roberto Payró 913, Río Cuarto, Córdoba, Argentina",
  addressShort: "Payró 913, Río Cuarto",
  instagram: "bajocero.riocuarto",
  facebook: "",
  hours: [
    { days: "Lun–Sáb", hours: "9:00–14:00 | 16:00–20:30" },
    { days: "Dom y Feriados", hours: "Cerrado" },
  ],
  hoursStructured: {
    morning: { open: 540, close: 840 },
    afternoon: { open: 960, close: 1230 },
    closedWeekdays: [0],
  },
  deliveryZones: [],
};
