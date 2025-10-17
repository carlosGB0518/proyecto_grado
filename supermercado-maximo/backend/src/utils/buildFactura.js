// backend/src/utils/buildFactura.js
export default function buildFactura(data) {
  const { cliente, items, totales } = data;

  if (!cliente || !items || !totales) {
    throw new Error("Faltan datos obligatorios: cliente, items o totales");
  }

  // -------------------
  // Datos del cliente
  // -------------------
  const customer = {
    identification_number: cliente.numeroIdentificacion,
    dv: cliente.dv || null, // dígito de verificación si aplica
    name: cliente.nombre,
    phone: cliente.telefono || "",
    address: cliente.direccion || "Sin dirección",
    email: cliente.email || "",
    merchant_registration: cliente.regimen || "No responsable de IVA",
    legal_organization_id: cliente.tipoIdentificacion || "13", // 13 = CC, 31 = NIT, etc.
  };

  // -------------------
  // Ítems de la factura
  // -------------------
  const invoiceLines = items.map((item, index) => {
    const cantidad = item.cantidad || 1;
    const precio = item.precioUnitario || 0;
    const totalItem = cantidad * precio;

    return {
      code: item.codigo || `ITEM-${index + 1}`,
      description: item.descripcion,
      quantity: cantidad,
      price: precio,
      discount: item.descuento || 0,
      taxes: [
        {
          id: 1, // IVA
          rate: item.iva || 19, // porcentaje IVA
          amount: totalItem * ((item.iva || 19) / 100),
        },
      ],
      total: totalItem + totalItem * ((item.iva || 19) / 100),
    };
  });

  // -------------------
  // Totales
  // -------------------
  const subtotal = invoiceLines.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalImpuestos = invoiceLines.reduce(
    (acc, i) => acc + i.taxes.reduce((sum, t) => sum + t.amount, 0),
    0
  );
  const totalFinal = subtotal + totalImpuestos;

  // -------------------
  // Estructura Factus
  // -------------------
  return {
    type_document_id: 1, // 1 = Factura de venta
    date: new Date().toISOString(),
    payment_form: data.formaDePago || "1", // 1 = contado, 2 = crédito
    payment_method_id: 1, // efectivo
    customer,
    items: invoiceLines,
    legal_monetary_totals: {
      line_extension_amount: subtotal,
      tax_exclusive_amount: subtotal,
      tax_inclusive_amount: totalFinal,
      allowance_total_amount: 0,
      charge_total_amount: 0,
      payable_amount: totalFinal,
    },
  };
}
