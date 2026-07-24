import type { Product } from '../types/Product';
import type { TipoVentaKey } from '../types/tipoVenta';
import { formatPrice } from '../utils/format';
import { log } from '../utils/logger';

const PRODUCT_GROUPS = [
  { name: 'AL FUEGO', range: [1, 29] as [number, number] },
  { name: 'PESCADOS', range: [30, 49] as [number, number] },
  { name: 'VEGETARIANO', range: [50, 60] as [number, number] },
  { name: 'PASTAS Y PRÁCTICOS', range: [61, 80] as [number, number] },
] as const;

function productInRange(product: Product, range: [number, number]): boolean {
  const plu = Number(product.id);
  return Number.isFinite(plu) && plu >= range[0] && plu <= range[1];
}

function presentacionShort(tipoVenta: TipoVentaKey): string {
  const map: Record<TipoVentaKey, string> = {
    kg: 'x kg',
    unidad: 'x 500 g',
    unidad400: 'x 400 g',
    pack: 'x un.',
  };
  return map[tipoVenta];
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
    let y = margin;

    function addPageIfNeeded(needed: number): void {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    }

    function wrapText(text: string, maxW: number): string[] {
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

    addPageIfNeeded(30);
    doc.setFillColor(10, 10, 46);
    doc.rect(margin, y, contentW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BAJO CERO', pageW / 2, y + 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('CALIDAD · PRECIO · TIEMPO', pageW / 2, y + 19, { align: 'center' });
    y += 28;

    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136);
    doc.setFont('helvetica', 'normal');
    doc.text(`Lista de precios — ${date}`, pageW - margin, y, { align: 'right' });
    y += 10;

    for (const group of PRODUCT_GROUPS) {
      const items = available
        .filter((p) => productInRange(p, group.range))
        .sort((a, b) => Number(a.id) - Number(b.id));
      if (items.length === 0) continue;

      addPageIfNeeded(20);
      doc.setFillColor(245, 245, 255);
      doc.setDrawColor(26, 26, 94);
      doc.rect(margin, y - 2, contentW, 8, 'F');
      doc.setDrawColor(26, 26, 94);
      doc.line(margin, y - 2, margin, y + 6);
      doc.setTextColor(26, 26, 94);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(group.name, margin + 4, y + 4);
      y += 12;

      addPageIfNeeded(7);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 94);
      doc.text('Producto', margin + 2, y);
      doc.text('Precio', margin + contentW - 50, y, { align: 'right' });
      doc.text('Presentación', margin + contentW - 2, y, { align: 'right' });
      doc.setDrawColor(26, 26, 94);
      doc.line(margin, y + 1, margin + contentW, y + 1);
      y += 7;

      for (const product of items) {
        const lineH = 6;
        addPageIfNeeded(lineH);
        const nameLines = wrapText(product.name, contentW - 62);
        const rowH = nameLines.length * lineH;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 26, 26);
        let nameY = y;
        for (const nl of nameLines) {
          doc.text(nl, margin + 2, nameY);
          nameY += lineH;
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(formatPrice(product.price), margin + contentW - 50, y + lineH - 1, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(136, 136, 136);
        doc.text(presentacionShort(product.tipoVenta as TipoVentaKey), margin + contentW - 2, y + lineH - 1, { align: 'right' });

        doc.setDrawColor(224, 224, 224);
        doc.line(margin, y + rowH - 1, margin + contentW, y + rowH - 1);
        y += rowH;
      }

      y += 6;
    }

    addPageIfNeeded(12);
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, y, margin + contentW, y);
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('Bajo Cero — Precios sujetos a cambio sin previo aviso', pageW / 2, y, { align: 'center' });

    doc.save(`bajocero-precios-${date.replace(/\s+/g, '-')}.pdf`);
    log('pdfExport', 'info', 'PDF exported successfully');
  } catch (error) {
    log('pdfExport', 'error', `PDF export failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
