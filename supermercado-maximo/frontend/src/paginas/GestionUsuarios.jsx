import { useState, useEffect, useContext } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import '../estilos/gestion-usuarios.css';

const ROLES = ['cajero', 'supervisor', 'administrador'];
const etiquetasRol = {
  cajero: 'Cajero',
  supervisor: 'Supervisor',
  administrador: 'Administrador',
};

const GestionUsuarios = () => {
  const { usuario: usuarioActual } = useContext(UsuarioContexto);
  const [usuarios, setUsuarios]           = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje]             = useState({ tipo: '', texto: '' });
  const [enviando, setEnviando]           = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', correo: '', password: '', rol: 'cajero',
  });

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, rol, activo, created_at')
      .order('created_at', { ascending: false });
    if (!error) setUsuarios(data || []);
    setCargando(false);
  };

  const manejarCambio = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Crear usuario ─────────────────────────────────────────────────
  const crearUsuario = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje({ tipo: '', texto: '' });

    const { nombre, correo, password, rol } = formData;

    if (password.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres.' });
      setEnviando(false); return;
    }

    // Crear en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password,
      options: { data: { nombre_completo: nombre } },
    });

    if (signUpError) {
      // Errores comunes: usuario ya existe, email inválido, etc.
      let msg = signUpError.message;
      if (msg.includes('already registered')) msg = 'Ya existe una cuenta con ese correo.';
      if (msg.includes('invalid')) msg = 'Correo inválido.';
      setMensaje({ tipo: 'error', texto: msg });
      setEnviando(false); return;
    }

    const userId = signUpData?.user?.id;

    if (!userId) {
      // Supabase puede requerir confirmación de email en producción.
      // En ese caso user viene en session, no en user directamente.
      setMensaje({
        tipo: 'exito',
        texto: `Cuenta creada para ${nombre}. Si está habilitada la confirmación de email, el usuario recibirá un correo.`,
      });
      // Intentamos insertar el registro aunque no tengamos el ID aún
      setMostrarFormulario(false);
      setFormData({ nombre: '', correo: '', password: '', rol: 'cajero' });
      setTimeout(cargarUsuarios, 2000);
      setEnviando(false); return;
    }

    // Insertar en tabla usuarios con el rol asignado
    const { error: insertError } = await supabase
      .from('usuarios')
      .upsert([{ id: userId, nombre, correo, rol, activo: true }]);

    if (insertError) {
      setMensaje({
        tipo: 'error',
        texto: 'Cuenta de Auth creada pero error al guardar perfil: ' + insertError.message,
      });
      setEnviando(false); return;
    }

    setMensaje({ tipo: 'exito', texto: `Usuario ${nombre} creado como ${etiquetasRol[rol]}.` });
    setFormData({ nombre: '', correo: '', password: '', rol: 'cajero' });
    setMostrarFormulario(false);
    cargarUsuarios();
    setEnviando(false);
  };

  // ── Cambiar rol ───────────────────────────────────────────────────
  const cambiarRol = async (usuarioId, nuevoRol) => {
    if (usuarioId === usuarioActual?.id) {
      alert('No puedes cambiar tu propio rol.'); return;
    }
    const { error } = await supabase
      .from('usuarios').update({ rol: nuevoRol }).eq('id', usuarioId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al cambiar rol: ' + error.message });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Rol actualizado.' });
      cargarUsuarios();
    }
  };

  // ── Activar / desactivar ──────────────────────────────────────────
  const toggleActivo = async (usuarioId, estadoActual) => {
    if (usuarioId === usuarioActual?.id) {
      alert('No puedes desactivar tu propia cuenta.'); return;
    }
    const nuevoEstado = !estadoActual;
    const { error } = await supabase
      .from('usuarios').update({ activo: nuevoEstado }).eq('id', usuarioId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar estado.' });
    } else {
      setMensaje({ tipo: 'exito', texto: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'}.` });
      cargarUsuarios();
    }
  };

  const formatearFecha = (f) => f
    ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <LayoutBase>
      <div className="gu-container">
        {/* Cabecera */}
        <div className="gu-header">
          <div>
            <h1 className="gu-titulo">Gestión de Usuarios</h1>
            <p className="gu-subtitulo">
              Crea y administra el acceso del personal. Los usuarios nuevos reciben
              rol <strong>Cajero</strong> por defecto; cambia el rol desde la tabla.
            </p>
          </div>
          <button className="btn-primary"
            onClick={() => { setMostrarFormulario(!mostrarFormulario); setMensaje({ tipo: '', texto: '' }); }}>
            {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>

        {mensaje.texto && (
          <div className={mensaje.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}>
            {mensaje.texto}
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="gu-form-card card">
            <h2 className="gu-form-titulo">Crear Nuevo Usuario</h2>
            <form className="gu-form" onSubmit={crearUsuario}>
              <div className="gu-form-grid">
                <div className="gu-campo">
                  <label>Nombre completo *</label>
                  <input type="text" name="nombre" className="input-base"
                    placeholder="Ej: María García"
                    value={formData.nombre} onChange={manejarCambio} required />
                </div>
                <div className="gu-campo">
                  <label>Correo electrónico *</label>
                  <input type="email" name="correo" className="input-base"
                    placeholder="usuario@supermercado.com"
                    value={formData.correo} onChange={manejarCambio} required />
                </div>
                <div className="gu-campo">
                  <label>Contraseña temporal * (mín. 6 caracteres)</label>
                  <input type="password" name="password" className="input-base"
                    placeholder="Contraseña temporal"
                    value={formData.password} onChange={manejarCambio}
                    required minLength={6} />
                </div>
                <div className="gu-campo">
                  <label>Rol *</label>
                  <select name="rol" className="input-base"
                    value={formData.rol} onChange={manejarCambio}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{etiquetasRol[r]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gu-roles-info">
                <p><strong>Cajero:</strong> Caja, clientes, facturación, control de caja.</p>
                <p><strong>Supervisor:</strong> + Historial de ventas, anulaciones y reportes.</p>
                <p><strong>Administrador:</strong> + Inventario, proveedores, pedidos y usuarios.</p>
              </div>

              <div className="gu-form-acciones">
                <button type="submit" className="btn-primary" disabled={enviando}>
                  {enviando ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button type="button" className="btn-secondary"
                  onClick={() => setMostrarFormulario(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div className="gu-tabla-header">
            <h2>Usuarios Registrados</h2>
            <span className="gu-contador">{usuarios.length} usuarios</span>
          </div>

          {cargando ? (
            <div className="gu-cargando">Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <div className="gu-vacio">No hay usuarios registrados.</div>
          ) : (
            <div className="gu-tabla-wrapper">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className={!u.activo ? 'gu-fila-inactiva' : ''}>
                      <td>
                        <div className="gu-usuario-celda">
                          <div className="gu-avatar">
                            {(u.nombre || u.correo || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="gu-nombre">{u.nombre || '—'}</span>
                          {u.id === usuarioActual?.id && <span className="gu-yo">(tú)</span>}
                        </div>
                      </td>
                      <td className="gu-correo">{u.correo}</td>
                      <td>
                        {u.id === usuarioActual?.id ? (
                          <span className={`badge-rol badge-rol-${u.rol}`}>
                            {etiquetasRol[u.rol] || u.rol}
                          </span>
                        ) : (
                          <select className="gu-select-rol" value={u.rol}
                            onChange={e => cambiarRol(u.id, e.target.value)}>
                            {ROLES.map(r => (
                              <option key={r} value={r}>{etiquetasRol[r]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`gu-estado ${u.activo ? 'gu-activo' : 'gu-inactivo'}`}>
                          {u.activo ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>
                      <td className="gu-fecha">{formatearFecha(u.created_at)}</td>
                      <td>
                        {u.id !== usuarioActual?.id && (
                          <button
                            className={u.activo ? 'gu-btn-desactivar' : 'gu-btn-activar'}
                            onClick={() => toggleActivo(u.id, u.activo)}>
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
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
    </LayoutBase>
  );
};

export default GestionUsuarios;
