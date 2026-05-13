/**
 * Ventas.jsx — Supermercado Máximo
 *
 * Correcciones:
 * - Anular venta: solo supervisor o administrador puede hacerlo
 * - Realtime: nuevas ventas aparecen automáticamente
 * - Muestra cajero/usuario en la tabla
 */
import { useEffect, useState, useContext } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/ventas.css';
import { supabase } from '../supabase';
import { UsuarioContexto } from '../contextos/UsuarioContexto';

function Ventas() {
  const { usuario } = useContext(UsuarioContexto);
  const puedeAnular = ['supervisor', 'administrador'].includes(usuario?.rol);

  const [filtros, setFiltros] = useState({
    fechaInicio: '', fechaFin: '', metodoPago: '', clienteId: ''
  });
  const [ventas, setVentas]                   = useState([]);
  const [clientes, setClientes]               = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detallesVenta, setDetallesVenta]     = useState([]);
  const [estadisticas, setEstadisticas]       = useState({
    totalVentas: 0, cantidadVentas: 0, promedioVenta: 0
  });

  useEffect(() => {
    cargarVentas();
    cargarClientes();

    // Realtime: nuevas ventas aparecen al instante
    const canal = supabase
      .channel('realtime:ventas:lista')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
        cargarVentas();
      })
      .subscribe();

    return () => supabase.removeChannel(canal);
  }, []);

  const cargarClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nombre').order('nombre');
    if (data) setClientes(data);
  };

  const cargarVentas = async () => {
    setCargando(true);
    let query = supabase
      .from('ventas')
      .select(`*, clientes(id, nombre, numero_identificacion, telefono)`)
      .order('fecha', { ascending: false });

    if (filtros.fechaInicio) query = query.gte('fecha', filtros.fechaInicio);
    if (filtros.fechaFin) {
      const fin = new Date(filtros.fechaFin); fin.setHours(23,59,59,999);
      query = query.lte('fecha', fin.toISOString());
    }
    if (filtros.metodoPago) query = query.eq('metodo_pago', filtros.metodoPago);
    if (filtros.clienteId)  query = query.eq('cliente_id', filtros.clienteId);

    const { data, error } = await query;
    if (!error && data) {
      setVentas(data);
      calcularEstadisticas(data);
    }
    setCargando(false);
  };

  const calcularEstadisticas = (data) => {
    const activas   = data.filter(v => !v.anulada);
    const total     = activas.reduce((s, v) => s + (v.total || 0), 0);
    const cantidad  = activas.length;
    setEstadisticas({
      totalVentas:   total,
      cantidadVentas: cantidad,
      promedioVenta: cantidad > 0 ? total / cantidad : 0,
    });
  };

  const aplicarFiltros = () => cargarVentas();

  const limpiarFiltros = () => {
    setFiltros({ fechaInicio: '', fechaFin: '', metodoPago: '', clienteId: '' });
    setTimeout(cargarVentas, 100);
  };

  const anularVenta = async (venta) => {
    if (!puedeAnular) {
      alert('⛔ No tienes permisos para anular ventas. Solo supervisores y administradores.'); return;
    }
    const ok = window.confirm(
      `¿Anular la venta #${venta.id} por $${venta.total?.toLocaleString('es-CO')}?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    const { error } = await supabase
      .from('ventas').update({ anulada: true }).eq('id', venta.id);

    if (error) { alert('Error al anular: ' + error.message); return; }
    alert('✅ Venta anulada.');
    cargarVentas();
  };

  const verDetalles = async (venta) => {
    setVentaSeleccionada(venta);
    setMostrarDetalles(true);
    const { data } = await supabase
      .from('ventas_detalle')
      .select(`*, productos(nombre, codigo)`)
      .eq('venta_id', venta.id);
    setDetallesVenta(data || []);
  };

  const formatearFecha = (f) => new Date(f).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const ModalDetalles = () => {
    if (!mostrarDetalles || !ventaSeleccionada) return null;
    return (
      <div className="modal-overlay" onClick={() => setMostrarDetalles(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>Venta #{ventaSeleccionada.id}</h2>
          <div className="detalle-info">
            <p><strong>Fecha:</strong> {formatearFecha(ventaSeleccionada.fecha)}</p>
            <p><strong>Cliente:</strong> {ventaSeleccionada.clientes?.nombre || 'Sin cliente'}</p>
            <p><strong>Cajero:</strong> {ventaSeleccionada.cajero || ventaSeleccionada.usuario || '—'}</p>
            <p><strong>Método:</strong> {ventaSeleccionada.metodo_pago}</p>
            <p><strong>Estado:</strong> {ventaSeleccionada.anulada ? 'Anulada' : 'Activa'}</p>
          </div>
          <h3>Productos</h3>
          <table className="tabla-detalle">
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
            </thead>
            <tbody>
              {detallesVenta.map((d, i) => (
                <tr key={i}>
                  <td>{d.productos?.nombre || 'Eliminado'}</td>
                  <td>{d.cantidad}</td>
                  <td>${d.precio_unitario?.toLocaleString('es-CO')}</td>
                  <td>${(d.cantidad * d.precio_unitario).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Total</strong></td>
                <td><strong>${ventaSeleccionada.total?.toLocaleString('es-CO')}</strong></td>
              </tr>
            </tfoot>
          </table>
          <button onClick={() => setMostrarDetalles(false)} className="btn-cerrar">Cerrar</button>
        </div>
      </div>
    );
  };

  return (
    <LayoutBase>
      <div className="ventas-container">
        <h1>Historial de Ventas</h1>

        {/* Estadísticas */}
        <div className="stats-ventas">
          <div className="stat-item">
            <span className="stat-label">Total vendido</span>
            <span className="stat-value">${estadisticas.totalVentas.toLocaleString('es-CO')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cantidad de ventas</span>
            <span className="stat-value">{estadisticas.cantidadVentas}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Promedio por venta</span>
            <span className="stat-value">
              ${estadisticas.promedioVenta.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {!puedeAnular && (
          <div style={{
            background: 'rgba(253,216,53,0.12)', border: '1px solid rgba(253,216,53,0.4)',
            borderRadius: 'var(--radio-sm)', padding: '0.6rem 1rem',
            fontSize: '0.82rem', color: '#795548', marginBottom: '1rem'
          }}>
            Solo supervisores y administradores pueden anular ventas.
          </div>
        )}

        {/* Filtros */}
        <section className="filtros">
          <h2>Filtrar</h2>
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Fecha inicio</label>
              <input type="date" value={filtros.fechaInicio}
                onChange={e => setFiltros({ ...filtros, fechaInicio: e.target.value })} />
            </div>
            <div className="filtro-item">
              <label>Fecha fin</label>
              <input type="date" value={filtros.fechaFin}
                onChange={e => setFiltros({ ...filtros, fechaFin: e.target.value })} />
            </div>
            <div className="filtro-item">
              <label>Método de pago</label>
              <select value={filtros.metodoPago}
                onChange={e => setFiltros({ ...filtros, metodoPago: e.target.value })}>
                <option value="">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="nequi">Nequi</option>
                <option value="daviplata">Daviplata</option>
              </select>
            </div>
            <div className="filtro-item">
              <label>Cliente</label>
              <select value={filtros.clienteId}
                onChange={e => setFiltros({ ...filtros, clienteId: e.target.value })}>
                <option value="">Todos</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="filtros-acciones">
            <button onClick={aplicarFiltros} className="btn-aplicar">Aplicar filtros</button>
            <button onClick={limpiarFiltros} className="btn-limpiar">Limpiar</button>
          </div>
        </section>

        {/* Tabla */}
        <section className="tabla-section">
          {cargando ? (
            <p className="cargando">Cargando...</p>
          ) : ventas.length === 0 ? (
            <p className="sin-datos">No hay ventas con los filtros seleccionados.</p>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-ventas">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Cajero</th>
                    <th>Método</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map(v => (
                    <tr key={v.id} className={v.anulada ? 'venta-anulada' : ''}>
                      <td>#{v.id}</td>
                      <td>{formatearFecha(v.fecha)}</td>
                      <td>{v.clientes?.nombre || '—'}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--color-texto-suave)' }}>
                        {v.cajero || v.usuario || '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${v.metodo_pago}`}>{v.metodo_pago}</span>
                      </td>
                      <td className="precio">${v.total?.toLocaleString('es-CO')}</td>
                      <td>
                        {v.anulada
                          ? <span className="estado-anulada">Anulada</span>
                          : <span className="estado-activa">Activa</span>}
                      </td>
                      <td className="acciones">
                        <button onClick={() => verDetalles(v)} className="btn-ver">Ver</button>
                        {!v.anulada && puedeAnular && (
                          <button onClick={() => anularVenta(v)} className="btn-anular">Anular</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <ModalDetalles />
    </LayoutBase>
  );
}

export default Ventas;
