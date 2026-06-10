export interface FAQItem {
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    question: '¿Cómo se conservan y cuánto duran?',
    answer:
      'Nuestros productos están diseñados para conservarse en freezer a -18°C. En estas condiciones, cada pieza mantiene su calidad óptima entre 3 y 6 meses, según el producto. Recomendamos mantenerlos en su envase original al vacío para preservar textura, aroma y sabor. Una vez abiertos, consumir dentro de las 24 horas posteriores y mantener refrigerados.',
  },
  {
    question: '¿Los alimentos una vez descongelados se pueden volver a congelar?',
    answer:
      'No. Por razones de seguridad alimentaria y para preservar la textura, el sabor y la calidad microbiológica de nuestros productos gourmet, una vez descongelados no deben volverse a congelar. La cadena de frío es fundamental para garantizar la excelencia de cada bocado. Descongelá solo la porción que vayas a consumir y mantené el resto en freezer.',
  },
  {
    question: '¿Cuáles son los métodos de pago?',
    answer:
      'Aceptamos transferencia bancaria, efectivo al momento de retirar o recibir el pedido, y Mercado Pago. Coordinamos el medio que te sea más cómodo al momento de confirmar tu pedido por WhatsApp.',
  },
];
