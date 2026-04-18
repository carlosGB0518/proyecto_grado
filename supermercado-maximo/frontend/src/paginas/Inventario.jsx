/**
 * Inventario.jsx — Supermercado Máximo
 *
 * Correcciones:
 * - registrarSalida: corregido (era bug: sumaba en vez de restar)
 * - Usa InventarioContexto para CRUD (Realtime ya propagado a Caja)
 * - Elimina el useEffect redundante que hacía fetch local separado
 */
import { useEffect, useState, useRef, useContext } from 'react';
import { supabase } from '../supabase';
import { InventarioContexto } from '../contextos/InventarioContexto';
import LayoutBase from '../layouts/LayoutBase';
import { AlertaStockPanel } from '../componentes/AlertaStock';
import '../estilos/inventario.css';

const Inventario = () => {
  const { productos, cargarProductos, productosAlerta } = useContext(InventarioContexto);

  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: '', nombre: '', precio: '', stockactual: '', stockminimo: '',
  });
  const [proveedores, setProveedores]     = useState([]);
  const [proveedorId, setProveedorId]     = useState('');
  const [modoEdicion, setModoEdicion]     = useState(null);

  // Movimientos de stock
  const [codigoMovimiento, setCodigoMovimiento] = useState('');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');

  // Modal pedido
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadPedido, setCantidadPedido]   = useState('');
  const [fechaPedido, setFechaPedido]         = useState('');
  const [mostrarModalPedido, setMostrarModalPedido] = useState(false);

  // Búsqueda
  const [busqueda, setBusqueda] = useState('');

  const inputCodigoRef    = useRef(null);
  const inputMovimientoRef = useRef(null);

  useEffect(() => {
    cargarProveedores();
    if (inputCodigoRef.current) inputCodigoRef.current.focus();
  }, []);

  const cargarProveedores = async () => {
    const { data } = await supabase.from('proveedores').select('id, nombre').order('nombre');
    if (data) setProveedores(data);
  };

  const manejarCambio = e =>
    setNuevoProducto(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Agregar / reactivar producto ───────────────────────────────────
  const manejarAgregar = async (e) => {
    e.preventDefault();
    const { codigo, nombre, precio, stockactual, stockminimo } = nuevoProducto;
    if (!codigo || !nombre || !precio || stockactual === '' || stockminimo === '') return;

    // ¿Existe?
    const { data: existente } = await supabase
      .from('productos').select('*').eq('codigo', codigo).single();

    if (existente) {
      if (!existente.activo) {
        // Reactivar
        await supabase.from('productos').update({
          nombre, precio: parseInt(precio),
          stockactual: parseInt(stockactual),
          stockminimo: parseInt(stockminimo),
          activo: true,
        }).eq('id', existente.id);
        cargarProductos();
        resetForm();
      } else {
        alert('Ya existe un producto activo con ese código.');
      }
      return;
    }

    await supabase.from('productos').insert([{
      codigo, nombre,
      precio: parseInt(precio),
      stockactual: parseInt(stockactual),
      stockminimo: parseInt(stockminimo),
      proveedor_id: proveedorId || null,
      activo: true,
    }]);
    cargarProductos();
    resetForm();
  };

  // ── Editar ─────────────────────────────────────────────────────────
  const manejarEditar = p => {
    setModoEdicion(p.id);
    setNuevoProducto(p);
    setProveedorId(p.proveedor_id || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    await supabase.from('productos').update({
      nombre:      nuevoProducto.nombre,
      precio:      parseInt(nuevoProducto.precio),
      stockactual: parseInt(nuevoProducto.stockactual),
      stockminimo: parseInt(nuevoProducto.stockminimo),
      proveedor_id: proveedorId || null,
    }).eq('id', modoEdicion);
    setModoEdicion(null);
    cargarProductos();
    resetForm();
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto del inventario? Los datos de ventas anteriores se conservan.')) return;
    await supabase.from('productos').update({ activo: false }).eq('id', id);
    cargarProductos();
  };

  const resetForm = () => {
    setNuevoProducto({ codigo: '', nombre: '', precio: '', stockactual: '', stockminimo: '' });
    setProveedorId('');
    setModoEdicion(null);
    if (inputCodigoRef.current) inputCodigoRef.current.focus();
  };

  // ── Movimientos de stock ───────────────────────────────────────────
  const registrarMovimiento = async (tipo) => {
    if (!codigoMovimiento || !cantidadMovimiento) {
      alert('Ingresa el código y la cantidad.'); return;
    }
    const cantidad = parseInt(cantidadMovimiento);
    if (isNaN(cantidad) || cantidad <= 0) { alert('Cantidad inválida.'); return; }

    const producto = productos.find(p => p.codigo === codigoMovimiento);
    if (!producto) { alert('Producto no encontrado.'); return; }

    // ✅ BUG FIX: salida resta, entrada suma
    const nuevoStock = tipo === 'entrada'
      ? producto.stockactual + cantidad
      : producto.stockactual - cantidad;

    if (nuevoStock < 0) {
      alert(`⚠️ Stock insuficiente. Stock actual: ${producto.stockactual}`); return;
    }

    await supabase.from('productos').update({ stockactual: nuevoStock }).eq('id', producto.id);
    cargarProductos();
    setCodigoMovimiento('');
    setCantidadMovimiento('');
    if (inputMovimientoRef.current) inputMovimientoRef.current.focus();
  };

  // ── Modal pedido ───────────────────────────────────────────────────
  const abrirModalPedido = (p) => {
    if (!p.proveedor_id) {
      alert('Este producto no tiene proveedor asignado. Edítalo primero.'); return;
    }
    setProductoSeleccionado(p);
    setCantidadPedido('');
    setFechaPedido(new Date().toISOString().split('T')[0]);
    setMostrarModalPedido(true);
  };

  const confirmarPedido = async () => {
    if (!cantidadPedido || parseInt(cantidadPedido) <= 0) {
      alert('Cantidad inválida.'); return;
    }
    await supabase.from('pedidos').insert([{
      producto_id:    productoSeleccionado.id,
      proveedor_id:   productoSeleccionado.proveedor_id,
      cantidad:       parseInt(cantidadPedido),
      precio_unitario: productoSeleccionado.precio,
      fecha: fechaPedido,
    }]);
    alert('✅ Pedido registrado.');
    setMostrarModalPedido(false);
  };

  // ── Filtro de búsqueda ─────────────────────────────────────────────
  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <LayoutBase>
      <div className="inventario-container">
        <h2>📦 Inventario</h2>

        {/* Alertas de stock bajo */}
        <AlertaStockPanel />

        {/* Formulario agregar/editar */}
        <form
          onSubmit={modoEdicion ? guardarEdicion : manejarAgregar}
          className="inventario-form"
        >
          <input ref={inputCodigoRef} type="text" name="codigo"
            placeholder="Código *" value={nuevoProducto.codigo}
            onChange={manejarCambio} required disabled={modoEdicion !== null} />
          <input type="text" name="nombre"
            placeholder="Nombre *" value={nuevoProducto.nombre}
            onChange={manejarCambio} required />
          <input type="number" name="precio"
            placeholder="Precio *" value={nuevoProducto.precio}
            onChange={manejarCambio} required min="0" />
          <input type="number" name="stockactual"
            placeholder="Stock actual *" value={nuevoProducto.stockactual}
            onChange={manejarCambio} required min="0" />
          <input type="number" name="stockminimo"
            placeholder="Stock mínimo *" value={nuevoProducto.stockminimo}
            onChange={manejarCambio} required min="0" />
          <select value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button type="submit">{modoEdicion ? '💾 Guardar cambios' : '➕ Agregar'}</button>
          {modoEdicion && (
            <button type="button" onClick={resetForm} style={{
              background: 'transparent', border: '1.5px solid var(--color-gris-borde)',
              color: 'var(--color-texto-suave)'
            }}>Cancelar</button>
          )}
        </form>

        {/* Movimientos de stock */}
        <div className="movimientos-stock">
          <h3>📊 Movimientos de Stock</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <input ref={inputMovimientoRef} type="text"
              placeholder="Código del producto"
              value={codigoMovimiento}
              onChange={e => setCodigoMovimiento(e.target.value)}
              style={{ flex: 1, minWidth: '150px', padding: '0.6rem', border: '1.5px solid var(--color-gris-borde)', borderRadius: 'var(--radio-sm)' }}
            />
            <input type="number" min="1"
              placeholder="Cantidad"
              value={cantidadMovimiento}
              onChange={e => setCantidadMovimiento(e.target.value)}
              style={{ width: '120px', padding: '0.6rem', border: '1.5px solid var(--color-gris-borde)', borderRadius: 'var(--radio-sm)' }}
            />
            <button onClick={() => registrarMovimiento('entrada')} className="btn-primary">
              ⬆️ Entrada
            </button>
            <button onClick={() => registrarMovimiento('salida')} className="btn-danger">
              ⬇️ Salida
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '1rem 0 0.5rem' }}>
          <input type="text" placeholder="🔍 Buscar por nombre o código..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, padding: '0.6rem 0.9rem', border: '1.5px solid var(--color-gris-borde)', borderRadius: 'var(--radio-sm)', fontFamily: 'var(--fuente-cuerpo)' }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--color-texto-suave)', whiteSpace: 'nowrap' }}>
            {productosFiltrados.length} de {productos.length} productos
          </span>
        </div>

        {/* Tabla */}
        <div className="inventario-tabla-wrapper">
          <table className="inventario-tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Proveedor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.codigo}</td>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td>${p.precio.toLocaleString('es-CO')}</td>
                  <td className={p.stockactual < p.stockminimo ? 'stock-bajo' : 'stock-ok'}>
                    {p.stockactual}
                    {p.stockactual < p.stockminimo && ' ⚠️'}
                  </td>
                  <td>{p.stockminimo}</td>
                  <td>{p.proveedor?.nombre || '—'}</td>
                  <td>
                    <button className="btn-editar" onClick={() => manejarEditar(p)} title="Editar">✏️</button>
                    <button className="btn-eliminar" onClick={() => eliminarProducto(p.id)} title="Eliminar">🗑️</button>
                    <button onClick={() => abrirModalPedido(p)} title="Hacer pedido"
                      style={{ background: 'transparent', border: '1.5px solid var(--color-verde)', color: 'var(--color-verde)', padding: '4px 8px', borderRadius: 'var(--radio-sm)', cursor: 'pointer', fontSize: '0.78rem', marginLeft: '4px' }}>
                      📦 Pedir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal pedido */}
        {mostrarModalPedido && (
          <div className="modal-overlay" onClick={() => setMostrarModalPedido(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>📦 Registrar Pedido</h2>
              <p><strong>Producto:</strong> {productoSeleccionado?.nombre}</p>
              <p><strong>Proveedor:</strong> {productoSeleccionado?.proveedor?.nombre || '—'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: 600 }}>Cantidad *</label>
                  <input type="number" className="input-base" min="1"
                    value={cantidadPedido} onChange={e => setCantidadPedido(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.83rem', fontWeight: 600 }}>Fecha del pedido *</label>
                  <input type="date" className="input-base"
                    value={fechaPedido} onChange={e => setFechaPedido(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button className="btn-primary" onClick={confirmarPedido}>Confirmar Pedido</button>
                <button className="btn-secondary" onClick={() => setMostrarModalPedido(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutBase>
  );
};

export default Inventario;
