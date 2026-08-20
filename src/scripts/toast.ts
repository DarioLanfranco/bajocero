type ToastType = "success" | "error" | "default";
type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
}

interface ToastItem {
  id: number;
  el: HTMLElement;
  timer: ReturnType<typeof setTimeout>;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgIcon(
  path: string,
  viewBox = "0 0 20 20",
  clipRule?: string,
): SVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("fill", "currentColor");

  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("fill-rule", "evenodd");
  p.setAttribute("d", path);
  if (clipRule) p.setAttribute("clip-rule", clipRule);
  svg.appendChild(p);

  return svg;
}

function createCloseIcon(): SVGElement {
  const ns = SVG_NS;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");

  const line1 = document.createElementNS(ns, "line");
  line1.setAttribute("x1", "18");
  line1.setAttribute("y1", "6");
  line1.setAttribute("x2", "6");
  line1.setAttribute("y2", "18");

  const line2 = document.createElementNS(ns, "line");
  line2.setAttribute("x1", "6");
  line2.setAttribute("y1", "6");
  line2.setAttribute("x2", "18");
  line2.setAttribute("y2", "18");

  svg.append(line1, line2);
  return svg;
}

const SUCCESS_ICON_PATH =
  "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z";
const ERROR_ICON_PATH =
  "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z";

let nextId = 1;
const active: ToastItem[] = [];
const MAX_VISIBLE = 3;
const BASE_DURATION = 1000;
const SUCCESS_DURATION = 600;
const REMOVE_TRANSITION_MS = 200;

function getContainer(position: ToastPosition): HTMLElement {
  const id = `toast-container-${position}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("ol");
    el.id = id;
    el.className = "toast-container";
    el.setAttribute("data-position", position);
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Notifications");
    document.body.appendChild(el);
  }
  return el;
}

function createToastEl(config: ToastConfig): HTMLElement {
  const li = document.createElement("li");
  li.className = "toast";
  li.setAttribute("data-type", config.type || "default");
  li.setAttribute("role", "status");

  const content = document.createElement("div");
  content.className = "toast__content";

  const title = document.createElement("span");
  title.className = "toast__title";
  title.textContent = config.message;

  content.appendChild(title);
  li.appendChild(content);

  if (config.type && config.type !== "default") {
    const icon = document.createElement("span");
    icon.className = `toast__icon toast__icon--${config.type}`;
    const iconSvg =
      config.type === "success"
        ? svgIcon(SUCCESS_ICON_PATH, "0 0 20 20", "evenodd")
        : svgIcon(ERROR_ICON_PATH, "0 0 20 20", "evenodd");
    icon.appendChild(iconSvg);
    li.insertBefore(icon, content);
  }

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast__close";
  closeBtn.setAttribute("aria-label", "Cerrar");
  closeBtn.appendChild(createCloseIcon());
  li.appendChild(closeBtn);

  return li;
}

function layoutToasts(): void {
  const containers = document.querySelectorAll<HTMLElement>(".toast-container");
  for (const container of containers) {
    const items = container.querySelectorAll<HTMLElement>(".toast");
    items.forEach((el, i) => {
      el.style.display = i >= MAX_VISIBLE ? "none" : "";
    });
  }
}

function removeToast(id: number): void {
  const idx = active.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const item = active[idx];
  clearTimeout(item.timer);
  active.splice(idx, 1);

  item.el.classList.remove("toast--visible");

  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    item.el.remove();
    layoutToasts();
  }

  item.el.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, REMOVE_TRANSITION_MS);
}

function showToast(config: ToastConfig): number {
  const position = config.position || "top-right";
  const container = getContainer(position);
  const el = createToastEl(config);
  container.appendChild(el);

  const id = nextId++;
  const fallback = config.type === "success" ? SUCCESS_DURATION : BASE_DURATION;
  const duration = config.duration !== undefined ? config.duration : fallback;

  requestAnimationFrame(() => {
    el.classList.add("toast--visible");
    layoutToasts();
  });

  const closeBtn = el.querySelector(".toast__close");
  closeBtn?.addEventListener("click", () => removeToast(id));

  const timer = setTimeout(() => removeToast(id), duration);

  active.push({ id, el, timer });
  return id;
}

export function showProductAdded(name: string): void {
  showToast({ message: `${name} agregada al carrito`, type: "success" });
}

export function showQuantityUpdated(name: string, quantity: number): void {
  showToast({ message: `${name} x${quantity}`, type: "success" });
}

export function showProductRemoved(name: string): void {
  showToast({ message: `${name} eliminada del carrito` });
}

export function showCartCleared(): void {
  showToast({ message: "Carrito vaciado correctamente" });
}

export function showErrorToast(message: string): void {
  showToast({ message, type: "error" });
}
