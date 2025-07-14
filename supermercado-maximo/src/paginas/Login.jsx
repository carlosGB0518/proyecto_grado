import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PaginaLogin() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navegar = useNavigate();

  const iniciarSesion = (e) => {
    e.preventDefault();

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuarioEncontrado = usuarios.find(
      (u) => u.correo === correo && u.clave === clave
    );

    if (!usuarioEncontrado) {
      setMensaje('❌ Usuario o contraseña incorrectos.');
      return;
    }

    localStorage.setItem('usuarioActivo', JSON.stringify(usuarioEncontrado));
    setMensaje('✅ Bienvenido ' + usuarioEncontrado.nombre);
    setTimeout(() => navegar('/'), 1500);
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={iniciarSesion}>
        <div>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </div>
        {mensaje && <p>{mensaje}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default PaginaLogin;
