import { withBase } from "../utils/format";
import type { NavLink } from "../types/navigation";

export const NAV_LINKS: NavLink[] = [
  { label: "Inicio", href: withBase("/") },
  { label: "Conócenos", href: withBase("/conocenos") },
  { label: "Productos", href: withBase("/productos") },
  { label: "Info", href: withBase("/info") },
];
