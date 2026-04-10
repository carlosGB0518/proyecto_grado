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
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'cajero',
  });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, rol, activo, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando usuarios:', error);
    } else {
      setUsuarios(data || []);
    }
    setCargando(false);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje({ tipo: '', texto: '' });

    const { nombre, correo, password, rol } = formData;

    // 1️⃣ Crear en Supabase Auth — usa signUp con correo/contraseña
    const { data, error: authError } = await supabase.auth.admin
      ? // Si tenemos permisos admin, crear sin confirmar email
        { data: null, error: new Error('use_signup') }
      : { data: null, error: new Error('use_signup') };

    // Usamos el endpoint estándar de signUp
    // Nota: en producción con email confirm deshabilitado esto funciona directo
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: { nombre_completo: nombre },
      },
    });

    if (signUpError) {
      setMensaje({ tipo: 'error', texto: 'Error al crear la cuenta: ' + signUpError.message });
      setEnviando(false);
      return;
    }

    const userId = signUpData?.user?.id;
    if (!userId) {
      setMensaje({ tipo: 'error', texto: 'No se pudo obtener el ID del nuevo usuario.' });
      setEnviando(false);
      return;
    }

    // 2️⃣ Insertar en tabla usuarios con el rol asignado
    const { error: insertError } = await supabase
      .from('usuarios')
      .upsert([{ id: userId, nombre, correo, rol, activo: true }]);

    if (insertError) {
      setMensaje({ tipo: 'error', texto: 'Usuario creado en Auth pero no en la tabla: ' + insertError.message });
      setEnviando(false);
      return;
    }

    setMensaje({ tipo: 'exito', texto: `✅ Usuario ${nombre} creado correctamente como ${etiquetasRol[rol]}.` });
    setFormData({ nombre: '', correo: '', password: '', rol: 'cajero' });
    setMostrarFormulario(false);
    cargarUsuarios();
    setEnviando(false);
  };

  const cambiarRol = async (usuarioId, nuevoRol) => {
    if (usuarioId === usuarioActual?.id) {
      alert('No puedes cambiar tu propio rol.');
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ rol: nuevoRol })
      .eq('id', usuarioId);

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al cambiar rol: ' + error.message });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Rol actualizado correctamente.' });
      cargarUsuarios();
    }
  };

  const toggleActivo = async (usuarioId, estadoActual) => {
    if (usuarioId === usuarioActual?.id) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }

    const nuevoEstado = !estadoActual;
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', usuarioId);

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar estado: ' + error.message });
    } else {
      setMensaje({
        tipo: 'exito',
        texto: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
      });
      cargarUsuarios();
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <LayoutBase>
      <div className="gu-container">
        {/* Cabecera */}
        <div className="gu-header">
          <div>
            <h1 className="gu-titulo">⚙️ Gestión de Usuarios</h1>
            <p className="gu-subtitulo">
              Crea, edita roles y administra el acceso del personal al sistema.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMostrarFormulario(!mostrarFormulario);
              setMensaje({ tipo: '', texto: '' });
            }}
          >
            {mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={mensaje.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}>
            {mensaje.texto}
          </div>
        )}

        {/* Formulario de creación */}
        {mostrarFormulario && (
          <div className="gu-form-card card">
            <h2 className="gu-form-titulo">Crear Nuevo Usuario</h2>
            <form className="gu-form" onSubmit={crearUsuario}>
              <div className="gu-form-grid">
                <div className="gu-campo">
                  <label>Nombre completo</label>
                  <input
                    type="text"
                    name="nombre"
                    className="input-base"
                    placeholder="Ej: María García"
                    value={formData.nombre}
                    onChange={manejarCambio}
                    required
                  />
                </div>
                <div className="gu-campo">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    className="input-base"
                    placeholder="usuario@supermercado.com"
                    value={formData.correo}
                    onChange={manejarCambio}
                    required
                  />
                </div>
                <div className="gu-campo">
                  <label>Contraseña temporal</label>
                  <input
                    type="password"
                    name="password"
                    className="input-base"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={manejarCambio}
                    required
                    minLength={6}
                  />
                </div>
                <div className="gu-campo">
                  <label>Rol en el sistema</label>
                  <select
                    name="rol"
                    className="input-base"
                    value={formData.rol}
                    onChange={manejarCambio}
                    required
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{etiquetasRol[r]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gu-roles-info">
                <p><strong>Cajero:</strong> Caja, clientes, facturación</p>
                <p><strong>Supervisor:</strong> + Historial de ventas y anulaciones</p>
                <p><strong>Administrador:</strong> + Inventario, proveedores, pedidos y usuarios</p>
              </div>

              <div className="gu-form-acciones">
                <button type="submit" className="btn-primary" disabled={enviando}>
                  {enviando ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>
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
                  {usuarios.map((u) => (
                    <tr key={u.id} className={!u.activo ? 'gu-fila-inactiva' : ''}>
                      <td>
                        <div className="gu-usuario-celda">
                          <div className="gu-avatar">
                            {(u.nombre || u.correo || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="gu-nombre">{u.nombre || '—'}</span>
                          {u.id === usuarioActual?.id && (
                            <span className="gu-yo">(tú)</span>
                          )}
                        </div>
                      </td>
                      <td className="gu-correo">{u.correo}</td>
                      <td>
                        {u.id === usuarioActual?.id ? (
                          <span className={`badge-rol badge-rol-${u.rol}`}>
                            {etiquetasRol[u.rol] || u.rol}
                          </span>
                        ) : (
                          <select
                            className="gu-select-rol"
                            value={u.rol}
                            onChange={(e) => cambiarRol(u.id, e.target.value)}
                          >
                            {ROLES.map((r) => (
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
                            onClick={() => toggleActivo(u.id, u.activo)}
                          >
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
