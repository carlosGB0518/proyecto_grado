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
    if (nombre) doc.text(`Proveedor: ${nombre}`, 14, 28);
    if (email) doc.text(`Email: ${email}`, 14, 36);
    if (telefono) doc.text(`Teléfono: ${telefono}`, 14, 44);
    startY = 55;
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

  doc.save(nombreArchivo);
};
