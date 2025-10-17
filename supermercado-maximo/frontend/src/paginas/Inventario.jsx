import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/inventario.css';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: '',
    nombre: '',
    precio: '',
    stockActual: '',
    stockMinimo: '',
  });
  const [modoEdicion, setModoEdicion] = useState(null);
  const [codigoMovimiento, setCodigoMovimiento] = useState('');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');

  // Cargar productos y escuchar cambios en tiempo real
  useEffect(() => {
    cargarProductos();

    // 🔔 Escuchar cambios en tiempo real en la tabla 'productos'
    const canal = supabase
      .channel('realtime:productos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        () => {
          cargarProductos(); // Refresca la lista cuando hay cambios
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) {
      alert('Error al cargar productos: ' + error.message);
    } else {
      setProductos(data);
    }
  };

  const manejarCambio = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const manejarAgregar = async (e) => {
    e.preventDefault();
    const { codigo, nombre, precio, stockActual, stockMinimo } = nuevoProducto;

    if (!codigo || !nombre || !precio || stockActual === '' || stockMinimo === '') return;

    const { error } = await supabase
      .from('productos')
      .insert([
        {
          codigo,
          nombre,
          precio: parseInt(precio),
          stockActual: parseInt(stockActual),
          stockMinimo: parseInt(stockMinimo),
        },
      ]);

    if (error) {
      alert('Error al agregar producto: ' + error.message);
    } else {
      await cargarProductos();
      setNuevoProducto({
        codigo: '',
        nombre: '',
        precio: '',
        stockActual: '',
        stockMinimo: '',
      });
    }
  };

  const manejarEditar = (producto) => {
    setModoEdicion(producto.id);
    setNuevoProducto(producto);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('productos')
      .update({
        nombre: nuevoProducto.nombre,
        precio: parseInt(nuevoProducto.precio),
        stockActual: parseInt(nuevoProducto.stockActual),
        stockMinimo: parseInt(nuevoProducto.stockMinimo),
      })
      .eq('id', modoEdicion);

    if (error) {
      alert('Error al editar: ' + error.message);
    } else {
      setModoEdicion(null);
      await cargarProductos();
      setNuevoProducto({
        codigo: '',
        nombre: '',
        precio: '',
        stockActual: '',
        stockMinimo: '',
      });
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;

    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      await cargarProductos();
    }
  };

  const registrarEntrada = async () => {
    const producto = productos.find((p) => p.codigo === codigoMovimiento);
    if (producto) {
      const nuevoStock = producto.stockActual + parseInt(cantidadMovimiento);
      const { error } = await supabase
        .from('productos')
        .update({ stockActual: nuevoStock })
        .eq('id', producto.id);
      if (!error) {
        await cargarProductos();
        setCodigoMovimiento('');
        setCantidadMovimiento('');
      }
    }
  };

  const registrarSalida = async () => {
    const producto = productos.find((p) => p.codigo === codigoMovimiento);
    if (producto) {
      const cantidadSalida = parseInt(cantidadMovimiento);
      if (cantidadSalida > producto.stockActual) {
        alert('Stock insuficiente');
        return;
      }

      const nuevoStock = producto.stockActual - cantidadSalida;
      const { error } = await supabase
        .from('productos')
        .update({ stockActual: nuevoStock })
        .eq('id', producto.id);
      if (!error) {
        await cargarProductos();
        setCodigoMovimiento('');
        setCantidadMovimiento('');
      }
    }
  };

  return (
    <LayoutBase>
      <div className="inventario-container">
        <h2>Inventario</h2>

        <form onSubmit={modoEdicion ? guardarEdicion : manejarAgregar} className="inventario-form">
          <input type="text" name="codigo" placeholder="Código" value={nuevoProducto.codigo} onChange={manejarCambio} required disabled={modoEdicion !== null} />
          <input type="text" name="nombre" placeholder="Nombre" value={nuevoProducto.nombre} onChange={manejarCambio} required />
          <input type="number" name="precio" placeholder="Precio" value={nuevoProducto.precio} onChange={manejarCambio} required />
          <input type="number" name="stockActual" placeholder="Stock actual" value={nuevoProducto.stockActual} onChange={manejarCambio} required />
          <input type="number" name="stockMinimo" placeholder="Stock mínimo" value={nuevoProducto.stockMinimo} onChange={manejarCambio} required />
          <button type="submit">{modoEdicion ? 'Guardar cambios' : 'Agregar producto'}</button>
        </form>

        <div className="movimientos-stock">
          <h3>Registrar movimiento de stock</h3>
          <input type="text" placeholder="Código" value={codigoMovimiento} onChange={(e) => setCodigoMovimiento(e.target.value)} />
          <input type="number" placeholder="Cantidad" value={cantidadMovimiento} onChange={(e) => setCantidadMovimiento(e.target.value)} />
          <button onClick={registrarEntrada}>Entrada</button>
          <button onClick={registrarSalida}>Salida</button>
        </div>

        <table className="inventario-tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className={p.stockActual < p.stockMinimo ? 'stock-bajo' : ''}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>${p.precio.toLocaleString()}</td>
                <td>{p.stockActual}</td>
                <td>{p.stockMinimo}</td>
                <td>
                  <button onClick={() => manejarEditar(p)}>✏️</button>
                  <button onClick={() => eliminarProducto(p.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LayoutBase>
  );
};

export default Inventario;
