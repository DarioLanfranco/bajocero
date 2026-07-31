import type { Product } from '../types/Product';
import type { TipoVentaKey } from '../types/tipoVenta';
import { formatPrice } from '../utils/format';
import { log } from '../utils/logger';
import { PRODUCT_GROUPS, productInRange } from '../data/catalog';

function presentacionShort(tipoVenta: TipoVentaKey): string {
  const map: Record<TipoVentaKey, string> = {
    kg: 'x kg',
    unidad: 'x 500 g',
    unidad400: 'x 400 g',
    pack: 'x un.',
  };
  return map[tipoVenta];
}

type PdfCtx = {
  doc: import('jspdf').jsPDF;
  pageW: number;
  pageH: number;
  margin: number;
  contentW: number;
  y: { value: number };
};

function addPageIfNeeded(ctx: PdfCtx, needed: number): void {
  if (ctx.y.value + needed > ctx.pageH - ctx.margin) {
    ctx.doc.addPage();
    ctx.y.value = ctx.margin;
  }
}

function wrapText(doc: import('jspdf').jsPDF, text: string, maxW: number): string[] {
  if (doc.getTextWidth(text) <= maxW) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (doc.getTextWidth(test) > maxW) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawMainHeader(ctx: PdfCtx, date: string): void {
  const { doc, pageW, margin, contentW } = ctx;
  addPageIfNeeded(ctx, 30);
  doc.setFillColor(10, 10, 46);
  doc.rect(margin, ctx.y.value, contentW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BAJO CERO', pageW / 2, ctx.y.value + 14, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CALIDAD · PRECIO · TIEMPO', pageW / 2, ctx.y.value + 19, { align: 'center' });
  ctx.y.value += 28;

  doc.setFontSize(9);
  doc.setTextColor(136, 136, 136);
  doc.setFont('helvetica', 'normal');
  doc.text(`Lista de precios — ${date}`, pageW - margin, ctx.y.value, { align: 'right' });
  ctx.y.value += 10;
}

function drawGroupHeader(ctx: PdfCtx, groupName: string): void {
  const { doc, margin, contentW } = ctx;
  addPageIfNeeded(ctx, 20);
  doc.setFillColor(245, 245, 255);
  doc.setDrawColor(26, 26, 94);
  doc.rect(margin, ctx.y.value - 2, contentW, 8, 'F');
  doc.line(margin, ctx.y.value - 2, margin, ctx.y.value + 6);
  doc.setTextColor(26, 26, 94);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(groupName, margin + 4, ctx.y.value + 4);
  ctx.y.value += 12;

  addPageIfNeeded(ctx, 7);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 94);
  doc.text('Producto', margin + 2, ctx.y.value);
  doc.text('Precio', margin + contentW - 50, ctx.y.value, { align: 'right' });
  doc.text('Presentación', margin + contentW - 2, ctx.y.value, { align: 'right' });
  doc.line(margin, ctx.y.value + 1, margin + contentW, ctx.y.value + 1);
  ctx.y.value += 7;
}

function drawProductRow(ctx: PdfCtx, product: Product): void {
  const { doc, margin, contentW } = ctx;
  const lineH = 6;
  addPageIfNeeded(ctx, lineH);
  const nameLines = wrapText(doc, product.name, contentW - 62);
  const rowH = nameLines.length * lineH;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  let nameY = ctx.y.value;
  for (const nl of nameLines) {
    doc.text(nl, margin + 2, nameY);
    nameY += lineH;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(formatPrice(product.price), margin + contentW - 50, ctx.y.value + lineH - 1, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(136, 136, 136);
  doc.text(presentacionShort(product.tipoVenta), margin + contentW - 2, ctx.y.value + lineH - 1, { align: 'right' });

  doc.setDrawColor(224, 224, 224);
  doc.line(margin, ctx.y.value + rowH - 1, margin + contentW, ctx.y.value + rowH - 1);
  ctx.y.value += rowH;
}

function drawFooter(ctx: PdfCtx): void {
  const { doc, pageW, margin, contentW } = ctx;
  addPageIfNeeded(ctx, 12);
  doc.setDrawColor(238, 238, 238);
  doc.line(margin, ctx.y.value, margin + contentW, ctx.y.value);
  ctx.y.value += 4;
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);
  doc.setFont('helvetica', 'normal');
  doc.text('Bajo Cero — Precios sujetos a cambio sin previo aviso', pageW / 2, ctx.y.value, { align: 'center' });
}

function renderProductGroups(ctx: PdfCtx, available: Product[]): void {
  for (const group of PRODUCT_GROUPS) {
    const items = available
      .filter((p) => productInRange(p, group))
      .sort((a, b) => Number(a.id) - Number(b.id));
    if (items.length === 0) continue;

    drawGroupHeader(ctx, group.name);

    for (const product of items) {
      drawProductRow(ctx, product);
    }

    ctx.y.value += 6;
  }
}

export async function exportCatalogToPdf(products: Product[]): Promise<void> {
  const safeProducts = Array.isArray(products) ? products : [];
  if (safeProducts.length === 0) {
    log('pdfExport', 'error', 'No products available to export');
    return;
  }
  const available = safeProducts.filter((p) => p.isAvailable);
  if (available.length === 0) {
    log('pdfExport', 'warn', 'No available products to export');
    return;
  }

  const date = new Date().toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentW = pageW - margin * 2;
    const ctx: PdfCtx = { doc, pageW, pageH, margin, contentW, y: { value: margin } };

    drawMainHeader(ctx, date);
    renderProductGroups(ctx, available);
    drawFooter(ctx);

    doc.save(`bajocero-precios-${date.replace(/\s+/g, '-')}.pdf`);
    log('pdfExport', 'info', 'PDF exported successfully');
  } catch (error) {
    log('pdfExport', 'error', `PDF export failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
