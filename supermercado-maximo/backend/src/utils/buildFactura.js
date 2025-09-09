// utils/buildFactura.js

export default function buildFactura(data) {
  const { cliente, items, totales } = data;

  if (!cliente || !items || !totales) {
    throw new Error("Faltan datos obligatorios: cliente, items o totales");
  }

  return {
    tipoDocumento: "FACTURA_ELECTRONICA", // puedes cambiar según el tipo (Factura, Nota Crédito, etc.)
    cliente: {
      tipoIdentificacion: cliente.tipoIdentificacion || "CC",
      numeroIdentificacion: cliente.numeroIdentificacion,
      nombre: cliente.nombre,
      direccion: cliente.direccion || "Sin dirección"
    },
    items: items.map((item, index) => ({
      codigo: item.codigo || `ITEM-${index + 1}`,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      total: item.cantidad * item.precioUnitario
    })),
    totales: {
      subtotal: totales.subtotal,
      impuestos: totales.impuestos || 0,
      total: totales.total
    },
    moneda: "COP",
    formaDePago: data.formaDePago || "CONTADO"
  };
}
