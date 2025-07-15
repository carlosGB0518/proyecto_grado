import { useNavigate } from 'react-router-dom';
import '../estilos/registro.css';

const Registro = () => {
  const navigate = useNavigate();

  const manejarRegistro = (e) => {
    e.preventDefault();
    // Lógica de registro futura
    navigate('/login');
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2 className="registro-title">Crear Cuenta</h2>
        <form className="registro-form" onSubmit={manejarRegistro}>
          <input type="text" placeholder="Nombre completo" className="registro-input" required />
          <input type="text" placeholder="Usuario" className="registro-input" required />
          <input type="password" placeholder="Contraseña" className="registro-input" required />
          <input type="password" placeholder="Confirmar contraseña" className="registro-input" required />
          <button type="submit" className="registro-button">Registrarse</button>
        </form>
        <div className="registro-link">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </div>
      </div>
    </div>
  );
};

export default Registro;
