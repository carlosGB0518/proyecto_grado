// src/utils/pdfUtils.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const crearPDFConTabla = (titulo, encabezado, filas, nombreArchivo) => {
  const doc = new jsPDF();
  doc.text(titulo, 14, 20);
  doc.autoTable({
    head: [encabezado],
    body: filas,
    startY: 30
  });
  doc.save(nombreArchivo);
};

