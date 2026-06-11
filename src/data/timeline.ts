export interface TimelineStep {
  number: number;
  title: string;
  text: string;
}

export const timelineSteps: TimelineStep[] = [
  {
    number: 1,
    title: 'Elegís',
    text: 'Explorás nuestro catálogo seleccionado de alta calidad y elegís tus productos.',
  },
  {
    number: 2,
    title: 'Agregás',
    text: 'Sumás las piezas al carrito con un solo toque, sin interrupciones.',
  },
  {
    number: 3,
    title: 'Pedís',
    text: 'Confirmás tu orden de forma directa y ágil a través de WhatsApp.',
  },
  {
    number: 4,
    title: 'Retirás o Recibís',
    text: 'Retirás por nuestro punto exclusivo en Río Cuarto o nuestro cadete te lo entrega en perfectas condiciones.',
  },
];
