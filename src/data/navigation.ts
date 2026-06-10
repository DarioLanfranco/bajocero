import type { NavLink } from "../types/navigation";

export const NAV_LINKS: NavLink[] = [
  { label: "Inicio", href: "inicio" },
  { label: "Conócenos", href: "conocenos" },
  { label: "Productos", href: "productos" },
  { label: "Ofertas", href: "ofertas" },
] as const;
