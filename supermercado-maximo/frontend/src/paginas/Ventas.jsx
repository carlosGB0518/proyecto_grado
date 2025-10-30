import { useEffect, useState } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/ventas.css';
import { supabase } from '../supabase';

function Ventas() {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    metodoPago: '',
    clienteId: ''
  });

  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detallesVenta, setDetallesVenta] = useState([]);

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    cantidadVentas: 0,
    promedioVenta: 0
  });

  useEffect(() => {
    cargarVentas();
    cargarClientes();
  }, []);

  // Cargar lista de clientes para el filtro
  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre')
      .order('nombre');

    if (!error && data) {
      setClientes(data);
    }
  };

  const cargarVentas = async () => {
    setCargando(true);
    
    // Query base con join a clientes
    let query = supabase
      .from('ventas')
      .select(`
        *,
        clientes (
          id,
          nombre,
          numero_identificacion,
          telefono
        )
      `)
      .order('fecha', { ascending: false });

    // Aplicar filtros
    if (filtros.fechaInicio) {
      query = query.gte('fecha', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      const fechaFinConHora = new Date(filtros.fechaFin);
      fechaFinConHora.setHours(23, 59, 59, 999);
      query = query.lte('fecha', fechaFinConHora.toISOString());
    }
    if (filtros.metodoPago) {
      query = query.eq('metodo_pago', filtros.metodoPago);
    }
    if (filtros.clienteId) {
      query = query.eq('cliente_id', filtros.clienteId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar ventas:', error);
      alert('Error al cargar las ventas');
    } else {
      setVentas(data || []);
      calcularEstadisticas(data || []);
    }

    setCargando(false);
  };

  const calcularEstadisticas = (ventasData) => {
    const ventasActivas = ventasData.filter(v => !v.anulada);
    const total = ventasActivas.reduce((sum, v) => sum + (v.total || 0), 0);
    const cantidad = ventasActivas.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;

    setEstadisticas({
      totalVentas: total,
      cantidadVentas: cantidad,
      promedioVenta: promedio
    });
  };

  const aplicarFiltros = () => {
    cargarVentas();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      metodoPago: '',
      clienteId: ''
    });
    // Recargar sin filtros
    setTimeout(() => cargarVentas(), 100);
  };

  const anularVenta = async (venta) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de anular la venta #${venta.id} por $${venta.total.toLocaleString()}?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmacion) return;

    const { error } = await supabase
      .from('ventas')
      .update({ anulada: true })
      .eq('id', venta.id);

    if (error) {
      console.error('Error al anular venta:', error);
      alert('Error al anular la venta');
    } else {
      alert('✅ Venta anulada correctamente');
      cargarVentas();
    }
  };

  const verDetalles = async (venta) => {
    setVentaSeleccionada(venta);
    setMostrarDetalles(true);

    // Cargar detalles de la venta con información de productos
    const { data, error } = await supabase
      .from('detalle_venta')
      .select(`
        *,
        productos (
          nombre,
          codigo
        )
      `)
      .eq('venta_id', venta.id);

    if (error) {
      console.error('Error cargando detalles:', error);
    } else {
      setDetallesVenta(data || []);
    }
  };

  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setVentaSeleccionada(null);
    setDetallesVenta([]);
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Modal de detalles
  const ModalDetalles = () => {
    if (!mostrarDetalles || !ventaSeleccionada) return null;

    return (
      <div className="modal-overlay" onClick={cerrarDetalles}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>📋 Detalles de Venta #{ventaSeleccionada.id}</h2>
          
          <div className="detalle-info">
            <p><strong>Fecha:</strong> {formatearFecha(ventaSeleccionada.fecha)}</p>
            <p><strong>Cliente:</strong> {ventaSeleccionada.clientes?.nombre || 'N/A'}</p>
            <p><strong>Método de pago:</strong> {ventaSeleccionada.metodo_pago}</p>
            <p><strong>Usuario:</strong> {ventaSeleccionada.usuario}</p>
            <p><strong>Estado:</strong> {ventaSeleccionada.anulada ? '❌ Anulada' : '✅ Activa'}</p>
          </div>

          <h3>Productos</h3>
          <table className="tabla-detalle">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {detallesVenta.map((detalle, index) => (
                <tr key={index}>
                  <td>{detalle.productos?.nombre || 'Producto eliminado'}</td>
                  <td>{detalle.cantidad}</td>
                  <td>${detalle.precio_unitario?.toLocaleString()}</td>
                  <td>${(detalle.cantidad * detalle.precio_unitario).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Total</strong></td>
                <td><strong>${ventaSeleccionada.total.toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>

          <button onClick={cerrarDetalles} className="btn-cerrar">Cerrar</button>
        </div>
      </div>
    );
  };

  return (
    <LayoutBase>
      <div className="ventas-container">
        <h1>📊 Historial de Ventas</h1>

        {/* Estadísticas rápidas */}
        <div className="stats-ventas">
          <div className="stat-item">
            <span className="stat-label">Total vendido</span>
            <span className="stat-value">${estadisticas.totalVentas.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cantidad de ventas</span>
            <span className="stat-value">{estadisticas.cantidadVentas}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Promedio por venta</span>
            <span className="stat-value">${estadisticas.promedioVenta.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
          </div>
        </div>

        {/* Filtros */}
        <section className="filtros">
          <h2>🔍 Filtrar Ventas</h2>
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Fecha inicio:</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            
            <div className="filtro-item">
              <label>Fecha fin:</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>

            <div className="filtro-item">
              <label>Cliente:</label>
              <select
                value={filtros.clienteId}
                onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}
              >
                <option value="">Todos los clientes</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>Método de pago:</label>
              <select
                value={filtros.metodoPago}
                onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="nequi">Nequi</option>
                <option value="daviplata">Daviplata</option>
              </select>
            </div>
          </div>

          <div className="filtros-acciones">
            <button onClick={aplicarFiltros} className="btn-aplicar">
              Aplicar filtros
            </button>
            <button onClick={limpiarFiltros} className="btn-limpiar">
              Limpiar filtros
            </button>
          </div>
        </section>

        {/* Tabla de ventas */}
        <section className="tabla-section">
          {cargando ? (
            <p className="cargando">⏳ Cargando ventas...</p>
          ) : ventas.length === 0 ? (
            <p className="sin-datos">No hay ventas registradas con los filtros seleccionados</p>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla-ventas">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Método Pago</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta) => (
                    <tr key={venta.id} className={venta.anulada ? 'venta-anulada' : ''}>
                      <td>#{venta.id}</td>
                      <td>{formatearFecha(venta.fecha)}</td>
                      <td>{venta.clientes?.nombre || 'Sin cliente'}</td>
                      <td>
                        <span className={`badge badge-${venta.metodo_pago}`}>
                          {venta.metodo_pago}
                        </span>
                      </td>
                      <td className="precio">${venta.total?.toLocaleString() || 0}</td>
                      <td>
                        {venta.anulada ? (
                          <span className="estado-anulada">❌ Anulada</span>
                        ) : (
                          <span className="estado-activa">✅ Activa</span>
                        )}
                      </td>
                      <td className="acciones">
                        <button 
                          onClick={() => verDetalles(venta)}
                          className="btn-ver"
                        >
                          👁️ Ver
                        </button>
                        {!venta.anulada && (
                          <button 
                            onClick={() => anularVenta(venta)}
                            className="btn-anular"
                          >
                            ❌ Anular
                          </button>
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