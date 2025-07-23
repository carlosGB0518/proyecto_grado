import { useEffect, useState } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/ventas.css';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];
    setVentas(ventasGuardadas);
  }, []);

  return (
    <LayoutBase>
      <div className="ventas-container">
        <h2>Historial de Ventas</h2>

        {ventas.length === 0 ? (
          <p>No hay ventas registradas aún.</p>
        ) : (
          <table className="ventas-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Método de pago</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta, index) => (
                <tr key={index}>
                  <td>{venta.fecha}</td>
                  <td>
                    <ul>
                      {venta.productos.map((p, i) => (
                        <li key={i}>
                          {p.nombre} x{p.cantidad} (${p.subtotal.toLocaleString()})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>${venta.total.toLocaleString()}</td>
                  <td>{venta.metodoPago}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </LayoutBase>
  );
};

export default Ventas;
