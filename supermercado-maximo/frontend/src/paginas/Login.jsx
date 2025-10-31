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

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarLogin = async (e) => {
  e.preventDefault();
  setError('');

  const { correo, password } = formData;

  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: correo,
    password
  });

  if (loginError) {
    setError('Credenciales inválidas o usuario no registrado.');
    return;
  }

  const user = data?.user;

  if (!user) {
    setError('No se pudo obtener el usuario.');
    return;
  }

  // ✅ Verificar si el usuario ya existe en la tabla personalizada
  const { data: usuarioExistente, error: consultaError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  if (consultaError && consultaError.code !== 'PGRST116') {
    // PGRST116 = no encontrado, lo manejamos abajo
    console.error('Error al consultar la tabla usuarios:', consultaError.message);
  }

  if (!usuarioExistente) {
    // ✅ Insertar si no existe
    const { error: insercionError } = await supabase
      .from('usuarios')
      .insert([
        {
          id: user.id,
          correo: user.email,
          nombre: user.user_metadata?.nombre_completo || '',
          rol: 'cliente'
        }
      ]);

    if (insercionError) {
      console.error('Error al insertar usuario:', insercionError.message);
      setError('Inicio de sesión exitoso, pero no se guardó en la base de datos.');
    }
  }

  // ✅ Guardar en contexto y redirigir
  login({ nombre: user.email, rol: 'cliente' });
  navigate('/');
};


  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>
        <form className="login-form" onSubmit={manejarLogin}>
          <input
            type="email"
            name="correo"
            placeholder="Correo electrónico"
            className="login-input"
            value={formData.correo}
            onChange={manejarCambio}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="login-input"
            value={formData.password}
            onChange={manejarCambio}
            required
          />
          <button type="submit" className="login-button">Ingresar</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="login-link">
          ¿No tienes cuenta? <a href="/registro">Regístrate</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
