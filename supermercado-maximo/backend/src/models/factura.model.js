// Modelo básico de factura (puedes expandirlo según tu base de datos)
export class Factura {
  constructor({ cliente, items, totales, formaDePago, uuid, estado, cufe }) {
    this.cliente = cliente;
    this.items = items;
    this.totales = totales;
    this.formaDePago = formaDePago;
    this.uuid = uuid;
    this.estado = estado;
    this.cufe = cufe;
    this.fecha = new Date();
  }
}