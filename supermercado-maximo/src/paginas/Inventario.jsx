import { useContext, useState } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/inventario.css';

const Inventario = () => {
  const {
    productos,
    agregarProducto,
    editarProducto,
    eliminarProducto,
  } = useContext(InventarioContexto);

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

  const manejarCambio = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const manejarAgregar = (e) => {
    e.preventDefault();

    if (
      !nuevoProducto.codigo ||
      !nuevoProducto.nombre ||
      !nuevoProducto.precio ||
      nuevoProducto.stockActual === '' ||
      nuevoProducto.stockMinimo === ''
    )
      return;

    const yaExiste = productos.some((p) => p.codigo === nuevoProducto.codigo);
    if (yaExiste) {
      alert('El código de producto ya existe');
      return;
    }

    agregarProducto({
      ...nuevoProducto,
      precio: parseInt(nuevoProducto.precio),
      stockActual: parseInt(nuevoProducto.stockActual),
      stockMinimo: parseInt(nuevoProducto.stockMinimo),
    });

    setNuevoProducto({
      codigo: '',
      nombre: '',
      precio: '',
      stockActual: '',
      stockMinimo: '',
    });
  };

  const manejarEditar = (producto) => {
    setModoEdicion(producto.id);
    setNuevoProducto(producto);
  };

  const guardarEdicion = (e) => {
    e.preventDefault();

    editarProducto(modoEdicion, {
      ...nuevoProducto,
      precio: parseInt(nuevoProducto.precio),
      stockActual: parseInt(nuevoProducto.stockActual),
      stockMinimo: parseInt(nuevoProducto.stockMinimo),
    });

    setModoEdicion(null);
    setNuevoProducto({
      codigo: '',
      nombre: '',
      precio: '',
      stockActual: '',
      stockMinimo: '',
    });
  };

  const registrarEntrada = () => {
    if (!codigoMovimiento || !cantidadMovimiento) return;

    const producto = productos.find((p) => p.codigo === codigoMovimiento);
    if (producto) {
      editarProducto(producto.id, {
        ...producto,
        stockActual: producto.stockActual + parseInt(cantidadMovimiento),
      });
      setCodigoMovimiento('');
      setCantidadMovimiento('');
    }
  };

  const registrarSalida = () => {
    if (!codigoMovimiento || !cantidadMovimiento) return;

    const producto = productos.find((p) => p.codigo === codigoMovimiento);
    if (producto) {
      const cantidadSalida = parseInt(cantidadMovimiento);
      if (cantidadSalida > producto.stockActual) {
        alert('No hay suficiente stock para esta salida');
        return;
      }

      editarProducto(producto.id, {
        ...producto,
        stockActual: producto.stockActual - cantidadSalida,
      });
      setCodigoMovimiento('');
      setCantidadMovimiento('');
    }
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
            disabled={modoEdicion !== null}
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
          <input
            type="number"
            name="stockActual"
            placeholder="Stock actual"
            value={nuevoProducto.stockActual}
            onChange={manejarCambio}
            required
          />
          <input
            type="number"
            name="stockMinimo"
            placeholder="Stock mínimo"
            value={nuevoProducto.stockMinimo}
            onChange={manejarCambio}
            required
          />
          <button type="submit">
            {modoEdicion ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </form>

        <div className="movimientos-stock">
          <h3>Registrar movimiento de stock</h3>
          <input
            type="text"
            placeholder="Código"
            value={codigoMovimiento}
            onChange={(e) => setCodigoMovimiento(e.target.value)}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={cantidadMovimiento}
            onChange={(e) => setCantidadMovimiento(e.target.value)}
          />
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
              <tr
                key={p.id}
                className={p.stockActual < p.stockMinimo ? 'stock-bajo' : ''}
              >
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
