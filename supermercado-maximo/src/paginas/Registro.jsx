import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PaginaRegistro() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [rol, setRol] = useState('cajero');
  const [mensaje, setMensaje] = useState('');
  const navegar = useNavigate();

  const registrarUsuario = (e) => {
    e.preventDefault();

    const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios')) || [];

    const yaExiste = usuariosGuardados.some((usuario) => usuario.correo === correo);

    if (yaExiste) {
      setMensaje('❌ Ya existe un usuario con este correo.');
      return;
    }

    const nuevoUsuario = {
      id: Date.now(),
      nombre,
      correo,
      clave,
      rol,
    };

    usuariosGuardados.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuariosGuardados));

    setMensaje('✅ Usuario registrado con éxito.');
    setNombre('');
    setCorreo('');
    setClave('');
    setRol('cajero');

    setTimeout(() => navegar('/login'), 2000);
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Registrar Usuario</h2>
      <form onSubmit={registrarUsuario}>
        <div>
          <label>Nombre completo</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
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
        <div>
          <label>Rol</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="cajero">Cajero</option>
            <option value="administrador">Administrador</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
        {mensaje && <p>{mensaje}</p>}
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default PaginaRegistro;
