import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/GestionVencimientos.css';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const diasRestantes = (fecha) => {
  if (!fecha) return null;
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fecha + 'T00:00:00'); venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
};

const estadoDias = (dias) => {
  if (dias === null) return 'sin-fecha';
  if (dias < 0)     return 'vencido';
  if (dias <= 3)    return 'critico';
  if (dias <= 7)    return 'proximo';
  return 'ok';
};

const colorDias = (dias) => ({
  'sin-fecha': '#9E9E9E',
  vencido:     '#C62828',
  critico:     '#E65100',
  proximo:     '#F9A825',
  ok:          '#2E7D32',
}[estadoDias(dias)]);

const fmt = (f) => !f ? '—' : new Date(f + 'T00:00:00').toLocaleDateString('es-CO', {
  year: 'numeric', month: 'short', day: 'numeric',
});

const LabelDias = ({ dias }) => {
  const texto =
    dias === null ? 'Sin fecha' :
    dias < 0     ? `Venció hace ${Math.abs(dias)}d` :
    dias === 0   ? 'Vence hoy' :
                   `${dias}d restante${dias !== 1 ? 's' : ''}`;
  return <span className={`ven-dias-badge ven-${estadoDias(dias)}`}>{texto}</span>;
};

// ─────────────────────────────────────────────────────────────────
// FORMULARIO DE LOTE
// ─────────────────────────────────────────────────────────────────
const LOTE_VACIO = { numero_lote: '', fecha_entrada: '', fecha_vencimiento: '', cantidad: '0', estado: 'disponible' };

function FormLote({ productoId, onGuardado, loteEditando, onCancelarEdicion }) {
  const [form, setForm]       = useState(loteEditando || LOTE_VACIO);
  const [error, setError]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const editando = !!loteEditando;

  useEffect(() => {
    setForm(loteEditando || LOTE_VACIO);
    setError('');
  }, [loteEditando]);

  const cambiar = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.fecha_vencimiento) { setError('La fecha de vencimiento es obligatoria.'); return; }
    const cant = parseInt(form.cantidad);
    if (isNaN(cant) || cant < 0) { setError('La cantidad debe ser 0 o mayor.'); return; }
    if (form.fecha_entrada && new Date(form.fecha_vencimiento) <= new Date(form.fecha_entrada)) {
      setError('La fecha de vencimiento debe ser posterior a la de entrada.'); return;
    }

    setGuardando(true);
    const payload = {
      producto_id:       productoId,
      numero_lote:       form.numero_lote || null,
      fecha_entrada:     form.fecha_entrada || null,
      fecha_vencimiento: form.fecha_vencimiento,
      cantidad:          cant,
      estado:            form.estado || 'disponible',
    };

    let err;
    if (editando) {
      ({ error: err } = await supabase.from('lotes').update(payload).eq('id', loteEditando.id));
    } else {
      ({ error: err } = await supabase.from('lotes').insert([payload]));
    }
    setGuardando(false);

    if (err) { setError('Error al guardar: ' + err.message); return; }
    setForm(LOTE_VACIO);
    onGuardado?.();
    if (editando) onCancelarEdicion?.();
  };

  return (
    <form className="form-lote" onSubmit={guardar}>
      <div className="form-lote-grid">
        <div className="form-lote-campo">
          <label>N° Lote</label>
          <input type="text" name="numero_lote" className="input-base"
            placeholder="Ej: LOTE-2025-001" value={form.numero_lote} onChange={cambiar} />
        </div>
        <div className="form-lote-campo">
          <label>Fecha de Entrada</label>
          <input type="date" name="fecha_entrada" className="input-base"
            value={form.fecha_entrada} onChange={cambiar} />
        </div>
        <div className="form-lote-campo">
          <label>Fecha de Vencimiento *</label>
          <input type="date" name="fecha_vencimiento" className="input-base"
            value={form.fecha_vencimiento} onChange={cambiar} required />
        </div>
        <div className="form-lote-campo">
          <label>Cantidad</label>
          <input type="number" name="cantidad" className="input-base"
            min="0" placeholder="0" value={form.cantidad} onChange={cambiar} />
        </div>
        {editando && (
          <div className="form-lote-campo">
            <label>Estado del lote</label>
            <select name="estado" className="input-base" value={form.estado} onChange={cambiar}>
              <option value="disponible">Disponible</option>
              <option value="retirado">Retirado</option>
              <option value="agotado">Agotado</option>
            </select>
          </div>
        )}
      </div>
      {error && <p className="form-lote-error">⚠️ {error}</p>}
      <div className="form-lote-acciones">
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : editando ? '💾 Actualizar lote' : '➕ Agregar lote'}
        </button>
        {editando && (
          <button type="button" className="btn-secondary" onClick={onCancelarEdicion}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// PANEL DE LOTES (expandible por producto)
// ─────────────────────────────────────────────────────────────────
function PanelLotes({ producto, onActualizarPadre }) {
  const [lotes, setLotes]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [loteEditando, setLoteEditando] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);

  const cargarLotes = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from('lotes')
      .select('*')
      .eq('producto_id', producto.id)
      .order('fecha_vencimiento', { ascending: true });
    setLotes(data || []);
    setCargando(false);
  }, [producto.id]);

  useEffect(() => { cargarLotes(); }, [cargarLotes]);

  // Sincroniza fecha_vencimiento principal del producto con el lote más próximo disponible
  const sincronizarPrincipal = async (lotesActuales) => {
    const disponibles = lotesActuales.filter(l => l.estado === 'disponible' && l.fecha_vencimiento);
    if (disponibles.length === 0) return;
    const masProximo = disponibles.reduce((min, l) =>
      new Date(l.fecha_vencimiento) < new Date(min.fecha_vencimiento) ? l : min
    );
    setSincronizando(true);
    await supabase.from('productos').update({
      fecha_vencimiento: masProximo.fecha_vencimiento,
      fecha_entrada:     masProximo.fecha_entrada || null,
      numero_lote:       masProximo.numero_lote   || null,
    }).eq('id', producto.id);
    setSincronizando(false);
  };

  const onGuardado = async () => {
    await cargarLotes();
    const { data } = await supabase.from('lotes').select('*')
      .eq('producto_id', producto.id).order('fecha_vencimiento');
    if (data) {
      setLotes(data);
      await sincronizarPrincipal(data);
    }
    onActualizarPadre?.();
  };

  const eliminarLote = async (id) => {
    if (!window.confirm('¿Eliminar este lote?')) return;
    await supabase.from('lotes').delete().eq('id', id);
    onGuardado();
  };

  const retirarLote = async (id) => {
    if (!window.confirm('¿Marcar este lote como retirado?')) return;
    await supabase.from('lotes').update({ estado: 'retirado' }).eq('id', id);
    onGuardado();
  };

  return (
    <div className="panel-lotes">
      <div className="panel-lotes-inner">

        {/* ── Columna izquierda: formulario ── */}
        <div className="panel-lotes-form-section">
          <h4 className="panel-lotes-subtitulo">
            {loteEditando ? '✏️ Editando lote' : '➕ Agregar nuevo lote'}
            {sincronizando && <span className="sincro-label"> · sincronizando...</span>}
          </h4>
          <FormLote
            productoId={producto.id}
            onGuardado={onGuardado}
            loteEditando={loteEditando}
            onCancelarEdicion={() => setLoteEditando(null)}
          />
        </div>

        {/* ── Columna derecha: lista de lotes ── */}
        <div className="panel-lotes-lista-section">
          <h4 className="panel-lotes-subtitulo">
            📦 Lotes registrados
            {!cargando && <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)', fontSize: '0.82rem' }}>
              {' '}({lotes.length})
            </span>}
          </h4>

          {cargando ? (
            <p className="panel-lotes-vacio">Cargando lotes...</p>
          ) : lotes.length === 0 ? (
            <div className="panel-lotes-vacio">
              <p>No hay lotes registrados.</p>
              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                Usa el formulario de la izquierda para agregar el primer lote.
              </p>
            </div>
          ) : (
            <div className="panel-lotes-tabla-wrapper">
              <table className="tabla-base panel-lotes-tabla">
                <thead>
                  <tr>
                    <th>N° Lote</th>
                    <th>Entrada</th>
                    <th>Vencimiento</th>
                    <th>Días</th>
                    <th>Cant.</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map(l => {
                    const dias = diasRestantes(l.fecha_vencimiento);
                    return (
                      <tr key={l.id}
                        className={`lote-fila lote-fila-${l.estado} ${loteEditando?.id === l.id ? 'lote-editando' : ''}`}
                        style={{ borderLeft: `3px solid ${colorDias(dias)}` }}>
                        <td className="lote-numero">{l.numero_lote || '—'}</td>
                        <td className="lote-fecha">{fmt(l.fecha_entrada)}</td>
                        <td className="lote-fecha">{fmt(l.fecha_vencimiento)}</td>
                        <td><LabelDias dias={dias} /></td>
                        <td className="lote-cantidad">{l.cantidad}</td>
                        <td>
                          <span className={`ven-badge ven-badge-${l.estado}`}>{l.estado}</span>
                        </td>
                        <td className="lote-acciones">
                          <button className="btn-lote-editar"
                            onClick={() => setLoteEditando(loteEditando?.id === l.id ? null : l)}
                            title="Editar lote">✏️</button>
                          {l.estado === 'disponible' && (
                            <button className="btn-lote-retirar"
                              onClick={() => retirarLote(l.id)}
                              title="Marcar como retirado">📤</button>
                          )}
                          <button className="btn-lote-eliminar"
                            onClick={() => eliminarLote(l.id)}
                            title="Eliminar lote">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FILA DE PRODUCTO (reutilizable en tabla principal y sin-fecha)
// ─────────────────────────────────────────────────────────────────
function FilaProducto({ p, panelAbierto, onToggle, onRetirar, onActualizarPadre }) {
  const dias   = diasRestantes(p.fecha_vencimiento);
  const abierto = panelAbierto === p.id;

  return (
    <>
      <tr
        className={`ven-fila ven-fila-${estadoDias(dias)} ${abierto ? 'ven-fila-activa' : ''}`}
        style={{ borderLeft: `4px solid ${colorDias(dias)}` }}
      >
        <td className="ven-toggle-cell">
          <button
            className={`btn-toggle-lotes ${abierto ? 'abierto' : ''}`}
            onClick={() => onToggle(p.id)}
            title={abierto ? 'Ocultar lotes' : 'Gestionar lotes y fechas'}
          >
            {abierto ? '▼' : '▶'}
          </button>
        </td>
        <td className="ven-codigo">{p.codigo || '—'}</td>
        <td className="ven-nombre">{p.nombre}</td>
        <td className="ven-lote">{p.numero_lote || '—'}</td>
        <td className="ven-fecha">{fmt(p.fecha_entrada)}</td>
        <td className="ven-fecha">{fmt(p.fecha_vencimiento)}</td>
        <td><LabelDias dias={dias} /></td>
        <td className="ven-stock">{p.stockactual ?? 0}</td>
        <td>
          <span className={`ven-badge ven-badge-${p.estado_producto || 'disponible'}`}>
            {p.estado_producto || 'disponible'}
          </span>
        </td>
        <td className="ven-acciones">
          {p.estado_producto !== 'retirado' && (
            <button className="btn-retirar"
              onClick={() => onRetirar(p.id, p.nombre)}
              title="Marcar producto como retirado">
              📤 Retirar
            </button>
          )}
        </td>
      </tr>

      {abierto && (
        <tr className="ven-fila-panel">
          <td colSpan="10" style={{ padding: 0 }}>
            <PanelLotes producto={p} onActualizarPadre={onActualizarPadre} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
function GestionVencimientos() {
  const [productos, setProductos]             = useState([]);
  const [productosSinFecha, setSinFecha]      = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [actualizando, setActualizando]       = useState(false);
  const [filtro, setFiltro]                   = useState('todos');   // default: todos
  const [diasAlerta, setDiasAlerta]           = useState(30);        // default: 30 días
  const [panelAbierto, setPanelAbierto]       = useState(null);
  const [busqueda, setBusqueda]               = useState('');
  const [sinFechaColapsado, setSinFechaColapsado] = useState(false);

  const cargarProductos = useCallback(async (esManual = false) => {
    if (esManual) setActualizando(true);
    else setCargando(true);

    try {
      const hoy = new Date().toISOString().split('T')[0];
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasAlerta);
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

      // Query principal (según filtro)
      let query = supabase
        .from('productos')
        .select('id, nombre, codigo, fecha_vencimiento, fecha_entrada, numero_lote, estado_producto, stockactual')
        .eq('activo', true);

      if (filtro === 'proximo') {
        query = query
          .not('fecha_vencimiento', 'is', null)
          .gte('fecha_vencimiento', hoy)
          .lte('fecha_vencimiento', fechaLimiteStr)
          .neq('estado_producto', 'retirado');
      } else if (filtro === 'vencido') {
        query = query
          .not('fecha_vencimiento', 'is', null)
          .lt('fecha_vencimiento', hoy)
          .neq('estado_producto', 'retirado');
      } else if (filtro === 'sin_fecha') {
        query = query.is('fecha_vencimiento', null).neq('estado_producto', 'retirado');
      } else {
        // 'todos': todos excepto retirados
        query = query.neq('estado_producto', 'retirado');
      }

      const [{ data: principales }, { data: sinFecha }] = await Promise.all([
        query.order('fecha_vencimiento', { ascending: true, nullsLast: true }),
        // Siempre traer sin fecha (para el banner superior)
        supabase.from('productos')
          .select('id, nombre, codigo, fecha_vencimiento, fecha_entrada, numero_lote, estado_producto, stockactual')
          .eq('activo', true)
          .is('fecha_vencimiento', null)
          .neq('estado_producto', 'retirado')
          .order('nombre'),
      ]);

      setProductos(principales || []);
      // Solo mostrar sin-fecha en el banner si el filtro NO es 'sin_fecha' (para no duplicar)
      setSinFecha(filtro !== 'sin_fecha' ? (sinFecha || []) : []);
    } catch (err) {
      console.error('Error cargando:', err);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [filtro, diasAlerta]);

  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  const marcarRetirado = async (id, nombre) => {
    if (!window.confirm(`¿Marcar "${nombre}" como retirado?\nDejará de aparecer en el inventario activo.`)) return;
    await supabase.from('productos').update({ estado_producto: 'retirado' }).eq('id', id);
    cargarProductos();
  };

  const togglePanel = (id) => {
    setPanelAbierto(prev => prev === id ? null : id);
  };

  // Filtro de texto
  const filtrar = (lista) => !busqueda ? lista : lista.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Contadores para estadísticas (sobre TODOS los productos cargados)
  const todos = [...productos, ...(filtro !== 'sin_fecha' ? productosSinFecha : [])];
  const contar = (est) => todos.filter(p => estadoDias(diasRestantes(p.fecha_vencimiento)) === est).length;

  const encabezadoTabla = (
    <thead>
      <tr>
        <th style={{ width: '32px' }} />
        <th>Código</th>
        <th>Nombre</th>
        <th>N° Lote</th>
        <th>Entrada</th>
        <th>Vencimiento</th>
        <th>Días</th>
        <th>Stock</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
  );

  return (
    <LayoutBase>
      <div className="vencimiento-container">

        {/* ── Header ── */}
        <div className="vencimiento-header">
          <div>
            <h1 className="vencimiento-titulo">📅 Gestión de Vencimientos</h1>
            <p className="vencimiento-subtitulo">
              Haz clic en <strong>▶</strong> en cualquier producto para agregar o editar sus lotes y fechas.
            </p>
          </div>
          <button
            className={`btn-refrescar ${actualizando ? 'actualizando' : ''}`}
            onClick={() => cargarProductos(true)}
            disabled={cargando || actualizando}
          >
            {actualizando ? '⟳ Actualizando...' : '⟳ Refrescar'}
          </button>
        </div>

        {/* ── Estadísticas ── */}
        <div className="vencimiento-estadisticas">
          <div className="stat-item stat-vencido">
            <div className="stat-numero">{contar('vencido')}</div>
            <div className="stat-label">Vencidos</div>
          </div>
          <div className="stat-item stat-critico">
            <div className="stat-numero">{contar('critico')}</div>
            <div className="stat-label">Crítico (0–3d)</div>
          </div>
          <div className="stat-item stat-proximo">
            <div className="stat-numero">{contar('proximo')}</div>
            <div className="stat-label">Próximos (4–{diasAlerta}d)</div>
          </div>
          <div className="stat-item stat-ok">
            <div className="stat-numero">{contar('ok')}</div>
            <div className="stat-label">Vigentes</div>
          </div>
          <div className="stat-item stat-sin-fecha">
            <div className="stat-numero">{productosSinFecha.length + (filtro === 'sin_fecha' ? productos.length : 0)}</div>
            <div className="stat-label">Sin fecha</div>
          </div>
        </div>

        {/* ── Controles ── */}
        <div className="vencimiento-controles card">
          <div className="ctrl-grupo">
            <label>Filtro:</label>
            <select value={filtro} onChange={e => setFiltro(e.target.value)}
              className="select-base" disabled={actualizando}>
              <option value="todos">Todos los productos</option>
              <option value="proximo">Próximos a vencer</option>
              <option value="vencido">Vencidos</option>
              <option value="sin_fecha">Sin fecha asignada</option>
            </select>
          </div>
          <div className="ctrl-grupo">
            <label>Días de alerta:</label>
            <input type="number" min="1" max="90" value={diasAlerta}
              onChange={e => setDiasAlerta(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-base" style={{ width: '80px' }} disabled={actualizando} />
          </div>
          <div className="ctrl-grupo ctrl-busqueda">
            <label>Buscar producto:</label>
            <input type="text" placeholder="Nombre o código..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-base" />
          </div>
        </div>

        {/* ── BANNER: Productos sin fecha (siempre visible si existen) ── */}
        {productosSinFecha.length > 0 && (
          <div className="sin-fecha-banner card">
            <div className="sin-fecha-banner-header"
              onClick={() => setSinFechaColapsado(p => !p)}
              style={{ cursor: 'pointer' }}>
              <div>
                <span className="sin-fecha-icono">⚠️</span>
                <span className="sin-fecha-titulo">
                  {productosSinFecha.length} producto{productosSinFecha.length !== 1 ? 's' : ''} sin fecha de vencimiento asignada
                </span>
              </div>
              <span className="sin-fecha-toggle">{sinFechaColapsado ? '▼ Mostrar' : '▲ Ocultar'}</span>
            </div>

            {!sinFechaColapsado && (
              <div className="sin-fecha-tabla-wrapper">
                <p className="sin-fecha-hint">
                  Haz clic en <strong>▶</strong> para expandir el panel de lotes y asignar la fecha de vencimiento.
                </p>
                <table className="tabla-base">
                  {encabezadoTabla}
                  <tbody>
                    {filtrar(productosSinFecha).map(p => (
                      <FilaProducto
                        key={p.id}
                        p={p}
                        panelAbierto={panelAbierto}
                        onToggle={togglePanel}
                        onRetirar={marcarRetirado}
                        onActualizarPadre={() => cargarProductos(true)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Leyenda ── */}
        <div className="vencimiento-leyenda">
          <span className="leyenda-item"><span className="dot dot-vencido" />Vencido</span>
          <span className="leyenda-item"><span className="dot dot-critico" />Crítico (0–3d)</span>
          <span className="leyenda-item"><span className="dot dot-proximo" />Próximo</span>
          <span className="leyenda-item"><span className="dot dot-ok" />Vigente</span>
          <span className="leyenda-item"><span className="dot dot-sin-fecha" />Sin fecha</span>
          <span className="leyenda-tip">💡 Clic en <strong>▶</strong> para gestionar lotes</span>
        </div>

        {/* ── Tabla principal ── */}
        <div className={`card tabla-card ${actualizando ? 'sincronizando' : ''}`}>
          {cargando ? (
            <div className="vencimiento-estado loading">
              <div className="spinner" />
              <p>Cargando productos...</p>
            </div>
          ) : filtrar(productos).length === 0 ? (
            <div className="vencimiento-estado empty">
              <p>✅ No hay productos con los filtros seleccionados.</p>
              {filtro !== 'todos' && (
                <button className="btn-secondary" style={{ marginTop: '0.5rem' }}
                  onClick={() => setFiltro('todos')}>
                  Ver todos los productos
                </button>
              )}
            </div>
          ) : (
            <div className="vencimiento-tabla-wrapper">
              <table className="tabla-base">
                {encabezadoTabla}
                <tbody>
                  {filtrar(productos).map(p => (
                    <FilaProducto
                      key={p.id}
                      p={p}
                      panelAbierto={panelAbierto}
                      onToggle={togglePanel}
                      onRetirar={marcarRetirado}
                      onActualizarPadre={() => cargarProductos(true)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </LayoutBase>
  );
}

export default GestionVencimientos;
