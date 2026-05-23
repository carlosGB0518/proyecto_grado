import { useState, useEffect, useContext } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import '../estilos/control-caja.css';

const ControlCaja = () => {
  const { usuario } = useContext(UsuarioContexto);

  const [sesionActiva, setSesionActiva]     = useState(null);
  const [historial, setHistorial]           = useState([]);
  const [movimientos, setMovimientos]       = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [mensaje, setMensaje]               = useState({ tipo: '', texto: '' });

  // Totales dinámicos del turno
  const [resumen, setResumen] = useState({
    ventasEfectivo: 0, ingresos: 0, egresos: 0, esperado: 0
  });

  // Formularios
  const [montoApertura, setMontoApertura]   = useState('');
  const [montoCierre, setMontoCierre]       = useState('');
  const [observaciones, setObservaciones]   = useState('');
  const [nuevoMov, setNuevoMov]             = useState({ tipo: 'ingreso', concepto: '', monto: '' });
  const [confirmandoCierre, setConfirmando] = useState(false);

  useEffect(() => { inicializar(); }, []);

  const inicializar = async () => {
    setCargando(true);
    await Promise.all([cargarSesionActiva(), cargarHistorial()]);
    setCargando(false);
  };

  const cargarSesionActiva = async () => {
    const { data } = await supabase
      .from('caja_sesiones')
      .select('*')
      .eq('estado', 'abierta')
      .order('fecha_apertura', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSesionActiva(data || null);
    if (data) {
      await cargarMovimientos(data.id);
      await calcularResumen(data);
    }
  };

  const cargarHistorial = async () => {
    const { data } = await supabase
      .from('caja_sesiones')
      .select('*')
      .order('fecha_apertura', { ascending: false })
      .limit(15);
    setHistorial(data || []);
  };

  const cargarMovimientos = async (sesionId) => {
    const { data } = await supabase
      .from('movimientos_caja')
      .select('*')
      .eq('sesion_id', sesionId)
      .order('fecha', { ascending: false });
    setMovimientos(data || []);
    return data || [];
  };

  const calcularResumen = async (sesion) => {
    // Ventas en efectivo desde apertura de esta sesión
    const { data: ventas } = await supabase
      .from('ventas')
      .select('total')
      .eq('metodo_pago', 'efectivo')
      .eq('anulada', false)
      .gte('fecha', sesion.fecha_apertura);

    const ventasEfectivo = ventas?.reduce((s, v) => s + (v.total || 0), 0) || 0;

    const movs = await cargarMovimientos(sesion.id);
    const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
    const egresos  = movs.filter(m => m.tipo === 'egreso').reduce((s, m) => s + (m.monto || 0), 0);
    const esperado = (sesion.monto_apertura || 0) + ventasEfectivo + ingresos - egresos;

    setResumen({ ventasEfectivo, ingresos, egresos, esperado });
  };

  // ── Apertura ──────────────────────────────────────────────────────
  const abrirCaja = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto de apertura válido (puede ser 0).' }); return;
    }

    // Verificar que no haya otra sesión abierta
    const { data: yaAbierta } = await supabase
      .from('caja_sesiones').select('id, usuario_nombre')
      .eq('estado', 'abierta').maybeSingle();

    if (yaAbierta) {
      setMensaje({
        tipo: 'error',
        texto: `Ya hay una caja abierta${yaAbierta.usuario_nombre ? ` por ${yaAbierta.usuario_nombre}` : ''}. Debe cerrarse antes de abrir una nueva.`
      }); return;
    }

    const { error } = await supabase.from('caja_sesiones').insert([{
      usuario_id:     usuario?.id,
      usuario_nombre: usuario?.nombre,
      monto_apertura: monto,
      estado: 'abierta',
    }]);

    if (error) { setMensaje({ tipo: 'error', texto: 'Error al abrir caja: ' + error.message }); return; }

    setMensaje({ tipo: 'exito', texto: 'Caja abierta. ¡Buen turno!' });
    setMontoApertura('');
    await inicializar();
  };

  // ── Movimiento manual ─────────────────────────────────────────────
  const registrarMovimiento = async (e) => {
    e.preventDefault();
    const monto = parseFloat(nuevoMov.monto);
    if (!nuevoMov.concepto || isNaN(monto) || monto <= 0) {
      setMensaje({ tipo: 'error', texto: 'Completa concepto y un monto mayor a 0.' }); return;
    }

    const { error } = await supabase.from('movimientos_caja').insert([{
      sesion_id:      sesionActiva.id,
      tipo:           nuevoMov.tipo,
      concepto:       nuevoMov.concepto,
      monto,
      usuario_nombre: usuario?.nombre,
    }]);

    if (error) { setMensaje({ tipo: 'error', texto: error.message }); return; }

    setMensaje({
      tipo: 'exito',
      texto: `✅ ${nuevoMov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} de $${monto.toLocaleString('es-CO')} registrado.`
    });
    setNuevoMov({ tipo: 'ingreso', concepto: '', monto: '' });
    await calcularResumen(sesionActiva);
  };

  // ── Cierre ────────────────────────────────────────────────────────
  const cerrarCaja = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoCierre);
    if (isNaN(monto) || monto < 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa el dinero físico contado.' }); return;
    }

    const diferencia = monto - resumen.esperado;

    const { error } = await supabase
      .from('caja_sesiones')
      .update({
        fecha_cierre:   new Date().toISOString(),
        monto_cierre:   monto,
        monto_esperado: resumen.esperado,
        diferencia,
        observaciones,
        estado: 'cerrada',
      })
      .eq('id', sesionActiva.id);

    if (error) { setMensaje({ tipo: 'error', texto: 'Error al cerrar caja: ' + error.message }); return; }

    const absDif = Math.abs(diferencia).toLocaleString('es-CO');
    const msg = diferencia === 0
      ? '✅ Caja cerrada correctamente. Sin diferencias.'
      : diferencia > 0
        ? `✅ Caja cerrada. Sobrante: $${absDif}`
        : `✅ Caja cerrada. Faltante: $${absDif} — Revisar con supervisor.`;

    setMensaje({ tipo: diferencia < 0 ? 'error' : 'exito', texto: msg });
    setMontoCierre(''); setObservaciones(''); setConfirmando(false);
    await inicializar();
  };

  const fmt   = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
  const fFecha = f => f ? new Date(f).toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  if (cargando) return (
    <LayoutBase>
      <div className="cc-cargando">Cargando estado de caja...</div>
    </LayoutBase>
  );

  return (
    <LayoutBase>
      <div className="cc-container">
        <div className="cc-header">
          <h1 className="cc-titulo">Control de Caja</h1>
          <p className="cc-subtitulo">Apertura, cierre, arqueo y movimientos del turno.</p>
        </div>

        {mensaje.texto && (
          <div className={mensaje.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}
            style={{ marginBottom: '1rem' }}>
            {mensaje.texto}
          </div>
        )}

        {/* Estado actual */}
        <div className="cc-estado-bar">
          <span className={`cc-estado-badge ${sesionActiva ? 'cc-abierta' : 'cc-cerrada'}`}>
            {sesionActiva ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
          </span>
          {sesionActiva && (
            <span className="cc-cajero">
              Cajero: <strong>{sesionActiva.usuario_nombre}</strong>
              &nbsp;·&nbsp;Desde: {fFecha(sesionActiva.fecha_apertura)}
              &nbsp;·&nbsp;Apertura: <strong>{fmt(sesionActiva.monto_apertura)}</strong>
            </span>
          )}
        </div>

        {/* Resumen dinámico del turno */}
        {sesionActiva && (
          <div className="cc-resumen-grid">
            <div className="cc-resumen-item">
              <span className="cc-resumen-label">Ventas efectivo</span>
              <span className="cc-resumen-valor cc-verde">{fmt(resumen.ventasEfectivo)}</span>
            </div>
            <div className="cc-resumen-item">
              <span className="cc-resumen-label">Ingresos manuales</span>
              <span className="cc-resumen-valor cc-verde">{fmt(resumen.ingresos)}</span>
            </div>
            <div className="cc-resumen-item">
              <span className="cc-resumen-label">Egresos manuales</span>
              <span className="cc-resumen-valor cc-rojo">{fmt(resumen.egresos)}</span>
            </div>
            <div className="cc-resumen-item cc-resumen-total">
              <span className="cc-resumen-label">Esperado en caja</span>
              <span className="cc-resumen-valor">{fmt(resumen.esperado)}</span>
            </div>
          </div>
        )}

        <div className="cc-grid">
          {/* Panel izquierdo */}
          <div className="cc-panel-izq">
            {!sesionActiva ? (
              /* APERTURA */
              <div className="card">
                <h2 className="cc-card-titulo">🔓 Abrir Turno de Caja</h2>
                <form onSubmit={abrirCaja} className="cc-form">
                  <div className="cc-campo">
                    <label>Dinero en caja al iniciar el turno *</label>
                    <input type="number" className="input-base" min="0" step="1000"
                      placeholder="Ej: 200000"
                      value={montoApertura}
                      onChange={e => setMontoApertura(e.target.value)} required />
                    <small style={{ color: 'var(--color-texto-suave)', fontSize: '0.78rem' }}>
                      Contabiliza el efectivo físico que hay en la caja antes de empezar.
                    </small>
                  </div>
                  <button type="submit" className="btn-primary cc-btn-grande">
                    🔓 Abrir Caja
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* MOVIMIENTOS */}
                <div className="card">
                  <h2 className="cc-card-titulo">Registrar Movimiento</h2>
                  <form onSubmit={registrarMovimiento} className="cc-form">
                    <div className="cc-form-row">
                      <div className="cc-campo">
                        <label>Tipo</label>
                        <select className="input-base" value={nuevoMov.tipo}
                          onChange={e => setNuevoMov(p => ({ ...p, tipo: e.target.value }))}>
                          <option value="ingreso">Ingreso</option>
                          <option value="egreso">Egreso</option>
                        </select>
                      </div>
                      <div className="cc-campo">
                        <label>Monto *</label>
                        <input type="number" className="input-base"
                          placeholder="0"
                          value={nuevoMov.monto}
                          onChange={e => setNuevoMov(p => ({ ...p, monto: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="cc-campo">
                      <label>Concepto *</label>
                      <input type="text" className="input-base"
                        placeholder="Ej: Pago de servicio, Préstamo, Vuelto grande..."
                        value={nuevoMov.concepto}
                        onChange={e => setNuevoMov(p => ({ ...p, concepto: e.target.value }))} required />
                    </div>
                    <button type="submit" className="btn-secondary">Registrar movimiento</button>
                  </form>

                  {movimientos.length > 0 && (
                    <div className="cc-movimientos-lista">
                      <p className="cc-sub">Movimientos del turno ({movimientos.length})</p>
                      {movimientos.map(m => (
                        <div key={m.id} className={`cc-mov-item cc-mov-${m.tipo}`}>
                          <div>
                            <span className="cc-mov-concepto">{m.concepto}</span>
                            <span className="cc-mov-hora">
                              {new Date(m.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="cc-mov-monto">
                            {m.tipo === 'egreso' ? '−' : '+'}{fmt(m.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CIERRE */}
                {!confirmandoCierre ? (
                  <div className="card cc-cierre-card">
                    <h2 className="cc-card-titulo" style={{ color: 'var(--color-rojo)' }}>
                      Cerrar Turno
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-texto-suave)', marginBottom: '1rem' }}>
                      Dinero esperado en caja: <strong style={{ color: 'var(--color-verde)' }}>{fmt(resumen.esperado)}</strong>
                    </p>
                    <button type="button" className="btn-danger cc-btn-grande"
                      onClick={() => setConfirmando(true)}>
                      Iniciar cierre de caja
                    </button>
                  </div>
                ) : (
                  <div className="card cc-cierre-card">
                    <h2 className="cc-card-titulo" style={{ color: 'var(--color-rojo)' }}>
                      Confirmar Cierre
                    </h2>
                    <form onSubmit={cerrarCaja} className="cc-form">
                      <div className="cc-campo">
                        <label>Dinero físico contado en caja *</label>
                        <input type="number" className="input-base" min="0" step="1000"
                          placeholder="Conteo físico del efectivo"
                          value={montoCierre}
                          onChange={e => setMontoCierre(e.target.value)}
                          autoFocus required />
                        {montoCierre && (
                          <small style={{
                            color: parseFloat(montoCierre) >= resumen.esperado ? 'var(--color-verde)' : 'var(--color-rojo)',
                            fontWeight: 600, fontSize: '0.82rem'
                          }}>
                            Diferencia: {fmt(parseFloat(montoCierre || 0) - resumen.esperado)}
                          </small>
                        )}
                      </div>
                      <div className="cc-campo">
                        <label>Observaciones del turno</label>
                        <textarea className="input-base" rows={2}
                          placeholder="Notas importantes del turno..."
                          value={observaciones}
                          onChange={e => setObservaciones(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" className="btn-danger cc-btn-grande">
                          Confirmar Cierre
                        </button>
                        <button type="button" className="btn-secondary"
                          onClick={() => { setConfirmando(false); setMontoCierre(''); }}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel derecho: historial */}
          <div className="cc-panel-der">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="cc-historial-header">
                <h2>Historial de Turnos</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-suave)' }}>
                  Últimos {historial.length}
                </span>
              </div>
              {historial.length === 0 ? (
                <div className="cc-vacio">No hay turnos registrados aún.</div>
              ) : (
                <div className="cc-tabla-wrapper">
                  <table className="tabla-base">
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Cajero</th>
                        <th>Apertura</th>
                        <th>Cierre</th>
                        <th>Ap.</th>
                        <th>Ci.</th>
                        <th>Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map(s => (
                        <tr key={s.id}>
                          <td>
                            <span className={`cc-badge ${s.estado === 'abierta' ? 'cc-badge-abierta' : 'cc-badge-cerrada'}`}>
                              {s.estado === 'abierta' ? '🟢 Abierta' : '⚫ Cerrada'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{s.usuario_nombre || '—'}</td>
                          <td className="cc-fecha">{fFecha(s.fecha_apertura)}</td>
                          <td className="cc-fecha">{fFecha(s.fecha_cierre)}</td>
                          <td style={{ fontSize: '0.82rem' }}>{fmt(s.monto_apertura)}</td>
                          <td style={{ fontSize: '0.82rem' }}>{fmt(s.monto_cierre)}</td>
                          <td className={
                            s.diferencia == null ? '' :
                            s.diferencia > 0 ? 'cc-sobrante' :
                            s.diferencia < 0 ? 'cc-faltante' : ''
                          }>
                            {s.diferencia == null ? '—' : (
                              <>
                                {s.diferencia > 0 ? '+' : ''}
                                {fmt(s.diferencia)}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default ControlCaja;
