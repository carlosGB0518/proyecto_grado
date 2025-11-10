import { useContext, useState, useEffect } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import api from '../services/api';
import { supabase } from '../supabase';
import '../estilos/caja.css';

const Caja = () => {
  const { productos } = useContext(InventarioContexto);
  const [codigo, setCodigo] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [mensaje, setMensaje] = useState('');
  useEffect(() => {
  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true); // ✅ solo productos activos

    if (error) {
      alert('Error al cargar productos: ' + error.message);
    } else {
      setProductos(data);
    }
  };

  cargarProductos();
}, []);
  // 🛒 Agregar producto al carrito
  const agregarAlCarrito = (producto) => {

    if (!producto.activo) {
      alert(`❌ El producto "${producto.nombre}" ha sido eliminado del inventario y no puede venderse.`);
      return;
    }

    // Validar que haya stock disponible
    if (!producto.stockActual || producto.stockActual <= 0) {
      alert(`❌ ${producto.nombre} no tiene stock disponible`);
      return;
    }

    const existe = carrito.find(p => p.id === producto.id);
    
    if (existe) {
      // Verificar que no se exceda el stock disponible
      if (existe.cantidad >= producto.stockActual) {
        alert(`⚠️ Stock máximo alcanzado para ${producto.nombre} (${producto.stockActual} unidades)`);
        return;
      }
      
      const actualizado = carrito.map(p =>
        p.id === producto.id
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      );
      setCarrito(actualizado);
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };



          // 🔍 Buscar producto por código
          const buscarProducto = () => {
            const productoEncontrado = productos.find(p => p.codigo === codigo.trim());

            if (!productoEncontrado) {
              alert('⚠️ Producto no encontrado');
            } else if (!productoEncontrado.activo) {
              alert(`❌ El producto "${productoEncontrado.nombre}" ha sido eliminado del inventario y no puede venderse.`);
            } else {
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

  // 🗑️ Eliminar del carrito
  const eliminarProducto = (id) => {
    const nuevoCarrito = carrito.filter(item => item.id !== id);
    setCarrito(nuevoCarrito);
  };

  // 🔢 Cambiar cantidad de un producto
  const cambiarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    
    const actualizado = carrito.map(p =>
      p.id === id
        ? { ...p, cantidad: nuevaCantidad }
        : p
    );
    setCarrito(actualizado);
  };

  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  // 💾 Guardar venta, actualizar stock y emitir factura
  const guardarVenta = async () => {
    if (carrito.length === 0) {
      alert('⚠️ No hay productos en el carrito');
      return;
    }

    try {
      // Crear objeto de venta
      const venta = {
        total,
        metodo_pago: metodoPago,
        cajero: 'anónimo',
        fecha: new Date().toISOString(),
      };

      // 1️⃣ Insertar venta principal
      const { data: ventaInsertada, error: ventaError } = await supabase
        .from('ventas')
        .insert([venta])
        .select()
        .single();

      if (ventaError) throw new Error('Error al guardar la venta: ' + ventaError.message);

      // 2️⃣ Insertar detalles de la venta
      const detalles = carrito.map(item => ({
        venta_id: ventaInsertada.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }));

      const { error: detalleError } = await supabase
        .from('ventas_detalle')
        .insert(detalles);

      if (detalleError) throw new Error('Error guardando detalles: ' + detalleError.message);

      // 3️⃣ Actualizar stock
      for (const item of carrito) {
        const nuevoStock = item.stockActual - item.cantidad;
        const { error: updateError } = await supabase
          .from('productos')
          .update({ stockActual: nuevoStock })
          .eq('id', item.id);
        if (updateError) console.warn(`⚠️ Error actualizando stock de ${item.nombre}:`, updateError);
      }

      // 4️⃣ Emitir factura automáticamente
      const facturaPayload = {
        cliente: {
          tipoIdentificacionId: 3, // CC
          numeroIdentificacion: "123456789",
          nombre: "Cliente Genérico",
          telefono: "3001234567",
          direccion: "Calle de prueba",
          email: "cliente@supermercado.com",
          municipioId: 1
        },
        items: carrito.map((item, index) => ({
          codigo: item.codigo,
          descripcion: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          descuento: 0,
          impuesto: 19
        })),
        totales: {
          descuento: 0,
          impuestos: 0,
          total: total
        },
        data: {
          formaDePagoId: 1, // Contado
          metodoPagoId: metodoPago === "tarjeta" ? 2 : 10, // efectivo = 10, tarjeta = 2
          notas: "Gracias por su compra"
        },
        venta_id: ventaInsertada.id
      };

      const facturaResponse = await fetch(`${api}/api/facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facturaPayload),
      });

        const text = await facturaResponse.text();
        let facturaData = null;

        try {
          facturaData = text ? JSON.parse(text) : null;
        } catch (err) {
          console.error('❌ Error interpretando JSON de factura:', err.message);
          throw new Error('Respuesta inválida del servidor de facturación');
        }


      if (!facturaResponse.ok) {
        throw new Error(facturaData.error || 'Error al emitir factura');
      }

      console.log('✅ Factura emitida:', facturaData);
      setMensaje(`✅ Venta completada y factura emitida (${facturaData.uuid || 'sin UUID'})`);

      // 5️⃣ Limpiar carrito
      setCarrito([]);
      setCodigo('');

    } catch (error) {
      console.error('❌ Error al procesar venta:', error);
      alert(`❌ Error al procesar venta: ${error.message }`)
    }
  };

  return (
    <LayoutBase>
      <div className="caja-container">
        <h2 className="caja-titulo">Punto de Venta</h2>

        <div className="caja-layout">
          {/* COLUMNA IZQUIERDA: Productos */}
          <div className="caja-productos-seccion">
            <div className="caja-formulario">
              <input
                type="text"
                autoFocus
                placeholder="Código de producto o buscar..."
                className="caja-input"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={manejarEnter}
              />
              <button className="caja-boton" onClick={buscarProducto}>
                🔍 Buscar
              </button>
            </div>

            <h3 className="caja-subtitulo">Productos disponibles</h3>
            <div className="caja-productos-grid">
              {productos.map((producto) => (
                <div 
                  className="producto-card" 
                  key={producto.id}
                  onClick={() => agregarAlCarrito(producto)}
                >
                  <div className="producto-info">
                    <p className="producto-nombre">{producto.nombre}</p>
                    <p className="producto-precio">${producto.precio.toLocaleString()}</p>
                    <p className="producto-stock">Stock: {producto.stockActual || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMNA DERECHA: Carrito (Fijo) */}
          <div className="caja-carrito-seccion">
            <h3 className="caja-subtitulo">🛒 Carrito de compra</h3>
            
            <div className="carrito-items">
              {carrito.length === 0 ? (
                <p className="carrito-vacio">No hay productos en el carrito</p>
              ) : (
                <table className="caja-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map(item => (
                      <tr key={item.id}>
                        <td className="producto-nombre-carrito">{item.nombre}</td>
                        <td>
                          <div className="cantidad-controles">
                            <button 
                              className="btn-cantidad"
                              onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                            >
                              -
                            </button>
                            <span className="cantidad-display">{item.cantidad}</span>
                            <button 
                              className="btn-cantidad"
                              onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>${item.precio.toLocaleString()}</td>
                        <td className="total-item">${(item.precio * item.cantidad).toLocaleString()}</td>
                        <td>
                          <button
                            className="caja-eliminar"
                            onClick={() => eliminarProducto(item.id)}
                            title="Eliminar producto"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="caja-total-seccion">
              <div className="metodo-pago-grupo">
                <label>Método de pago:</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="metodo-pago-select"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="nequi">📱 Nequi</option>
                  <option value="daviplata">📱 Daviplata</option>
                </select>
              </div>

              <div className="total-display">
                <span>TOTAL:</span>
                <span className="total-monto">${total.toLocaleString()}</span>
              </div>

              <button 
                className="caja-finalizar" 
                onClick={guardarVenta} 
                disabled={carrito.length === 0}
              >
                💰 Finalizar venta
              </button>

              {mensaje && <p className="mensaje-exito">{mensaje}</p>}
            </div>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Caja;
