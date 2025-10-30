export default function buildFactura(data) {
  const { cliente, items, totales } = data;

  if (!cliente || !items || !totales) {
    throw new Error("Faltan datos obligatorios: cliente, items o totales");
  }

  return {
    reference_code: data.reference_code || `FAC-${Date.now()}`,

    customer: {
      identification_document_id: cliente.tipoIdentificacionId || 3, // CC
      identification: cliente.numeroIdentificacion,
      dv: cliente.dv || null,
      names: cliente.nombre,
      phone: cliente.telefono || "",
      address: cliente.direccion || "Sin dirección",
      email: cliente.email || "",
      municipality_id: cliente.municipioId || 1 // ✅ Medellín (funciona en sandbox)
    },

    items: items.map((item, index) => ({
      code_reference: item.codigo || `ITEM-${index + 1}`,
      name: item.descripcion || `Producto ${index + 1}`,
      quantity: item.cantidad,
      price: item.precioUnitario,
      price_amount: item.precioUnitario,
      discount_rate: item.descuento || 0,
      tax_rate: item.impuesto || 19,
      is_excluded: item.is_excluded ? 1 : 0,
      unit_measure_id: 70, // Unidad estándar “UNIDAD”
      standard_code_id: 1, // ✅ Bienes
      tribute_id: 1 // IVA
    })),

    total_discount: totales.descuento || 0,
    total_tax: totales.impuestos || 0,
    total: totales.total,

    issue_date: new Date().toISOString().split("T")[0],
    payment_form_id: data.formaDePagoId || 1,
    payment_method_id: data.metodoPagoId || 10,
    payment_due_date: new Date().toISOString().split("T")[0],
    notes: data.notas || "Gracias por su compra"
  };
}
