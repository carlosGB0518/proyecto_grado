import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import '../estilos/registro.css';

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmar: ''
  });
  const [error, setError] = useState('');

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');

    const { nombre, correo, password, confirmar } = formData;

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const { data, error: registroError } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: {
          nombre_completo: nombre
        }
      }
    });

    if (registroError) {
      setError('Error al registrar: ' + registroError.message);
      return;
    }

    // Registro exitoso, redirige al login
    navigate('/login');
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2 className="registro-title">Crear Cuenta</h2>
        <form className="registro-form" onSubmit={manejarRegistro}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            className="registro-input"
            value={formData.nombre}
            onChange={manejarCambio}
            required
          />
          <input
            type="email"
            name="correo"
            placeholder="Correo electrónico"
            className="registro-input"
            value={formData.correo}
            onChange={manejarCambio}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="registro-input"
            value={formData.password}
            onChange={manejarCambio}
            required
          />
          <input
            type="password"
            name="confirmar"
            placeholder="Confirmar contraseña"
            className="registro-input"
            value={formData.confirmar}
            onChange={manejarCambio}
            required
          />
          <button type="submit" className="registro-button">Registrarse</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="registro-link">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </div>
      </div>
    </div>
  );
};

export default Registro;
