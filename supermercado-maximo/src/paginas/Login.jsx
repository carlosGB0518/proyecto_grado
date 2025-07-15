import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import '../estilos/login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(UsuarioContexto);

  const manejarLogin = (e) => {
    e.preventDefault();

    const datosSimulados = {
      nombre: 'Carlos',
      rol: 'admin'
    };

    login(datosSimulados);
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>
        <form className="login-form" onSubmit={manejarLogin}>
          <input type="text" placeholder="Usuario" className="login-input" required />
          <input type="password" placeholder="Contraseña" className="login-input" required />
          <button type="submit" className="login-button">Ingresar</button>
        </form>
        <div className="login-link">
          ¿No tienes cuenta? <a href="/registro">Regístrate</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
