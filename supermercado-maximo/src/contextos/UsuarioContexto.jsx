import { createContext, useEffect, useState } from 'react';

export const UsuarioContexto = createContext();

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const login = (datosUsuario) => {
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  };

  const logout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <UsuarioContexto.Provider value={{ usuario, setUsuario, login, logout }}>
      {children}
    </UsuarioContexto.Provider>
  );
}
