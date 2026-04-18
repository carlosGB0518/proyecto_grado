/**
 * Reportes.jsx — Supermercado Máximo
 *
 * Correcciones:
 * - ventas_detalle no tiene 'created_at' — se obtiene via join con ventas
 * - Queries optimizados con Promise.all
 */
import { useState, useEffect } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import { crearPDFConTabla } from '../utils/pdfUtils';
import '../estilos/reportes.css';

const Reportes = () => {
  const [periodo, setPeriodo]           = useState('mes');
  const [cargando, setCargando]         = useState(true);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [totalPeriodo, setTotalPeriodo] = useState(0);
  const [cantidadVentas, setCantidad]   = useState(0);
  const [ventasPorMetodo, setMetodos]   = useState([]);

  useEffect(() => { cargarReportes(); }, [periodo]);

  const getFechaDesde = () => {
    const ahora = new Date();
    if (periodo === 'semana') {
      const d = new Date(ahora); d.setDate(ahora.getDate() - 7); return d;
    }
    if (periodo === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return new Date(ahora.getFullYear(), 0, 1);
  };

  const cargarReportes = async () => {
    setCargando(true);
    const desde = getFechaDesde().toISOString();

    // 1. Ventas del período
    const { data: ventas } = await supabase
      .from('ventas')
      .select('id, total, metodo_pago, fecha')
      .gte('fecha', desde)
      .eq('anulada', false)
      .order('fecha');

    const ventasArr = ventas || [];
    const ids = ventasArr.map(v => v.id);

    // 2. Detalles — filtrado por los IDs de ventas del período
    let detalles = [];
    if (ids.length > 0) {
      const { data: det } = await supabase
        .from('ventas_detalle')
        .select('cantidad, precio_unitario, productos(nombre)')
        .in('venta_id', ids);
      detalles = det || [];
    }

    // Totales
    const total = ventasArr.reduce((s, v) => s + (v.total || 0), 0);
    setTotalPeriodo(total);
    setCantidad(ventasArr.length);

    // Ventas por día
    const porDia = {};
    ventasArr.forEach(v => {
      const dia = new Date(v.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      porDia[dia] = (porDia[dia] || 0) + (v.total || 0);
    });
    setVentasPorDia(Object.entries(porDia).map(([dia, total]) => ({ dia, total })));

    // Por método de pago
    const porMetodo = {};
    ventasArr.forEach(v => {
      porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] || 0) + (v.total || 0);
    });
    setMetodos(Object.entries(porMetodo).map(([metodo, total]) => ({ metodo, total })));

    // Top productos por cantidad vendida
    const porProd = {};
    detalles.forEach(d => {
      const nombre = d.productos?.nombre || 'Desconocido';
      porProd[nombre] = (porProd[nombre] || 0) + (d.cantidad || 0);
    });
    const top = Object.entries(porProd)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
    setTopProductos(top);

    setCargando(false);
  };

  const exportarPDF = () => {
    if (ventasPorDia.length === 0) { alert('Sin datos para exportar.'); return; }
    const filas = ventasPorDia.map((v, i) => [
      i + 1, v.dia, `$${v.total.toLocaleString('es-CO')}`,
    ]);
    crearPDFConTabla(
      `Reporte de Ventas — ${periodo === 'mes' ? 'Este mes' : periodo === 'semana' ? 'Esta semana' : 'Este año'}`,
      ['#', 'Día', 'Total'],
      filas,
      `reporte-ventas-${periodo}.pdf`,
      { total: totalPeriodo }
    );
  };

  // ── Gráfico de barras SVG ─────────────────────────────────────────
  const GraficaBarras = ({ datos, valorKey, etiquetaKey, color = 'var(--color-verde)' }) => {
    if (!datos.length) return <div className="rep-vacio">Sin datos en este período.</div>;
    const maxVal = Math.max(...datos.map(d => d[valorKey]));
    return (
      <div className="rep-barras-wrap">
        {datos.map((d, i) => {
          const pct = maxVal > 0 ? (d[valorKey] / maxVal) * 100 : 0;
          const tooltip = valorKey === 'total'
            ? `${d[etiquetaKey]}: $${d[valorKey]?.toLocaleString('es-CO')}`
            : `${d[etiquetaKey]}: ${d[valorKey]} uds`;
          return (
            <div key={i} className="rep-barra-item" title={tooltip}>
              <div className="rep-barra-container">
                <div className="rep-barra-fill" style={{ height: `${pct}%`, background: color }} />
              </div>
              <span className="rep-barra-label">{d[etiquetaKey]}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Gráfico de torta SVG ──────────────────────────────────────────
  const GraficaTorta = ({ datos }) => {
    const COLORES = ['var(--color-verde)','var(--color-amarillo-hover)','var(--color-rojo)','var(--color-verde-claro)','#9C27B0'];
    if (!datos.length) return <div className="rep-vacio">Sin datos.</div>;
    const total = datos.reduce((s, d) => s + d.total, 0);
    let acum = 0;
    const R = 50; const CX = 60; const CY = 60;
    const arcs = datos.map((d, i) => {
      const pct = d.total / total;
      const start = acum; acum += pct;
      const x1 = CX + R * Math.cos(2 * Math.PI * start - Math.PI / 2);
      const y1 = CY + R * Math.sin(2 * Math.PI * start - Math.PI / 2);
      const x2 = CX + R * Math.cos(2 * Math.PI * acum - Math.PI / 2);
      const y2 = CY + R * Math.sin(2 * Math.PI * acum - Math.PI / 2);
      const large = pct > 0.5 ? 1 : 0;
      return {
        path: `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
        color: COLORES[i % COLORES.length],
        pct, nombre: d.metodo,
        monto: d.total,
      };
    });
    return (
      <div className="rep-torta-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {arcs.map((a, i) => (
            <path key={i} d={a.path} fill={a.color} stroke="white" strokeWidth="2">
              <title>{a.nombre}: {(a.pct*100).toFixed(1)}% — ${a.monto.toLocaleString('es-CO')}</title>
            </path>
          ))}
        </svg>
        <div className="rep-torta-leyenda">
          {arcs.map((a, i) => (
            <div key={i} className="rep-leyenda-item">
              <span className="rep-leyenda-color" style={{ background: a.color }} />
              <span>{a.nombre}: {(a.pct*100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Tabla top productos ───────────────────────────────────────────
  const TablaTop = ({ datos }) => {
    if (!datos.length) return <div className="rep-vacio">Sin datos en este período.</div>;
    const max = datos[0]?.cantidad || 1;
    return (
      <div>
        {datos.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <span style={{ width: '20px', fontSize: '0.75rem', color: 'var(--color-texto-suave)', textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.nombre}
            </span>
            <div style={{ width: '140px', height: '10px', background: 'var(--color-gris)', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ height: '100%', width: `${(d.cantidad / max) * 100}%`, background: 'var(--color-amarillo-hover)', borderRadius: '5px' }} />
            </div>
            <span style={{ width: '50px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-amarillo-hover)', flexShrink: 0 }}>
              {d.cantidad} uds
            </span>
          </div>
        ))}
      </div>
    );
  };

  const periodoLabel = { semana: 'Esta semana', mes: 'Este mes', año: 'Este año' };

  return (
    <LayoutBase>
      <div className="rep-container">
        <div className="rep-header">
          <div>
            <h1 className="rep-titulo">📈 Reportes y Analítica</h1>
            <p className="rep-subtitulo">Ventas, ingresos y productos del período seleccionado.</p>
          </div>
          <div className="rep-controles">
            <select className="input-base" style={{ width: 'auto' }}
              value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="año">Este año</option>
            </select>
            <button className="btn-secondary" onClick={exportarPDF}
              disabled={ventasPorDia.length === 0} style={{ whiteSpace: 'nowrap' }}>
              📄 Exportar PDF
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="rep-cargando">⏳ Cargando datos de {periodoLabel[periodo].toLowerCase()}...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="rep-kpis">
              <div className="rep-kpi">
                <span className="rep-kpi-valor">${totalPeriodo.toLocaleString('es-CO')}</span>
                <span className="rep-kpi-label">Total vendido</span>
              </div>
              <div className="rep-kpi">
                <span className="rep-kpi-valor">{cantidadVentas}</span>
                <span className="rep-kpi-label">Transacciones</span>
              </div>
              <div className="rep-kpi">
                <span className="rep-kpi-valor">
                  ${cantidadVentas > 0
                    ? (totalPeriodo / cantidadVentas).toLocaleString('es-CO', { maximumFractionDigits: 0 })
                    : 0}
                </span>
                <span className="rep-kpi-label">Ticket promedio</span>
              </div>
            </div>

            <div className="rep-graficas-grid">
              {/* Ventas por día */}
              <div className="card rep-grafica-card">
                <h2 className="rep-grafica-titulo">📅 Ventas por Día</h2>
                <GraficaBarras datos={ventasPorDia} valorKey="total" etiquetaKey="dia" />
              </div>

              {/* Por método de pago */}
              <div className="card rep-grafica-card">
                <h2 className="rep-grafica-titulo">💳 Por Método de Pago</h2>
                <GraficaTorta datos={ventasPorMetodo} />
              </div>

              {/* Top productos */}
              <div className="card rep-grafica-card rep-grafica-full">
                <h2 className="rep-grafica-titulo">🏆 Top 10 Productos Más Vendidos</h2>
                <TablaTop datos={topProductos} />
              </div>
            </div>
          </>
        )}
      </div>
    </LayoutBase>
  );
};

export default Reportes;
