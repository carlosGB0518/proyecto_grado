import { Navigate } from 'react-router-dom';

function RutaPrivada({ children }) {
  const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));

  if (!usuarioActivo) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RutaPrivada;
