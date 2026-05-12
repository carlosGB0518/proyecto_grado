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
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    supabase
      .from('proveedores')
      .select('id, nombre, email, telefono')
      .order('nombre')
      .then(({ data, error }) => { if (!error) setProveedores(data || []); });
  }, []);

  const consultarPedidos = async () => {
    setCargando(true);
    setBuscado(true);

    let query = supabase.from('pedidos').select(`
      id, cantidad, precio_unitario, fecha,
      producto:producto_id(nombre),
      proveedor:proveedor_id(nombre, email, telefono)
    `);

    if (proveedorId) query = query.eq('proveedor_id', proveedorId);
    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin)    query = query.lte('fecha', fechaFin);

    const { data, error } = await query.order('fecha', { ascending: false });
    if (!error) setPedidos(data || []);
    else alert('Error al consultar pedidos: ' + error.message);
    setCargando(false);
  };

  const limpiarFiltros = () => {
    setProveedorId('');
    setFechaInicio('');
    setFechaFin('');
    setPedidos([]);
    setBuscado(false);
  };

  const generarPDF = () => {
    if (pedidos.length === 0) { alert('No hay pedidos para exportar.'); return; }
    const proveedor = pedidos[0].proveedor;
    const filas = pedidos.map((p, i) => [
      i + 1,
      p.producto?.nombre || '—',
      p.cantidad,
      `$${p.precio_unitario?.toLocaleString('es-CO')}`,
      new Date(p.fecha).toLocaleDateString('es-CO'),
    ]);
    const total = pedidos.reduce((acc, p) => acc + (p.cantidad * (p.precio_unitario || 0)), 0);
    crearPDFConTabla(
      `Pedido: ${proveedor?.nombre || 'Varios proveedores'}`,
      ['#', 'Producto', 'Cantidad', 'Precio Unitario', 'Fecha'],
      filas,
      proveedor?.nombre ? `pedido_${proveedor.nombre}.pdf` : 'pedidos.pdf',
      { proveedor, total }
    );
  };

  const totalPedidos = pedidos.reduce((acc, p) => acc + (p.cantidad * (p.precio_unitario || 0)), 0);

  return (
    <LayoutBase>
      <div className="pedidos-container">
        <div className="pedidos-header">
          <h1 className="pedidos-titulo">Pedidos a Proveedores</h1>
          <p className="pedidos-subtitulo">Consulta y exporta el historial de pedidos por proveedor y fecha.</p>
        </div>

        {/* Filtros */}
        <div className="card pedidos-filtros">
          <h2 className="pedidos-filtros-titulo">Filtros de búsqueda</h2>
          <div className="pedidos-filtros-grid">
            <div className="pedidos-campo">
              <label>Proveedor</label>
              <select className="input-base" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Todos los proveedores</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="pedidos-campo">
              <label>Fecha desde</label>
              <input type="date" className="input-base" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="pedidos-campo">
              <label>Fecha hasta</label>
              <input type="date" className="input-base" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="pedidos-filtros-acciones">
            <button className="btn-primary" onClick={consultarPedidos} disabled={cargando}>
              {cargando ? 'Buscando...' : 'Buscar Pedidos'}
            </button>
            {buscado && (
              <button className="btn-secondary" onClick={limpiarFiltros}>Limpiar</button>
            )}
            {pedidos.length > 0 && (
              <button className="pedidos-btn-pdf" onClick={generarPDF}>Exportar PDF</button>
            )}
          </div>
        </div>

        {/* Resultados */}
        {buscado && (
          <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
            <div className="pedidos-resultado-header">
              <span className="pedidos-resultado-titulo">
                {cargando ? 'Buscando...' : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} encontrado${pedidos.length !== 1 ? 's' : ''}`}
              </span>
              {pedidos.length > 0 && (
                <span className="pedidos-total">
                  Total: <strong>${totalPedidos.toLocaleString('es-CO')}</strong>
                </span>
              )}
            </div>

            {cargando ? (
              <div className="pedidos-estado">Cargando pedidos...</div>
            ) : pedidos.length === 0 ? (
              <div className="pedidos-estado">No hay pedidos con los filtros seleccionados.</div>
            ) : (
              <div className="pedidos-tabla-wrapper">
                <table className="tabla-base">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Proveedor</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p, i) => (
                      <tr key={p.id}>
                        <td className="pedidos-num">{i + 1}</td>
                        <td>{p.proveedor?.nombre || '—'}</td>
                        <td className="pedidos-producto">{p.producto?.nombre || '—'}</td>
                        <td>{p.cantidad}</td>
                        <td>${p.precio_unitario?.toLocaleString('es-CO') ?? '—'}</td>
                        <td className="pedidos-subtotal">
                          ${((p.cantidad || 0) * (p.precio_unitario || 0)).toLocaleString('es-CO')}
                        </td>
                        <td className="pedidos-fecha">{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'right', fontWeight: 700, padding: '0.75rem 1rem' }}>
                        Total general:
                      </td>
                      <td colSpan="2" style={{ fontFamily: 'var(--fuente-titulo)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-verde)', padding: '0.75rem 1rem' }}>
                        ${totalPedidos.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutBase>
  );
};

export default Pedidos;
