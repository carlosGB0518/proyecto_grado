// src/utils/pdfUtils.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF con tabla
 * @param {string} titulo - Texto arriba del PDF
 * @param {Array<string>} encabezado - Títulos de columnas
 * @param {Array<Array<string|number>>} filas - Datos de filas
 * @param {string} nombreArchivo - Nombre del PDF
 * @param {Object} infoExtra - Opcional: proveedor, total, etc.
 */
export const crearPDFConTabla = (titulo, encabezado, filas, nombreArchivo, infoExtra = {}) => {
  const doc = new jsPDF();

  // Título
  doc.text(titulo, 14, 20);

  // Info extra (proveedor)
  let startY = 30;
  if (infoExtra.proveedor) {
    const { nombre, email, telefono } = infoExtra.proveedor || {};
    if (nombre) doc.text(`Proveedor: ${nombre}`, 14, 35);
    if (email) doc.text(`Email: ${email}`, 14, 42);
    if (telefono) doc.text(`Teléfono: ${telefono}`, 14, 49);
    startY = 60;
  }

  // Tabla (usando la función autoTable en vez de doc.autoTable)
  autoTable(doc, {
    head: [encabezado],
    body: filas,
    startY
  });

  // Totales
  if (infoExtra.total != null) {
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || startY;
    doc.text(`Total del pedido: $${infoExtra.total.toLocaleString()}`, 14, finalY + 10);
  }

  // pie de pagina con usuario y numero de pagina
  const pageCount = doc.internal.getNumberOfPages();
  const usuario = infoExtra.usuario || 'Carlos';
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.text(`Expotado por: ${usuario} - Página ${i} de ${pageCount}`, 14, pageHeight - 10);
  }

  doc.save(nombreArchivo);
};
