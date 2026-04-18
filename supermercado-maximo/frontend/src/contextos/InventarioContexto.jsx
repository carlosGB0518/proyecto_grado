/**
 * InventarioContexto — Supermercado Máximo
 *
 * Mantiene los productos en tiempo real usando Supabase Realtime.
 * Cualquier cambio en la tabla 'productos' (desde Inventario, otra
 * pestaña o sesión) se refleja automáticamente en Caja y demás páginas
 * sin necesidad de recargar.
 */
import { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';

export const InventarioContexto = createContext();

export const InventarioProvider = ({ children }) => {
  const [productos, setProductos]         = useState([]);
  const [productosAlerta, setProductosAlerta] = useState([]); // stock bajo
  const [cargando, setCargando]           = useState(true);
  const [ultimaActualizacion, setUltima]  = useState(null);

  // ─── Carga principal ───────────────────────────────────────────────
  const cargarProductos = useCallback(async () => {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id, codigo, nombre, precio,
        stockactual, stockminimo,
        proveedor_id, activo,
        proveedor:proveedor_id(nombre)
      `)
      .eq('activo', true)
      .order('nombre');

    if (!error && data) {
      setProductos(data);
      // Alertas de stock bajo
      setProductosAlerta(data.filter(p => p.stockactual < p.stockminimo));
      setUltima(new Date());
    } else if (error) {
      console.error('InventarioContexto: error cargando productos:', error.message);
    }
    setCargando(false);
  }, []);

  // ─── Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    cargarProductos();

    const canal = supabase
      .channel('realtime:inventario:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        (payload) => {
          // Actualizamos sin hacer un fetch completo para eventos
          // simples, y hacemos fetch completo para inserts/deletes
          if (payload.eventType === 'UPDATE') {
            setProductos(prev => {
              const nuevo = payload.new;
              // Si el producto se desactivó, sacarlo de la lista
              if (!nuevo.activo) {
                const filtrado = prev.filter(p => p.id !== nuevo.id);
                setProductosAlerta(filtrado.filter(p => p.stockactual < p.stockminimo));
                return filtrado;
              }
              // Si ya existe, actualizar; si no existe, agregar
              const existe = prev.find(p => p.id === nuevo.id);
              const lista = existe
                ? prev.map(p => p.id === nuevo.id ? { ...p, ...nuevo } : p)
                : [...prev, nuevo];
              setProductosAlerta(lista.filter(p => p.stockactual < p.stockminimo));
              setUltima(new Date());
              return lista;
            });
          } else {
            // INSERT o DELETE → recarga completa para tener datos frescos
            cargarProductos();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [cargarProductos]);

  // ─── CRUD helpers (opcionales, para uso desde páginas) ─────────────
  const agregarProducto = async (producto) => {
    const { error } = await supabase.from('productos').insert([{ ...producto, activo: true }]);
    if (error) throw error;
    // El canal Realtime actualizará automáticamente
  };

  const editarProducto = async (id, datos) => {
    const { error } = await supabase.from('productos').update(datos).eq('id', id);
    if (error) throw error;
  };

  const eliminarProducto = async (id) => {
    // Eliminación lógica
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id);
    if (error) throw error;
  };

  return (
    <InventarioContexto.Provider value={{
      productos,
      productosAlerta,
      cargando,
      ultimaActualizacion,
      cargarProductos,
      agregarProducto,
      editarProducto,
      eliminarProducto,
    }}>
      {children}
    </InventarioContexto.Provider>
  );
};
