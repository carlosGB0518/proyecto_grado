import { createContext, useEffect, useState } from 'react';


export const UsuarioContexto = createContext();

export function ProveedorUsuario({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      setUsuario(data.user);
    };

    obtenerUsuario();

    supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
    });
  }, []);

  return (
    <UsuarioContexto.Provider value={{ usuario, setUsuario }}>
      {children}
    </UsuarioContexto.Provider>
  );
}
