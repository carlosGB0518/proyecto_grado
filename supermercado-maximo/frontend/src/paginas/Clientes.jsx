import { useState, useEffect } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import '../estilos/clientes.css';

function Clientes() {
  const [clientes, setClientes]               = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [busqueda, setBusqueda]               = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clientePuntos, setClientePuntos]     = useState(null); // modal puntos
  const [historialPuntos, setHistorialPuntos] = useState([]);
  const [puntosManual, setPuntosManual]       = useState('');
  const [conceptoPuntos, setConceptoPuntos]   = useState('');
  const [mensaje, setMensaje]                 = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    nombre: '', telefono: '', correo: '',
    numero_identificacion: '', direccion: '',
  });

  useEffect(() => { cargarClientes(); }, []);

  const cargarClientes = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('clientes').select('*').order('nombre');
    setClientes(data || []);
    setCargando(false);
  };

  const manejarCambio = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const abrirNuevo = () => {
    setClienteEditando(null);
    setFormData({ nombre: '', telefono: '', correo: '', numero_identificacion: '', direccion: '' });
    setMostrarFormulario(true);
    setMensaje({ tipo: '', texto: '' });
  };

  const abrirEdicion = c => {
    setClienteEditando(c);
    setFormData({ nombre: c.nombre||'', telefono: c.telefono||'', correo: c.correo||'',
      numero_identificacion: c.numero_identificacion||'', direccion: c.direccion||'' });
    setMostrarFormulario(true);
    setMensaje({ tipo: '', texto: '' });
  };

  const guardar = async e => {
    e.preventDefault();
    let error;
    if (clienteEditando) {
      ({ error } = await supabase.from('clientes').update(formData).eq('id', clienteEditando.id));
    } else {
      ({ error } = await supabase.from('clientes').insert([{ ...formData, puntos: 0 }]));
    }
    if (error) { setMensaje({ tipo: 'error', texto: error.message }); return; }
    setMensaje({ tipo: 'exito', texto: `✅ Cliente "${formData.nombre}" ${clienteEditando ? 'actualizado' : 'registrado'}.` });
    setMostrarFormulario(false);
    cargarClientes();
  };

  // ── Módulo de puntos ──────────────────────────────────────────────
  const abrirPuntos = async (c) => {
    setClientePuntos(c);
    const { data } = await supabase
      .from('puntos_historial')
      .select('*').eq('cliente_id', c.id)
      .order('fecha', { ascending: false }).limit(20);
    setHistorialPuntos(data || []);
  };

  const agregarPuntosManual = async e => {
    e.preventDefault();
    if (!puntosManual || !conceptoPuntos) return;
    const delta = parseInt(puntosManual);
    const nuevoTotal = (clientePuntos.puntos || 0) + delta;

    const { error: e1 } = await supabase.from('puntos_historial').insert([{
      cliente_id: clientePuntos.id, puntos: delta, concepto: conceptoPuntos,
    }]);
    const { error: e2 } = await supabase.from('clientes')
      .update({ puntos: nuevoTotal }).eq('id', clientePuntos.id);

    if (e1 || e2) { setMensaje({ tipo: 'error', texto: 'Error al actualizar puntos.' }); return; }
    setPuntosManual(''); setConceptoPuntos('');
    setClientePuntos(p => ({ ...p, puntos: nuevoTotal }));
    cargarClientes();
    const { data } = await supabase.from('puntos_historial').select('*')
      .eq('cliente_id', clientePuntos.id).order('fecha', { ascending: false }).limit(20);
    setHistorialPuntos(data || []);
  };

  const filtrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numero_identificacion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <LayoutBase>
      <div className="clientes-container">
        <div className="clientes-header">
          <div>
            <h1 className="clientes-titulo">Gestión de Clientes</h1>
            <p className="clientes-subtitulo">Registra clientes y administra su fidelización.</p>
          </div>
          <button className="btn-primary" onClick={abrirNuevo}>+ Nuevo Cliente</button>
        </div>

        {mensaje.texto && (
          <div className={mensaje.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}>{mensaje.texto}</div>
        )}

        {mostrarFormulario && (
          <div className="clientes-form-card card">
            <h2 className="clientes-form-titulo">{clienteEditando ? '✏️ Editar' : '➕ Nuevo Cliente'}</h2>
            <form className="clientes-form" onSubmit={guardar}>
              <div className="clientes-form-grid">
                <div className="clientes-campo">
                  <label>Nombre *</label>
                  <input type="text" name="nombre" className="input-base" placeholder="Juan Pérez"
                    value={formData.nombre} onChange={manejarCambio} required />
                </div>
                <div className="clientes-campo">
                  <label>N° Identificación</label>
                  <input type="text" name="numero_identificacion" className="input-base"
                    placeholder="Cédula o NIT" value={formData.numero_identificacion} onChange={manejarCambio} />
                </div>
                <div className="clientes-campo">
                  <label>Teléfono</label>
                  <input type="text" name="telefono" className="input-base"
                    placeholder="3001234567" value={formData.telefono} onChange={manejarCambio} />
                </div>
                <div className="clientes-campo">
                  <label>Correo</label>
                  <input type="email" name="correo" className="input-base"
                    placeholder="cliente@correo.com" value={formData.correo} onChange={manejarCambio} />
                </div>
                <div className="clientes-campo clientes-campo-full">
                  <label>Dirección</label>
                  <input type="text" name="direccion" className="input-base"
                    placeholder="Dirección" value={formData.direccion} onChange={manejarCambio} />
                </div>
              </div>
              <div className="clientes-form-acciones">
                <button type="submit" className="btn-primary">{clienteEditando ? 'Actualizar' : 'Registrar'}</button>
                <button type="button" className="btn-secondary" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal puntos */}
        {clientePuntos && (
          <div className="modal-overlay" onClick={() => setClientePuntos(null)}>
            <div className="modal-content clientes-modal-puntos" onClick={e => e.stopPropagation()}>
              <h2>Puntos — {clientePuntos.nombre}</h2>
              <div className="clientes-puntos-total">
                <span className="clientes-puntos-numero">{clientePuntos.puntos || 0}</span>
                <span>puntos acumulados</span>
              </div>

              <form onSubmit={agregarPuntosManual} className="clientes-puntos-form">
                <input type="number" className="input-base" placeholder="Puntos (positivo=agregar, negativo=canjear)"
                  value={puntosManual} onChange={e => setPuntosManual(e.target.value)} required />
                <input type="text" className="input-base" placeholder="Concepto (ej: Compra, Canje descuento)"
                  value={conceptoPuntos} onChange={e => setConceptoPuntos(e.target.value)} required />
                <button type="submit" className="btn-primary">Registrar</button>
              </form>

              <h3 style={{ marginTop: '1.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-texto)' }}>
                Historial de puntos
              </h3>
              <div className="clientes-puntos-historial">
                {historialPuntos.length === 0 ? (
                  <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem' }}>Sin movimientos.</p>
                ) : historialPuntos.map(h => (
                  <div key={h.id} className={`clientes-puntos-mov ${h.puntos >= 0 ? 'puntos-pos' : 'puntos-neg'}`}>
                    <span>{h.concepto}</span>
                    <span>{h.puntos > 0 ? '+' : ''}{h.puntos} pts</span>
                  </div>
                ))}
              </div>
              <button className="btn-secondary" style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => setClientePuntos(null)}>Cerrar</button>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div className="clientes-lista-header">
            <div className="clientes-busqueda-wrap">
              <span>🔍</span>
              <input type="text" className="clientes-busqueda"
                placeholder="Buscar por nombre, correo o ID..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <span className="clientes-contador">{filtrados.length} clientes</span>
          </div>

          {cargando ? (
            <div className="clientes-estado">Cargando...</div>
          ) : filtrados.length === 0 ? (
            <div className="clientes-estado">
              {busqueda ? 'Sin resultados.' : 'No hay clientes registrados.'}
            </div>
          ) : (
            <div className="clientes-tabla-wrapper">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Identificación</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Puntos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="cliente-nombre-celda">
                          <div className="cliente-avatar">{(c.nombre||'C').charAt(0).toUpperCase()}</div>
                          <span className="cliente-nombre">{c.nombre}</span>
                        </div>
                      </td>
                      <td>{c.numero_identificacion||'—'}</td>
                      <td>{c.telefono||'—'}</td>
                      <td>{c.correo||'—'}</td>
                      <td>
                        <span className="clientes-badge-puntos">{c.puntos || 0} pts</span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="clientes-btn-editar" onClick={() => abrirEdicion(c)}>✏️</button>
                        <button className="clientes-btn-puntos" onClick={() => abrirPuntos(c)}>⭐</button>
                      </td>
                    </tr>
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

export default Clientes;
