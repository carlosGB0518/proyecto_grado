import { createContext, useState } from 'react';

// Crea el contexto
export const InventarioContexto = createContext();

// Proveedor del contexto
export function InventarioProvider({ children }) {
  const [productos, setProductos] = useState([
    { id: 1, codigo: '123', nombre: 'Arroz Diana 1kg', precio: 5000 },
    { id: 2, codigo: '456', nombre: 'Aceite Premier 900ml', precio: 9000 },
    { id: 3, codigo: '789', nombre: 'Pan Tajado Bimbo', precio: 4800 }
  ]);

  const agregarProducto = (producto) => {
    const nuevo = { ...producto, id: Date.now() };
    setProductos(prev => [...prev, nuevo]);
  };

  const editarProducto = (id, datosActualizados) => {
    setProductos(prev =>
      prev.map(p => (p.id === id ? { ...p, ...datosActualizados } : p))
    );
  };

  const eliminarProducto = (id) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <InventarioContexto.Provider value={{ productos, agregarProducto, editarProducto, eliminarProducto }}>
      {children}
    </InventarioContexto.Provider>
  );
}
