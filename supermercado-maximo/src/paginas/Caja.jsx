import { useContext, useState } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/caja.css';

const Caja = () => {
  const { productos } = useContext(InventarioContexto);
  const [codigo, setCodigo] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 🆕 Estado para método de pago

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

  const guardarVenta = async () => {
    const venta = {
      productos: carrito,
      total,
      fecha: new Date().toISOString(),
      metodoPago, // 🆕 Incluye el método de pago
      usuario: "anónimo", // Aquí puedes usar usuario?.email si usas contexto de usuario
    };

    console.log("Venta realizada:", venta);

    // Luego se conectará a backend/Supabase
    // await supabase.from('ventas').insert([venta]);
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
          <label>Método de pago:</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            style={{ marginBottom: '10px' }}
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
          </select>
          <br />
          <strong>Total: ${total.toLocaleString()}</strong>
          <br />
          <button
            onClick={() => {
              guardarVenta();
              setCarrito([]);
              setCodigo('');
            }}
            disabled={carrito.length === 0}
          >
            Finalizar venta
          </button>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Caja;
