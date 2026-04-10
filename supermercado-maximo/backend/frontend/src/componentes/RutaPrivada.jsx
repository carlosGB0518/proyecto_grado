import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UsuarioContexto } from '../contextos/UsuarioContexto';

const RutaPrivada = ({ children }) => {
  const { usuario } = useContext(UsuarioContexto);
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    // Simular una verificación rápida (evita quedarse en "Cargando..." indefinidamente)
    setTimeout(() => {
      setVerificado(true);
    }, 100); // 100ms
  }, []);

  if (!verificado) {
    return <div>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RutaPrivada;
