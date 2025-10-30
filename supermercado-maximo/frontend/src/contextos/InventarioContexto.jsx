import { createContext, useEffect, useState } from 'react';
import { supabase } from '../supabase'; // 👈 asegúrate de que la ruta sea correcta

export const InventarioContexto = createContext();

export const InventarioProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 🔹 Cargar productos desde Supabase al inicio
  useEffect(() => {
    const cargarProductos = async () => {
      const { data, error } = await supabase.from('productos').select('*');
      if (error) {
        console.error('Error al cargar productos desde Supabase:', error.message);
      } else {
        setProductos(data);
      }
      setCargando(false);
    };

    cargarProductos();

    // 🔹 Suscribirse a cambios en tiempo real en la tabla 'productos'
    const canal = supabase
      .channel('realtime:productos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        (payload) => {
          console.log('Cambio detectado en productos:', payload);
          cargarProductos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // 🔹 Funciones CRUD (opcional, puedes usarlas luego si quieres manejar cambios desde React)
  const agregarProducto = async (producto) => {
    const { error } = await supabase.from('productos').insert([producto]);
    if (error) console.error('Error agregando producto:', error.message);
  };

  const editarProducto = async (id, datosActualizados) => {
    const { error } = await supabase
      .from('productos')
      .update(datosActualizados)
      .eq('id', id);
    if (error) console.error('Error actualizando producto:', error.message);
  };

  const eliminarProducto = async (id) => {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) console.error('Error eliminando producto:', error.message);
  };

  return (
    <InventarioContexto.Provider
      value={{
        productos,
        cargando,
        agregarProducto,
        editarProducto,
        eliminarProducto,
      }}
    >
      {children}
    </InventarioContexto.Provider>
  );
};

