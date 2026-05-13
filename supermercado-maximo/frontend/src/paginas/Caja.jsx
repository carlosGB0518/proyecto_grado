/**
 * Caja.jsx — Supermercado Máximo
 * Punto de venta con tiempo real, cliente, descuento y puntos de fidelización.
 */
import { useContext, useState, useEffect, useRef } from 'react';
import { InventarioContexto } from '../contextos/InventarioContexto';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import api from '../services/api';
import { supabase } from '../supabase';
import '../estilos/caja.css';

const Caja = () => {
  const { productos, cargando: cargandoProductos } = useContext(InventarioContexto);
  const { usuario } = useContext(UsuarioContexto);

  const [codigo, setCodigo]         = useState('');
  const [carrito, setCarrito]       = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [mensaje, setMensaje]       = useState('');
  const [procesando, setProcesando] = useState(false);
  const [clientes, setClientes]     = useState([]);
  const [clienteId, setClienteId]   = useState('');
  const [descuento, setDescuento]   = useState(0);
  const [montoPagado, setMontoPagado] = useState(''); // Monto pagado en efectivo
  const [busquedaProd, setBusquedaProd] = useState(''); // filtro visual de productos
  const inputRef = useRef(null);

  // Cargar clientes con todos los campos necesarios para la factura
  useEffect(() => {
    supabase
      .from('clientes')
      .select('id, nombre, puntos, numero_identificacion, telefono, correo, direccion')
      .order('nombre')
      .then(({ data }) => setClientes(data || []));
  }, []);

  // Enfocar input de código al cargar
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // ── Productos filtrados visualmente ──────────────────────────────
  const productosFiltrados = busquedaProd
    ? productos.filter(p =>
        p.nombre?.toLowerCase().includes(busquedaProd.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busquedaProd.toLowerCase())
      )
    : productos;

  // ── Carrito ───────────────────────────────────────────────────────
  const agregarAlCarrito = (producto) => {
    if (!producto.activo) {
      setMensaje(`❌ "${producto.nombre}" no está disponible.`);
      setTimeout(() => setMensaje(''), 3000); return;
    }
    if (!producto.stockactual || producto.stockactual <= 0) {
      setMensaje(`❌ ${producto.nombre} sin stock disponible.`);
      setTimeout(() => setMensaje(''), 3000); return;
    }

    setCarrito(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stockactual) {
          setMensaje(`⚠️ Stock máximo: ${producto.stockactual} unidades`);
          setTimeout(() => setMensaje(''), 3000);
          return prev;
        }
        return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const buscarProducto = () => {
    const encontrado = productos.find(p => p.codigo === codigo.trim());
    if (!encontrado) {
      setMensaje('⚠️ Producto no encontrado con ese código.');
      setTimeout(() => setMensaje(''), 3000);
    } else {
      agregarAlCarrito(encontrado);
    }
    setCodigo('');
    if (inputRef.current) inputRef.current.focus();
  };

  const manejarEnter = e => { if (e.key === 'Enter') { e.preventDefault(); buscarProducto(); } };

  const eliminarProducto = id => setCarrito(prev => prev.filter(i => i.id !== id));

  const cambiarCantidad = (id, nueva) => {
    if (nueva < 1) return;
    const prod = productos.find(p => p.id === id);
    if (prod && nueva > prod.stockactual) {
      setMensaje(`⚠️ Stock máximo disponible: ${prod.stockactual}`);
      setTimeout(() => setMensaje(''), 3000); return;
    }
    setCarrito(prev => prev.map(p => p.id === id ? { ...p, cantidad: nueva } : p));
  };

  // ── Totales ───────────────────────────────────────────────────────
  const subtotal       = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const descuentoMonto = Math.round(subtotal * (descuento / 100));
  const total          = subtotal - descuentoMonto;

  // Puntos que ganará el cliente (1 punto por cada $1.000)
  const puntosAGanar = clienteId ? Math.floor(total / 1000) : 0;

  // Cálculo de cambio (solo si es efectivo)
  const montoPagadoNum = metodoPago === 'efectivo' ? parseFloat(montoPagado) || 0 : total;
  const cambio = montoPagadoNum - total;
  const tieneMontoSuficiente = metodoPago === 'efectivo' ? cambio >= 0 : true;

  // ── Guardar venta ─────────────────────────────────────────────────
  const guardarVenta = async () => {
    if (carrito.length === 0) { setMensaje('⚠️ El carrito está vacío.'); return; }
    if (metodoPago === 'efectivo' && !tieneMontoSuficiente) {
      setMensaje('⚠️ El monto pagado no es suficiente para completar la venta.');
      return;
    }
    if (procesando) return;
    setProcesando(true);
    setMensaje('⏳ Procesando venta...');

    try {
      // 1. Insertar venta
      const { data: ventaInsertada, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          total,
          metodo_pago: metodoPago,
          cajero:     usuario?.nombre || 'Cajero',
          usuario:    usuario?.nombre || 'Cajero',
          cliente_id: clienteId || null,
          fecha:      new Date().toISOString(),
          anulada:    false,
        }])
        .select()
        .maybeSingle();

      if (ventaError) throw new Error('Error al guardar venta: ' + ventaError.message);

      // 2. Insertar detalles
      const { error: detError } = await supabase
        .from('ventas_detalle')
        .insert(carrito.map(item => ({
          venta_id:        ventaInsertada.id,
          producto_id:     item.id,
          cantidad:        item.cantidad,
          precio_unitario: item.precio,
        })));
      if (detError) throw new Error('Error en detalles: ' + detError.message);

      // 3. Actualizar stock (Realtime lo propaga a todos)
      for (const item of carrito) {
        await supabase.from('productos')
          .update({ stockactual: item.stockactual - item.cantidad })
          .eq('id', item.id);
      }

      // 4. Puntos de fidelización
      if (clienteId && puntosAGanar > 0) {
        const clienteActual = clientes.find(c => String(c.id) === String(clienteId));
        const puntosActuales = clienteActual?.puntos || 0;
        await Promise.all([
          supabase.from('clientes').update({ puntos: puntosActuales + puntosAGanar }).eq('id', clienteId),
          supabase.from('puntos_historial').insert([{
            cliente_id: clienteId,
            venta_id:   ventaInsertada.id,
            puntos:     puntosAGanar,
            concepto:   `Compra #${ventaInsertada.id} — $${total.toLocaleString('es-CO')}`,
          }]),
        ]);
      }

      // 5. Factura electrónica
      const cli = clientes.find(c => String(c.id) === String(clienteId));
      const factRes = await fetch(`${api}/api/facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            tipoIdentificacionId:  3,
            numeroIdentificacion:  cli?.numero_identificacion || '222222222222',
            nombre:                cli?.nombre || 'Consumidor Final',
            telefono:              cli?.telefono || '3000000000',
            direccion:             cli?.direccion || 'Sin dirección',
            email:                 cli?.correo || 'consumidor@final.com',
            municipioId: 1,
          },
          items: carrito.map(item => ({
            codigo:         item.codigo,
            descripcion:    item.nombre,
            cantidad:       item.cantidad,
            precioUnitario: item.precio,
            descuento:      0,
            impuesto:       19,
          })),
          totales: { descuento: descuentoMonto, impuestos: 0, total },
          data: {
            formaDePagoId: 1,
            metodoPagoId:  metodoPago === 'tarjeta' ? 2 : 10,
            notas: 'Gracias por su compra — Supermercado Máximo',
          },
          venta_id: ventaInsertada.id,
        }),
      });

      const factData = await factRes.json().catch(() => null);
      const factOk   = factRes.ok;

      // Limpiar carrito
      setCarrito([]);
      setCodigo('');
      setClienteId('');
      setDescuento(0);
      setMontoPagado(''); // Limpiar monto pagado

      let msgFinal = `✅ Venta #${ventaInsertada.id} registrada.`;
      if (metodoPago === 'efectivo') msgFinal += ` Cambio: $${cambio.toLocaleString('es-CO')}.`;
      if (factOk) msgFinal += ' Factura electrónica emitida.';
      else        msgFinal += ' ⚠️ Factura pendiente (revisa Facturación).';
      if (puntosAGanar > 0) msgFinal += ` ⭐ +${puntosAGanar} puntos al cliente.`;

      setMensaje(msgFinal);
      if (inputRef.current) inputRef.current.focus();

    } catch (err) {
      setMensaje(`❌ ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <LayoutBase>
      <div className="caja-container">
        <h2 className="caja-titulo"> Punto de Venta</h2>

        <div className="caja-layout">
          {/* ── PRODUCTOS ── */}
          <div className="caja-productos-seccion">
            {/* Búsqueda por código (lector + manual) */}
            <div className="caja-formulario">
              <input
                ref={inputRef}
                type="text"
                placeholder="Escanea código de barras o escribe..."
                className="caja-input"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                onKeyDown={manejarEnter}
              />
              <button className="caja-boton" onClick={buscarProducto}>🔍</button>
            </div>

            {/* Filtro visual rápido */}
            <input
              type="text"
              placeholder="Filtrar productos por nombre..."
              className="caja-input"
              style={{ marginBottom: '0.75rem' }}
              value={busquedaProd}
              onChange={e => setBusquedaProd(e.target.value)}
            />

            <h3 className="caja-subtitulo">
              Productos {cargandoProductos ? '(cargando...)' : `(${productosFiltrados.length})`}
            </h3>

            <div className="caja-productos-grid">
              {productosFiltrados.map(producto => (
                <div
                  key={producto.id}
                  className={`producto-card ${producto.stockactual <= 0 ? 'producto-sin-stock' : ''}`}
                  onClick={() => agregarAlCarrito(producto)}
                >
                  <div className="producto-info">
                    <p className="producto-nombre">{producto.nombre}</p>
                    <p className="producto-precio">${producto.precio.toLocaleString('es-CO')}</p>
                    <p className="producto-stock"
                      style={{ color: producto.stockactual < producto.stockminimo ? 'var(--color-rojo)' : 'inherit' }}>
                      Stock: {producto.stockactual}
                      {producto.stockactual < producto.stockminimo ? ' ⚠️' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CARRITO ── */}
          <div className="caja-carrito-seccion">
            <h3 className="caja-subtitulo"> Carrito de compra</h3>

            {/* Cliente */}
            <div className="caja-cliente-selector">
              <label className="caja-label">Cliente (opcional)</label>
              <select className="metodo-pago-select" value={clienteId}
                onChange={e => setClienteId(e.target.value)}>
                <option value="">— Sin cliente / Consumidor final —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.numero_identificacion || 'Sin ID'} ({c.puntos || 0} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Items del carrito */}
            <div className="carrito-items">
              {carrito.length === 0 ? (
                <p className="carrito-vacio">Agrega productos al carrito</p>
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
                            <button className="btn-cantidad" onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}>−</button>
                            <span className="cantidad-display">{item.cantidad}</span>
                            <button className="btn-cantidad" onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}>+</button>
                          </div>
                        </td>
                        <td>${item.precio.toLocaleString('es-CO')}</td>
                        <td className="total-item">${(item.precio * item.cantidad).toLocaleString('es-CO')}</td>
                        <td>
                          <button className="caja-eliminar" onClick={() => eliminarProducto(item.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pago */}
            <div className="caja-total-seccion">
              <div className="metodo-pago-grupo">
                <label>Método de pago</label>
                <select className="metodo-pago-select" value={metodoPago}
                  onChange={e => {
                    setMetodoPago(e.target.value);
                    setMontoPagado(''); // Limpiar monto pagado al cambiar método
                  }}>
                  <option value="efectivo"> Efectivo</option>
                  <option value="tarjeta"> Tarjeta</option>
                  <option value="nequi"> Nequi</option>
                  <option value="daviplata"> Daviplata</option>
                </select>
              </div>

              <div className="metodo-pago-grupo">
                <label>Descuento (%)</label>
                <input type="number" min="0" max="100" step="1"
                  className="metodo-pago-select"
                  style={{ padding: '0.5rem 0.75rem' }}
                  value={descuento}
                  onChange={e => setDescuento(Math.min(100, Math.max(0, Number(e.target.value))))}
                />
              </div>

              {/* Campo de Monto Pagado (solo para efectivo) */}
              {metodoPago === 'efectivo' && (
                <div className="metodo-pago-grupo">
                  <label>Monto Pagado</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="metodo-pago-select"
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderColor: !tieneMontoSuficiente && montoPagado ? '#dc3545' : '#ccc',
                    }}
                    value={montoPagado}
                    onChange={e => setMontoPagado(e.target.value)}
                    placeholder="Ingresa monto recibido"
                  />
                  {montoPagado && !tieneMontoSuficiente && (
                    <p style={{ color: '#dc3545', fontSize: '0.75rem', margin: '4px 0 0 0', fontWeight: 600 }}>
                      ❌ Monto insuficiente
                    </p>
                  )}
                </div>
              )}

              {descuento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: 'var(--color-texto-suave)', padding: '0 2px' }}>
                  <span>Subtotal: ${subtotal.toLocaleString('es-CO')}</span>
                  <span style={{ color: 'var(--color-rojo)', fontWeight: 600 }}>
                    Desc. {descuento}%: −${descuentoMonto.toLocaleString('es-CO')}
                  </span>
                </div>
              )}

              {puntosAGanar > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-amarillo-hover)', fontWeight: 600, padding: '0 2px' }}>
                   Esta compra dará {puntosAGanar} puntos al cliente
                </div>
              )}

              {/* Mostrar cambio si es efectivo y hay monto pagado */}
              {metodoPago === 'efectivo' && montoPagado && tieneMontoSuficiente && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem',
                  backgroundColor: '#f0f8ff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #28a745',
                  margin: '8px 0',
                }}>
                  <span style={{ fontWeight: 600 }}>Cambio:</span>
                  <span style={{ color: '#28a745', fontWeight: 700, fontSize: '1rem' }}>
                    ${cambio.toLocaleString('es-CO')}
                  </span>
                </div>
              )}

              <div className="total-display">
                <span>TOTAL</span>
                <span className="total-monto">${total.toLocaleString('es-CO')}</span>
              </div>

              <button className="caja-finalizar" onClick={guardarVenta}
                disabled={carrito.length === 0 || procesando || !tieneMontoSuficiente}>
                {procesando ? '⏳ Procesando...' : 'Finalizar venta'}
              </button>

              {mensaje && (
                <p className={`mensaje-exito ${mensaje.startsWith('❌') ? 'mensaje-error' : ''}`}>
                  {mensaje}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Caja;
