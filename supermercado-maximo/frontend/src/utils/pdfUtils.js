// src/utils/pdfUtils.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Genera un PDF con tabla
 * @param {string} titulo - Texto que aparece arriba del PDF
 * @param {Array} encabezado - Array con los títulos de las columnas
 * @param {Array} filas - Array con los datos de cada fila
 * @param {string} nombreArchivo - Nombre del archivo PDF a descargar
 * @param {Object} infoExtra - Opcional, datos adicionales (proveedor, totales, etc.)
 */
export const crearPDFConTabla = (titulo, encabezado, filas, nombreArchivo, infoExtra = {}) => {
  const doc = new jsPDF();

  // Título principal
  doc.text(titulo, 14, 20);

  // Información extra (ej: proveedor, email, teléfono)
  if (infoExtra.proveedor) {
    const { nombre, email, telefono } = infoExtra.proveedor;
    if (nombre) doc.text(`Proveedor: ${nombre}`, 14, 28);
    if (email) doc.text(`Email: ${email}`, 14, 36);
    if (telefono) doc.text(`Teléfono: ${telefono}`, 14, 44);
  }

  // Tabla principal
  doc.autoTable({
    head: [encabezado],
    body: filas,
    startY: infoExtra.proveedor ? 55 : 30
  });

  // Totales (si se pasan)
  if (infoExtra.total) {
    const finalY = doc.lastAutoTable.finalY || 60;
    doc.text(`Total del pedido: $${infoExtra.total.toLocaleString()}`, 14, finalY + 10);
  }

  doc.save(nombreArchivo);
};
