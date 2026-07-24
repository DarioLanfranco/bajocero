export interface Review {
  name: string;
  text: string;
  rating: number;
}

export const reviews: Review[] = [
  {
    name: "Cecilia Lodeiro",
    text: "El lugar es muy lindo, bien ubicado en el norte de la ciudad. Compré varios productos, frescos, riquisimos y a muy buen precio. La atención excelente. Recomiendo!",
    rating: 5,
  },
  {
    name: "Maria Jose Molaioli",
    text: "Muy buena atención del personal, excelente calidad y gran variedad en productos !!",
    rating: 5,
  },
  {
    name: "Marcela Quinteros",
    text: "Muy buena atención!! Excelente calidad- precio !!!",
    rating: 5,
  },
  {
    name: "Pedro Lenardon",
    text: "Excelentes productos y atencion",
    rating: 5,
  },
];
