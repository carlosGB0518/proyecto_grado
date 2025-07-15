import { useContext, useState } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/inventario.css';

const Inventario = () => {
  const { productos, agregarProducto, editarProducto, eliminarProducto } = useContext(InventarioContexto);

  const [nuevoProducto, setNuevoProducto] = useState({ codigo: '', nombre: '', precio: '' });
  const [modoEdicion, setModoEdicion] = useState(null);

  const manejarCambio = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const manejarAgregar = (e) => {
    e.preventDefault();
    if (!nuevoProducto.codigo || !nuevoProducto.nombre || !nuevoProducto.precio) return;
    agregarProducto({ ...nuevoProducto, precio: parseInt(nuevoProducto.precio) });
    setNuevoProducto({ codigo: '', nombre: '', precio: '' });
  };

  const manejarEditar = (producto) => {
    setModoEdicion(producto.id);
    setNuevoProducto(producto);
  };

  const guardarEdicion = () => {
    editarProducto(modoEdicion, { ...nuevoProducto, precio: parseInt(nuevoProducto.precio) });
    setModoEdicion(null);
    setNuevoProducto({ codigo: '', nombre: '', precio: '' });
  };

  return (
    <LayoutBase>
      <div className="inventario-container">
        <h2>Inventario</h2>

        <form onSubmit={modoEdicion ? guardarEdicion : manejarAgregar} className="inventario-form">
          <input
            type="text"
            name="codigo"
            placeholder="Código"
            value={nuevoProducto.codigo}
            onChange={manejarCambio}
            required
          />
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={nuevoProducto.nombre}
            onChange={manejarCambio}
            required
          />
          <input
            type="number"
            name="precio"
            placeholder="Precio"
            value={nuevoProducto.precio}
            onChange={manejarCambio}
            required
          />
          <button type="submit">
            {modoEdicion ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </form>

        <table className="inventario-tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>${p.precio.toLocaleString()}</td>
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
