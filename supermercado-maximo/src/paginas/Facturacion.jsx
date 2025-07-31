import { useState } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/facturacion.css';

function Facturacion() {
  const [facturas, setFacturas] = useState([
    {
      id: 101,
      venta_id: 1,
      fecha: '2025-07-29',
      cliente: 'Juan Pérez',
      total: 58000,
      enviado_a_dian: true,
      fecha_envio: '2025-07-29 10:00'
    },
    {
      id: 102,
      venta_id: 2,
      fecha: '2025-07-28',
      cliente: 'Ana Gómez',
      total: 41000,
      enviado_a_dian: false,
      fecha_envio: null
    }
  ]);

  const reenviarFactura = (id) => {
    const confirmacion = window.confirm('¿Deseas reenviar esta factura a la DIAN?');
    if (confirmacion) {
      // Simula reenviar
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, enviado_a_dian: true, fecha_envio: new Date().toISOString() }
            : f
        )
      );
    }
  };

  return (
    <LayoutBase>
      <h1>Facturación Electrónica</h1>

      <table className="tabla-facturas">
        <thead>
          <tr>
            <th>ID Factura</th>
            <th>Venta</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Enviada a DIAN</th>
            <th>Fecha Envío</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((factura) => (
            <tr key={factura.id}>
              <td>{factura.id}</td>
              <td>{factura.venta_id}</td>
              <td>{factura.cliente}</td>
              <td>{factura.fecha}</td>
              <td>${factura.total}</td>
              <td>{factura.enviado_a_dian ? 'Sí' : 'No'}</td>
              <td>{factura.fecha_envio || 'Pendiente'}</td>
              <td>
                {!factura.enviado_a_dian && (
                  <button onClick={() => reenviarFactura(factura.id)}>Reintentar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LayoutBase>
  );
}

export default Facturacion;
