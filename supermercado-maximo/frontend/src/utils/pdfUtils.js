// src/utils/pdfUtils.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF con tabla y estilos de marca Supermercado Máximo
 *
 * @param {string} titulo           - Título del reporte
 * @param {string[]} encabezado     - Nombres de columnas
 * @param {Array[]} filas           - Filas de datos
 * @param {string} nombreArchivo    - Nombre del archivo a descargar
 * @param {Object} infoExtra        - { proveedor, total, subtitulo }
 */
export const crearPDFConTabla = (titulo, encabezado, filas, nombreArchivo, infoExtra = {}) => {
  const doc = new jsPDF();

  // ── Encabezado del PDF ────────────────────────────────────────────
  // Banda verde superior
  doc.setFillColor(46, 125, 50); // --color-verde
  doc.rect(0, 0, 210, 22, 'F');

  // Título en blanco
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Supermercado Máximo', 14, 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, 14, 17);

  // Fecha de generación
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFontSize(8);
  doc.text(`Generado: ${fecha}`, 210 - 14 - doc.getTextWidth(`Generado: ${fecha}`), 17);

  // ── Subtítulo / info extra ────────────────────────────────────────
  doc.setTextColor(44, 44, 44); // --color-texto
  let cursorY = 30;

  if (infoExtra.subtitulo) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(infoExtra.subtitulo, 14, cursorY);
    cursorY += 6;
  }

  if (infoExtra.proveedor) {
    const { nombre, email, telefono } = infoExtra.proveedor;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (nombre)   { doc.text(`Proveedor: ${nombre}`,   14, cursorY); cursorY += 5; }
    if (email)    { doc.text(`Email: ${email}`,         14, cursorY); cursorY += 5; }
    if (telefono) { doc.text(`Teléfono: ${telefono}`,   14, cursorY); cursorY += 5; }
    cursorY += 2;
  }

  // ── Tabla ─────────────────────────────────────────────────────────
  autoTable(doc, {
    head:    [encabezado],
    body:    filas,
    startY:  cursorY,
    margin:  { left: 14, right: 14 },
    styles: {
      font:      'helvetica',
      fontSize:   9,
      cellPadding: 3,
      textColor:  [44, 44, 44],
    },
    headStyles: {
      fillColor:  [46, 125, 50],   // verde marca
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:    9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],   // gris claro
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
  });

  // ── Total ─────────────────────────────────────────────────────────
  if (infoExtra.total != null) {
    // finalY viene del objeto interno de jspdf-autotable
    const finalY = doc.lastAutoTable?.finalY ?? cursorY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(46, 125, 50);
    const totalTexto = `Total: $${Number(infoExtra.total).toLocaleString('es-CO')}`;
    doc.text(totalTexto, 210 - 14 - doc.getTextWidth(totalTexto), finalY + 8);
  }

  // ── Pie de página ─────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Supermercado Máximo · Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.height - 6,
      { align: 'center' }
    );
  }

  doc.save(nombreArchivo);
};
