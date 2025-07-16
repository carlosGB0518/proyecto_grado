import { createContext, useEffect, useState } from 'react';

export const InventarioContexto = createContext();

export const InventarioProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);

  // Cargar desde localStorage al inicio
  useEffect(() => {
    const datosGuardados = localStorage.getItem('inventario');
    if (datosGuardados) {
      setProductos(JSON.parse(datosGuardados));
    }
  }, []);

  // Guardar automáticamente en localStorage cuando cambia el estado
  useEffect(() => {
    localStorage.setItem('inventario', JSON.stringify(productos));
  }, [productos]);

  const agregarProducto = (producto) => {
    const nuevoProducto = {
      ...producto,
      id: Date.now(), // ID único usando timestamp
    };
    setProductos([...productos, nuevoProducto]);
  };

  const editarProducto = (id, datosActualizados) => {
    const productosActualizados = productos.map((p) =>
      p.id === id ? { ...p, ...datosActualizados } : p
    );
    setProductos(productosActualizados);
  };

  const eliminarProducto = (id) => {
    const filtrados = productos.filter((p) => p.id !== id);
    setProductos(filtrados);
  };

  return (
    <InventarioContexto.Provider
      value={{
        productos,
        agregarProducto,
        editarProducto,
        eliminarProducto,
      }}
    >
      {children}
    </InventarioContexto.Provider>
  );
};
