import { createContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export const UsuarioContexto = createContext();

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    // Restaurar sesión desde localStorage al iniciar
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargandoSesion(false);
  }, []);

  /**
   * login: recibe el objeto de usuario con { nombre, correo, rol, id }
   * y lo persiste en localStorage y contexto.
   */
  const login = (datosUsuario) => {
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  /**
   * tienePermiso: verifica si el usuario actual tiene alguno de los roles indicados.
   * Uso: tienePermiso(['administrador', 'supervisor'])
   */
  const tienePermiso = (rolesPermitidos = []) => {
    if (!usuario) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  return (
    <UsuarioContexto.Provider value={{ usuario, setUsuario, login, logout, tienePermiso, cargandoSesion }}>
      {children}
    </UsuarioContexto.Provider>
  );
}
