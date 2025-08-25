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

    // Puedes traer más datos del usuario si los tienes en una tabla aparte
    login({ nombre: data.user.email, rol: 'usuario' });
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
