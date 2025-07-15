import { useContext, useState } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/caja.css';

const Caja = () => {
  const { productos } = useContext(InventarioContexto); // ← inventario real
  const [codigo, setCodigo] = useState('');
  const [carrito, setCarrito] = useState([]);

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
      const actualizado = carrito.map(p =>
        p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
      );
      setCarrito(actualizado);
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const buscarProducto = () => {
    const productoEncontrado = productos.find(p => p.codigo === codigo.trim());
    if (productoEncontrado) {
      agregarAlCarrito(productoEncontrado);
    }
    setCodigo('');
  };

  const manejarEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarProducto();
    }
  };

  const eliminarProducto = (id) => {
    const nuevoCarrito = carrito.filter(item => item.id !== id);
    setCarrito(nuevoCarrito);
  };

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  const finalizarVenta = () => {
    alert('Venta finalizada. Total: $' + total.toLocaleString());
    setCarrito([]);
  };

  return (
    <LayoutBase>
      <div className="caja-container">
        <h2 className="caja-titulo">Punto de Venta</h2>

        <div className="caja-formulario">
          <input
            type="text"
            autoFocus
            placeholder="Código de producto"
            className="caja-input"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={manejarEnter}
          />
          <button className="caja-boton" onClick={buscarProducto}>Agregar por código</button>
        </div>

        <h3 className="caja-subtitulo">Productos disponibles</h3>
        <div className="caja-productos">
          {productos.map((producto) => (
            <div className="producto-card" key={producto.id}>
              <p><strong>{producto.nombre}</strong></p>
              <p>${producto.precio.toLocaleString()}</p>
              <button onClick={() => agregarAlCarrito(producto)}>Agregar</button>
            </div>
          ))}
        </div>

        <h3 className="caja-subtitulo">Carrito</h3>
        <table className="caja-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map(item => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                <td>{item.cantidad}</td>
                <td>${item.precio.toLocaleString()}</td>
                <td>${(item.precio * item.cantidad).toLocaleString()}</td>
                <td>
                  <button className="caja-eliminar" onClick={() => eliminarProducto(item.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="caja-total">
          Total: ${total.toLocaleString()}
          <br />
          <button className="caja-finalizar" onClick={finalizarVenta}>Finalizar venta</button>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Caja;
