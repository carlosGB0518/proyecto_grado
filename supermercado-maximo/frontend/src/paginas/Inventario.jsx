import { useEffect, useState, useRef } from 'react';
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
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadPedido, setCantidadPedido] = useState('');
  const [fechaPedido, setFechaPedido] = useState('');
  const [mostrarModalPedido, setMostrarModalPedido] = useState(false);


  const [modoEdicion, setModoEdicion] = useState(null);
  const [codigoMovimiento, setCodigoMovimiento] = useState('');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');

  const inputCodigoRef = useRef(null);
  const inputMovimientoRef = useRef(null);

  useEffect(() => {
    cargarProductos();
    cargarProveedores();

    // 🔔 Escuchar cambios en tiempo real en la tabla 'productos'
    const canal = supabase
      .channel('realtime:productos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        () => {
          cargarProductos();
        }
      )
      .subscribe();

    // ✅ Enfocar campo de código para escaneo
    if (inputCodigoRef.current) {
      inputCodigoRef.current.focus();
    }

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const cargarProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre, precio, stockActual, stockMinimo, proveedor:proveedor_id(nombre)')

    .eq('activo', true); // ✅ solo productos activos

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

  // ✅ Verificar si ya existe un producto con ese código
  const { data: productoExistente } = await supabase
    .from('productos')
    .select('*')
    .eq('codigo', codigo)
    .single();

  if (productoExistente) {
    // ✅ Si existe y está inactivo, lo reactivamos
    if (!productoExistente.activo) {
      const { error: reactivarError } = await supabase
        .from('productos')
        .update({
          nombre,
          precio: parseInt(precio),
          stockActual: parseInt(stockActual),
          stockMinimo: parseInt(stockMinimo),
          activo: true
        })
        .eq('id', productoExistente.id);

      if (reactivarError) {
        alert('Error al reactivar producto: ' + reactivarError.message);
      } else {
        await cargarProductos();
        setNuevoProducto({
          codigo: '',
          nombre: '',
          precio: '',
          stockActual: '',
          stockMinimo: '',
        });
        if (inputCodigoRef.current) inputCodigoRef.current.focus();
      }
      return;
    }

    // ⚠️ Si ya existe y está activo, no se puede duplicar
    alert('Ya existe un producto con ese código.');
    return;
  }

  // ✅ Si no existe, lo insertamos normalmente
  const { error } = await supabase
    .from('productos')
    .insert([
      {
        codigo,
        nombre,
        precio: parseInt(precio),
        stockActual: parseInt(stockActual),
        stockMinimo: parseInt(stockMinimo),
        proveedor_id: proveedorId || null,
        activo: true
      },
    ]);
    setProveedorId('');


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
    if (inputCodigoRef.current) inputCodigoRef.current.focus();
  }
};

const cargarProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('id, nombre');
      if (!error) setProveedores(data);
        };

const abrirModalPedido = (producto) => {
  if (!producto.proveedor_id) {
    alert(`Este producto no tiene proveedor asignado. Por favor edítalo antes de hacer un pedido.`);
    return;
  }

  setProductoSeleccionado(producto);
  setCantidadPedido('');
  setFechaPedido(new Date().toISOString().split('T')[0]);
  setMostrarModalPedido(true);
};

const confirmarPedido = async () => {
  if (!productoSeleccionado?.proveedor_id) {
    alert('Este producto no tiene proveedor asignado.');
    return;
  }

  if (!cantidadPedido || isNaN(cantidadPedido) || parseInt(cantidadPedido) <= 0) {
    alert('Cantidad inválida.');
    return;
  }

  const { error } = await supabase.from('pedidos').insert([{
    producto_id: productoSeleccionado.id,
    proveedor_id: productoSeleccionado.proveedor_id,
    cantidad: parseInt(cantidadPedido),
    precio_unitario: productoSeleccionado.precio,
    fecha: fechaPedido
  }]);

  if (error) {
    alert('Error al registrar pedido: ' + error.message);
  } else {
    alert('Pedido registrado correctamente.');
    setMostrarModalPedido(false);
    setProductoSeleccionado(null);
    setCantidadPedido('');
    setFechaPedido('');
  }
};


  const manejarEditar = (producto) => {
    setModoEdicion(producto.id);
    setNuevoProducto(producto);
    setProveedorId(producto.proveedor_id || '');

  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('productos')
      .update({
        nombre: nuevoProducto.nombre,
        precio: parseInt(nuevoProducto.precio),
        stockActual: parseInt(nuevoProducto.stockActual),
        proveedor_id: proveedorId || null,
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
      if (inputCodigoRef.current) inputCodigoRef.current.focus();
    }
  };

  const eliminarProducto = async (id) => {
  if (!window.confirm('¿Eliminar producto del inventario? Esta acción no afectará las ventas pasadas.')) return;

  const { error } = await supabase
    .from('productos')
    .update({ activo: false }) // ✅ eliminación lógica
    .eq('id', id);

  if (error) {
    alert('Error al marcar como eliminado: ' + error.message);
  } else {
    await cargarProductos();
  }
};

const registrarEntrada = async () => {
  if (!codigoMovimiento || !cantidadMovimiento) {
    alert('Debes ingresar el código y la cantidad.');
    return;
  }

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
      if (inputMovimientoRef.current) inputMovimientoRef.current.focus();
    }
  }
};


const registrarSalida = async () => {
  if (!codigoMovimiento || !cantidadMovimiento) {
    alert('Debes ingresar el código y la cantidad.');
    return;
  }

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
      if (inputMovimientoRef.current) inputMovimientoRef.current.focus();
    }
  }
};


  return (
    <LayoutBase>
      <div className="inventario-container">
        <h2>Inventario</h2>

        <form onSubmit={modoEdicion ? guardarEdicion : manejarAgregar} className="inventario-form">
          
          <input type="text" name="nombre" placeholder="Nombre" value={nuevoProducto.nombre} onChange={manejarCambio} required />
          <input type="number" name="precio" placeholder="Precio" value={nuevoProducto.precio} onChange={manejarCambio} required />
          <input type="number" name="stockActual" placeholder="Stock actual" value={nuevoProducto.stockActual} onChange={manejarCambio} required />
          <input type="number" name="stockMinimo" placeholder="Stock mínimo" value={nuevoProducto.stockMinimo} onChange={manejarCambio} required />
          <input
            ref={inputCodigoRef}
            type="text"
            name="codigo"
            placeholder="Código"
            value={nuevoProducto.codigo}
            onChange={manejarCambio}
            required
            disabled={modoEdicion !== null}
          />
          <label>Proveedor:</label>
          <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Selecciona un proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <button type="submit">{modoEdicion ? 'Guardar cambios' : 'Agregar producto'}</button>
        </form>

        <div className="movimientos-stock">
          <h3>Registrar movimiento de stock</h3>
          <input
              ref={inputMovimientoRef}
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
              <th>Proveedor</th>

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
                <td>{p.proveedor?.nombre || 'Sin proveedor'}</td>

                <td>
                  <button onClick={() => manejarEditar(p)}>✏️</button>
                  <button onClick={() => eliminarProducto(p.id)}>🗑️</button>
                  <button onClick={() => abrirModalPedido(p)}>📦</button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mostrarModalPedido && (
  <div className="modal-pedido">
    <div className="modal-contenido">
      <h3>Registrar pedido</h3>
      <p><strong>Producto:</strong> {productoSeleccionado.nombre}</p>
      <p><strong>Proveedor:</strong> {productoSeleccionado.proveedor?.nombre || 'Sin proveedor'}</p>

      <label>Cantidad:</label>
      <input
        type="number"
        value={cantidadPedido}
        onChange={(e) => setCantidadPedido(e.target.value)}
        placeholder="Cantidad"
      />

      <label>Fecha del pedido:</label>
      <input
        type="date"
        value={fechaPedido}
        onChange={(e) => setFechaPedido(e.target.value)}
      />

      <div className="modal-botones">
        <button onClick={confirmarPedido}>Confirmar</button>
        <button onClick={() => setMostrarModalPedido(false)}>Cancelar</button>
      </div>
    </div>
  </div>
)}
    </LayoutBase>
  );
  
};

export default Inventario;
