import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import { supabase } from '../supabase';
import '../estilos/login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(UsuarioContexto);
  const [formData, setFormData] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { correo, password } = formData;

    // 1️⃣ Autenticar con Supabase Auth
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    if (loginError) {
      setError('Credenciales inválidas o usuario no registrado.');
      setCargando(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setError('No se pudo obtener el usuario.');
      setCargando(false);
      return;
    }

    // 2️⃣ Obtener datos del usuario desde la tabla personalizada (incluye rol)
    const { data: usuarioData, error: consultaError } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, rol, activo')
      .eq('id', user.id)
      .single();

    if (consultaError || !usuarioData) {
      setError('No se encontró el perfil de usuario. Contacte al administrador.');
      await supabase.auth.signOut();
      setCargando(false);
      return;
    }

    // 3️⃣ Verificar que el usuario esté activo
    if (usuarioData.activo === false) {
      setError('Tu cuenta está desactivada. Contacta al administrador.');
      await supabase.auth.signOut();
      setCargando(false);
      return;
    }

    // 4️⃣ Guardar en contexto con el rol real
    login({
      id: usuarioData.id,
      nombre: usuarioData.nombre || correo,
      correo: usuarioData.correo || correo,
      rol: usuarioData.rol || 'cajero',
    });

    navigate('/');
    setCargando(false);
  };

  return (
    <div className="login-page">
      <div className="login-panel-izq">
        <div className="login-marca">
          <div className="login-logo-icono">🏪</div>
          <h1 className="login-marca-nombre">Supermercado<br /><span>Máximo</span></h1>
          <p className="login-marca-slogan">Sistema de Gestión Comercial</p>
        </div>
        <div className="login-decoracion">
          <div className="login-circulo login-circulo-1" />
          <div className="login-circulo login-circulo-2" />
          <div className="login-circulo login-circulo-3" />
        </div>
      </div>

      <div className="login-panel-der">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-titulo">Bienvenido</h2>
            <p className="login-subtitulo">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form className="login-form" onSubmit={manejarLogin}>
            <div className="login-campo">
              <label className="login-label">Correo electrónico</label>
              <input
                type="email"
                name="correo"
                placeholder="usuario@supermercado.com"
                className="login-input"
                value={formData.correo}
                onChange={manejarCambio}
                required
                autoComplete="email"
              />
            </div>

            <div className="login-campo">
              <label className="login-label">Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="login-input"
                value={formData.password}
                onChange={manejarCambio}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alerta-error">{error}</div>
            )}

            <button type="submit" className="login-boton" disabled={cargando}>
              {cargando ? (
                <span className="login-cargando">Verificando...</span>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>

          <p className="login-ayuda">
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;