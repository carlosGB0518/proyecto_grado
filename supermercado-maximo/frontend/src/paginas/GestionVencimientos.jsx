import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import LayoutBase from '../layouts/LayoutBase';
import ModalEditarVencimiento from '../paginas/ModalEditarVencimiento';
import '../estilos/GestionVencimientos.css';

function GestionVencimientos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('proximo');
  const [diasAlerta, setDiasAlerta] = useState(7);
  const [totalAlerta, setTotalAlerta] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);


  useEffect(() => {
    cargarProductosVencimiento();
  }, [filtro, diasAlerta]);

  const cargarProductosVencimiento = async () => {
    setCargando(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const fechaAlerta = new Date();
      fechaAlerta.setDate(fechaAlerta.getDate() + diasAlerta);
      const fechaAlertaStr = fechaAlerta.toISOString().split('T')[0];

      let query = supabase
        .from('productos')
        .select('id, nombre, codigo, fecha_vencimiento, fecha_entrada, numero_lote, estado_producto, stockactual');

      if (filtro === 'proximo') {
        query = query
          .gte('fecha_vencimiento', hoy)
          .lte('fecha_vencimiento', fechaAlertaStr)
          .eq('estado_producto', 'disponible');
      } else if (filtro === 'vencido') {
        query = query
          .lt('fecha_vencimiento', hoy)
          .neq('estado_producto', 'retirado');
      } else if (filtro === 'todos') {
        query = query.neq('estado_producto', 'retirado');
      }

      const { data, error } = await query.order('fecha_vencimiento', { ascending: true });

      if (error) {
        console.error('Error cargando productos:', error.message);
        alert('⚠️ Error al cargar productos: ' + error.message);
      } else {
        setProductos(data || []);
        setTotalAlerta(data?.length || 0);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error inesperado: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalEditar = (producto) => {
    setProductoSeleccionado(producto);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoSeleccionado(null);
  };

  const marcarRetirado = async (productoId) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ estado_producto: 'retirado' })
        .eq('id', productoId);

      if (error) {
        alert('❌ Error al marcar como retirado: ' + error.message);
      } else {
        alert('✅ Producto marcado como retirado exitosamente');
        cargarProductosVencimiento();
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fecha);
    vencimiento.setHours(0, 0, 0, 0);
    const diferencia = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const obtenerColor = (dias) => {
    if (dias === null) return '#6c757d';
    if (dias < 0) return '#dc3545';
    if (dias <= 3) return '#fd7e14';
    if (dias <= 7) return '#ffc107';
    return '#28a745';
  };

  const obtenerBadgeClass = (dias) => {
    if (dias === null) return 'badge-sin-fecha';
    if (dias < 0) return 'badge-vencido';
    if (dias <= 3) return 'badge-critico';
    if (dias <= 7) return 'badge-proximo';
    return 'badge-ok';
  };

  const fmt = (f) => !f ? '—' : new Date(f).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const contarPorEstado = (estado) => {
    return productos.filter((p) => {
      const d = diasRestantes(p.fecha_vencimiento);
      if (estado === 'vencido') return d !== null && d < 0;
      if (estado === 'critico') return d !== null && d >= 0 && d <= 3;
      if (estado === 'proximo') return d !== null && d > 3 && d <= 7;
      return false;
    }).length;
  };

  return (
    <LayoutBase>
      <div className="vencimiento-container">
        {/* Header */}
        <div className="vencimiento-header">
          <div>
            <h1 className="vencimiento-titulo">📦 Gestión de Vencimientos</h1>
            <p className="vencimiento-subtitulo">
              Monitorea productos próximos a vencer y controla la rotación de inventario de forma eficiente.
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="vencimiento-controles card">
          <div className="ctrl-grupo">
            <label htmlFor="filtro-select">Filtro:</label>
            <select 
              id="filtro-select"
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)} 
              className="select-base"
            >
              <option value="proximo">📅 Próximos a vencer</option>
              <option value="vencido">⚠️ Vencidos</option>
              <option value="todos">📋 Todos los productos</option>
            </select>
          </div>

          <div className="ctrl-grupo">
            <label htmlFor="dias-input">Días de alerta:</label>
            <input
              id="dias-input"
              type="number"
              min="1"
              max="30"
              value={diasAlerta}
              onChange={(e) => setDiasAlerta(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-base"
            />
          </div>

          <button 
            onClick={cargarProductosVencimiento} 
            className="btn-refrescar"
            disabled={cargando}
          >
            {cargando ? '⏳ Cargando...' : '🔄 Refrescar'}
          </button>
        </div>

        {/* Tabla de Productos */}
        <div className="card tabla-card">
          {cargando ? (
            <div className="vencimiento-estado loading">
              <div className="spinner"></div>
              <p>⏳ Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="vencimiento-estado empty">
              <p>✅ No hay productos que mostrar en este filtro.</p>
            </div>
          ) : (
            <div className="vencimiento-tabla-wrapper">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre Producto</th>
                    <th>Lote</th>
                    <th>Fecha Entrada</th>
                    <th>Fecha Vencimiento</th>
                    <th>Días Restantes</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => {
                    const dias = diasRestantes(p.fecha_vencimiento);
                    return (
                      <tr 
                        key={p.id} 
                        className={`row-${obtenerBadgeClass(dias)}`}
                        style={{ borderLeft: `4px solid ${obtenerColor(dias)}` }}
                      >
                        <td className="ven-codigo">{p.codigo || '—'}</td>
                        <td className="ven-nombre">{p.nombre || '—'}</td>
                        <td className="ven-lote">{p.numero_lote || '—'}</td>
                        <td className="ven-fecha">{fmt(p.fecha_entrada)}</td>
                        <td className="ven-fecha">{fmt(p.fecha_vencimiento)}</td>
                        <td>
                          <span
                            className={`ven-dias ${obtenerBadgeClass(dias)}`}
                            style={{ 
                              backgroundColor: obtenerColor(dias),
                              color: '#fff',
                            }}
                          >
                            {dias === null ? '—' : dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                          </span>
                        </td>
                        <td className="ven-stockactual">{p.stockactual || 0}</td>
                        <td>
                          <span className={`ven-badge ven-badge-${p.estado_producto || 'disponible'}`}>
                            {p.estado_producto || 'disponible'}
                          </span>
                        </td>
                        <td className="ven-acciones">
                          <button
                            onClick={() => abrirModalEditar(p)}
                            className="btn-editar"
                            title="Editar fechas de vencimiento"
                          >
                            ✏️ Editar
                          </button>
                          {p.estado_producto !== 'retirado' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Marcar "${p.nombre}" como retirado?`)) {
                                  marcarRetirado(p.id);
                                }
                              }}
                              className="btn-retirar"
                              title="Marcar como retirado de estantería"
                            >
                              🗑️ Retirar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="vencimiento-estadisticas">
          <div className="stat-item stat-vencido">
            <div className="stat-numero">{contarPorEstado('vencido')}</div>
            <div className="stat-label">Vencidos</div>
          </div>
          <div className="stat-item stat-critico">
            <div className="stat-numero">{contarPorEstado('critico')}</div>
            <div className="stat-label">Crítico (0-3 días)</div>
          </div>
          <div className="stat-item stat-proximo">
            <div className="stat-numero">{contarPorEstado('proximo')}</div>
            <div className="stat-label">Próximos (4-7 días)</div>
          </div>
          <div className="stat-item stat-total">
            <div className="stat-numero">{totalAlerta}</div>
            <div className="stat-label">Total en Alerta</div>
          </div>
        </div>

        {/* Modal Editar Vencimiento */}
        {modalAbierto && productoSeleccionado && (
          <ModalEditarVencimiento
            productoId={productoSeleccionado.id}
            productoNombre={productoSeleccionado.nombre}
            onClose={cerrarModal}
            onGuardar={cargarProductosVencimiento}
          />
        )}
      </div>
    </LayoutBase>
  );
}

export default GestionVencimientos;