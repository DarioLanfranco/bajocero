export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
}

export const LEGAL_PAGES: Record<string, PageMeta> = {
  terminos: {
    title: 'Términos y Condiciones — Bajo Cero',
    description:
      'Términos y condiciones de uso del sitio web Bajo Cero. Información sobre pedidos, entregas y política de cambios.',
  },
  privacidad: {
    title: 'Política de Privacidad — Bajo Cero',
    description:
      'Política de privacidad de Bajo Cero. Conocé cómo protegemos tus datos personales.',
  },
};
