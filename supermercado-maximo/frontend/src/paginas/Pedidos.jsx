import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { crearPDFConTabla } from '../utils/pdfUtils';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/pedidos.css';

const Pedidos = () => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const cargarProveedores = async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, email, telefono');
      if (!error) setProveedores(data);
    };
    cargarProveedores();
  }, []);

  const consultarPedidos = async () => {
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        cantidad,
        precio_unitario,
        fecha,
        producto:producto_id(nombre),
        proveedor:proveedor_id(nombre, email, telefono)
      `);

    if (proveedorId) query = query.eq('proveedor_id', proveedorId);
    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin) query = query.lte('fecha', fechaFin);

    const { data, error } = await query;
    if (!error) setPedidos(data);
    else alert('Error al consultar pedidos: ' + error.message);
  };

  const generarPDF = () => {
    if (pedidos.length === 0) {
      alert('No hay pedidos para exportar.');
      return;
    }

    const proveedor = pedidos[0].proveedor;

    const filas = pedidos.map((p, i) => [
      i + 1,
      p.producto.nombre,
      p.cantidad,
      `$${p.precio_unitario.toLocaleString()}`,
      new Date(p.fecha).toLocaleDateString()
    ]);

    const total = pedidos.reduce(
      (acc, p) => acc + p.cantidad * p.precio_unitario,
      0
    );

    crearPDFConTabla(
      `Pedido para: ${proveedor?.nombre || 'Varios proveedores'}`,
      ['#', 'Producto', 'Cantidad', 'Precio Unitario', 'Fecha'],
      filas,
      proveedor?.nombre ? `pedido_${proveedor.nombre}.pdf` : 'pedidos_varios.pdf',
      { proveedor, total, usuario: 'Carlos' }
    );
  };

  return (
    <LayoutBase>
      <div className="pedidos-container">
        <h2>Pedidos a Proveedores</h2>

        <div className="filtros">
          <label>Proveedor:</label>
          <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Todos</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <label>Desde:</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />

          <label>Hasta:</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

          <button onClick={consultarPedidos}>Buscar</button>
          <button onClick={generarPDF}>📄 Exportar PDF</button>
        </div>

        <table className="pedidos-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Proveedor</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.proveedor?.nombre || '—'}</td>
                <td>{p.producto?.nombre}</td>
                <td>{p.cantidad}</td>
                <td>${p.precio_unitario.toLocaleString()}</td>
                <td>{new Date(p.fecha).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LayoutBase>
  );
};

export default Pedidos;
