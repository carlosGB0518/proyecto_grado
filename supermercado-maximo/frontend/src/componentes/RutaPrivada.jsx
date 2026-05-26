import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UsuarioContexto } from '../contextos/UsuarioContexto';

/**
 * RutaPrivada
 * @param {string[]} roles - Roles permitidos para acceder. Si está vacío, cualquier usuario autenticado puede entrar.
 */
const RutaPrivada = ({ children, roles = [] }) => {
  const { usuario, cargandoSesion } = useContext(UsuarioContexto);

  if (cargandoSesion) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'DM Sans, sans-serif',
        color: '#2E7D32', fontSize: '1rem'
      }}>
        Cargando...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles y el usuario no tiene ninguno de ellos
  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return (
      <div className="sin-permiso">
        <h2>Acceso Restringido</h2>
        <p>No tienes permisos para acceder a este módulo.</p>
        <p>Tu rol actual es: <strong>{usuario.rol}</strong></p>
      </div>
    );
  }

  return children;
};

export default RutaPrivada;
