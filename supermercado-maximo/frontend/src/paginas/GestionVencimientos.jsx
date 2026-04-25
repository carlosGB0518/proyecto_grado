import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LayoutBase from '../componentes/LayoutBase';
import './GestionVencimientos.css';

function GestionVencimientos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('proximo'); // proximo, vencido, todos
  const [diasAlerta, setDiasAlerta] = useState(7);

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
        .select('id, nombre, codigo, fecha_vencimiento, fecha_entrada, numero_lote, estado_producto, stock');

      if (filtro === 'proximo') {
        query = query
          .gte('fecha_vencimiento', hoy)
          .lte('fecha_vencimiento', fechaAlertaStr)
          .eq('estado_producto', 'disponible');
      } else if (filtro === 'vencido') {
        query = query.lt('fecha_vencimiento', hoy);
      } else if (filtro === 'todos' && filtro !== 'todos') {
        query = query.gte('fecha_vencimiento', hoy);
      }

      const { data, error } = await query.order('fecha_vencimiento', { ascending: true });

      if (error) {
        console.error('Error cargando productos:', error.message);
      } else {
        setProductos(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const marcarRetirado = async (productoId) => {
    const { error } = await supabase
      .from('productos')
      .update({ estado_producto: 'retirado' })
      .eq('id', productoId);

    if (error) {
      alert('❌ Error al marcar como retirado');
    } else {
      alert('✅ Producto marcado como retirado');
      cargarProductosVencimiento();
    }
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return '—';
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diferencia = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const obtenerColor = (dias) => {
    if (dias < 0) return '#dc3545'; // Rojo - vencido
    if (dias <= 3) return '#fd7e14'; // Naranja - crítico
    if (dias <= 7) return '#ffc107'; // Amarillo - próximo
    return '#28a745'; // Verde - ok
  };

  const fmt = (f) => !f ? '—' : new Date(f).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <LayoutBase>
      <div className="vencimiento-container">
        <div className="vencimiento-header">
          <div>
            <h1 className="vencimiento-titulo">📦 Gestión de Vencimientos</h1>
            <p className="vencimiento-subtitulo">
              Monitorea productos próximos a vencer y controla la rotación de inventario.
            </p>
          </div>
        </div>

        <div className="vencimiento-controles card">
          <div className="ctrl-grupo">
            <label>Filtro:</label>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="select-base">
              <option value="proximo">Próximos a vencer</option>
              <option value="vencido">Vencidos</option>
              <option value="todos">Todos los productos</option>
            </select>
          </div>

          <div className="ctrl-grupo">
            <label>Días de alerta:</label>
            <input
              type="number"
              min="1"
              max="30"
              value={diasAlerta}
              onChange={(e) => setDiasAlerta(parseInt(e.target.value))}
              className="input-base"
            />
          </div>

          <button onClick={cargarProductosVencimiento} className="btn-refrescar">
            🔄 Refrescar
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cargando ? (
            <div className="vencimiento-estado">⏳ Cargando...</div>
          ) : productos.length === 0 ? (
            <div className="vencimiento-estado">✅ No hay productos con vencimiento próximo.</div>
          ) : (
            <div className="vencimiento-tabla-wrapper">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Lote</th>
                    <th>Entrada</th>
                    <th>Vencimiento</th>
                    <th>Días</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => {
                    const dias = diasRestantes(p.fecha_vencimiento);
                    return (
                      <tr key={p.id} style={{ borderLeft: `4px solid ${obtenerColor(dias)}` }}>
                        <td className="ven-codigo">{p.codigo || '—'}</td>
                        <td className="ven-nombre">{p.nombre}</td>
                        <td>{p.numero_lote || '—'}</td>
                        <td>{fmt(p.fecha_entrada)}</td>
                        <td className="ven-fecha">{fmt(p.fecha_vencimiento)}</td>
                        <td>
                          <span
                            className="ven-dias"
                            style={{ backgroundColor: obtenerColor(dias), color: '#fff', padding: '4px 8px', borderRadius: '4px' }}
                          >
                            {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                          </span>
                        </td>
                        <td>{p.stock || 0}</td>
                        <td>
                          <span className={`ven-badge ven-badge-${p.estado_producto}`}>
                            {p.estado_producto || 'disponible'}
                          </span>
                        </td>
                        <td>
                          {p.estado_producto !== 'retirado' && (
                            <button
                              onClick={() => marcarRetirado(p.id)}
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

        <div className="vencimiento-estadisticas card">
          <div className="stat-item">
            <span className="stat-numero" style={{ color: '#dc3545' }}>
              {productos.filter((p) => diasRestantes(p.fecha_vencimiento) < 0).length}
            </span>
            <span className="stat-label">Vencidos</span>
          </div>
          <div className="stat-item">
            <span className="stat-numero" style={{ color: '#fd7e14' }}>
              {productos.filter((p) => {
                const d = diasRestantes(p.fecha_vencimiento);
                return d >= 0 && d <= 3;
              }).length}
            </span>
            <span className="stat-label">Crítico (0-3 días)</span>
          </div>
          <div className="stat-item">
            <span className="stat-numero" style={{ color: '#ffc107' }}>
              {productos.filter((p) => {
                const d = diasRestantes(p.fecha_vencimiento);
                return d > 3 && d <= 7;
              }).length}
            </span>
            <span className="stat-label">Próximos (4-7 días)</span>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
}

export default GestionVencimientos;