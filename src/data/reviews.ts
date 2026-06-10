export interface Review {
  name: string;
  text: string;
  rating: number;
}

export const reviews: Review[] = [
  {
    name: 'María G.',
    text: 'La milanesa de res es exactamente como la de la carnicería de barrio, pero mucho más práctico. Ya la compré tres veces.',
    rating: 5,
  },
  {
    name: 'Juan P.',
    text: 'Las hamburguesas Angus son un viaje de ida. Las cocinamos al sartén y quedan espectaculares. Relación precio-calidad increíble.',
    rating: 5,
  },
  {
    name: 'Lucía M.',
    text: 'Pido seguido. Las empanadas son gigantes y el relleno es casero de verdad. Llegan siempre bien congeladas.',
    rating: 5,
  },
  {
    name: 'Carlos R.',
    text: 'Muy buena atención y la entrega siempre en el horario pactado. Los ravioles de ricotta y espinaca son mis favoritos.',
    rating: 5,
  },
];
