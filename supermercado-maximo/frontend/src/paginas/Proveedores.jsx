import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import LayoutBase from '../layouts/LayoutBase';
import { crearPDFConTabla } from '../utils/pdfUtils';
import '../estilos/proveedores.css';

// ─── Formulario ────────────────────────────────────────────────────────────
function FormularioProveedor({ onGuardar, proveedorEditando, cancelarEdicion }) {
  const [form, setForm] = useState({ nombre: '', nit: '', telefono: '', email: '', direccion: '' });

  useEffect(() => {
    if (proveedorEditando) {
      setForm({
        nombre: proveedorEditando.nombre || '',
        nit: proveedorEditando.nit || '',
        telefono: proveedorEditando.telefono || '',
        email: proveedorEditando.email || '',
        direccion: proveedorEditando.direccion || '',
      });
    } else {
      setForm({ nombre: '', nit: '', telefono: '', email: '', direccion: '' });
    }
  }, [proveedorEditando]);

  const manejarCambio = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    let error;
    if (proveedorEditando) {
      ({ error } = await supabase.from('proveedores').update(form).eq('id', proveedorEditando.id));
    } else {
      ({ error } = await supabase.from('proveedores').insert([form]));
    }
    if (error) {
      alert('Error al guardar proveedor: ' + error.message);
    } else {
      onGuardar?.();
      cancelarEdicion?.();
    }
  };

  return (
    <div className="prov-form-card card">
      <h2 className="prov-form-titulo">
        {proveedorEditando ? 'Editar Proveedor' : 'Registrar Proveedor'}
      </h2>
      <form className="prov-form" onSubmit={guardar}>
        <div className="prov-form-grid">
          <div className="prov-campo">
            <label>Nombre *</label>
            <input type="text" name="nombre" className="input-base" placeholder="Nombre del proveedor"
              value={form.nombre} onChange={manejarCambio} required />
          </div>
          <div className="prov-campo">
            <label>NIT</label>
            <input type="text" name="nit" className="input-base" placeholder="NIT"
              value={form.nit} onChange={manejarCambio} />
          </div>
          <div className="prov-campo">
            <label>Teléfono</label>
            <input type="text" name="telefono" className="input-base" placeholder="Teléfono"
              value={form.telefono} onChange={manejarCambio} />
          </div>
          <div className="prov-campo">
            <label>Email</label>
            <input type="email" name="email" className="input-base" placeholder="email@proveedor.com"
              value={form.email} onChange={manejarCambio} />
          </div>
          <div className="prov-campo prov-campo-full">
            <label>Dirección</label>
            <input type="text" name="direccion" className="input-base" placeholder="Dirección"
              value={form.direccion} onChange={manejarCambio} />
          </div>
        </div>
        <div className="prov-form-acciones">
          <button type="submit" className="btn-primary">
            {proveedorEditando ? 'Actualizar' : 'Guardar Proveedor'}
          </button>
          {proveedorEditando && (
            <button type="button" className="btn-secondary" onClick={cancelarEdicion}>Cancelar</button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Lista ─────────────────────────────────────────────────────────────────
function ListaProveedores({ proveedores, onEditar, onSeleccionar, seleccionado }) {
  const [filtro, setFiltro] = useState('');

  const exportarPDF = () => {
    if (proveedores.length === 0) { alert('No hay proveedores para exportar.'); return; }
    const filas = proveedores.map((p, i) => [i + 1, p.nombre, p.nit || '—', p.email || '—', p.telefono || '—']);
    crearPDFConTabla('Listado de Proveedores', ['#', 'Nombre', 'NIT', 'Email', 'Teléfono'], filas, 'proveedores.pdf');
  };

  const filtrados = proveedores.filter(
    (p) => p.nombre?.toLowerCase().includes(filtro.toLowerCase()) || p.nit?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="prov-lista-header">
        <div className="prov-busqueda-wrap">
          <span></span>
          <input type="text" className="prov-busqueda" placeholder="Buscar por nombre o NIT..."
            value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="prov-contador">{filtrados.length} proveedores</span>
          <button className="btn-secondary prov-btn-pdf" onClick={exportarPDF} style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
            Exportar PDF
          </button>
        </div>
      </div>
      <div className="prov-tabla-wrapper">
        {filtrados.length === 0 ? (
          <div className="prov-estado">No hay proveedores registrados.</div>
        ) : (
          <table className="tabla-base">
            <thead>
              <tr>
                <th>Nombre</th><th>NIT</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className={seleccionado === p.id ? 'prov-fila-activa' : ''}
                  onClick={() => onSeleccionar(p.id)} style={{ cursor: 'pointer' }}>
                  <td className="prov-nombre">{p.nombre}</td>
                  <td>{p.nit || '—'}</td>
                  <td>{p.telefono || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.direccion || '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="prov-btn-editar" onClick={() => onEditar(p)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Productos del proveedor ────────────────────────────────────────────────
function ProductosPorProveedor({ proveedorId, proveedorNombre }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!proveedorId) return;
    setCargando(true);
    supabase.from('productos').select('id, nombre, stockActual, precio').eq('proveedor_id', proveedorId)
      .then(({ data, error }) => {
        if (!error) setProductos(data || []);
        setCargando(false);
      });
  }, [proveedorId]);

  if (!proveedorId) return null;

  return (
    <div className="card prov-productos" style={{ marginTop: '1.25rem' }}>
      <h3 className="prov-productos-titulo">Productos de: <span>{proveedorNombre}</span></h3>
      {cargando ? (
        <p className="prov-estado">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="prov-estado">Este proveedor no tiene productos asociados.</p>
      ) : (
        <table className="tabla-base" style={{ marginTop: '0.75rem' }}>
          <thead><tr><th>Producto</th><th>Stock</th><th>Precio</th></tr></thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.stockActual ?? '—'}</td>
                <td>${p.precio?.toLocaleString('es-CO') ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Principal ──────────────────────────────────────────────────────────────
const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const cargar = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('nombre');
    if (!error) setProveedores(data || []);
  };

  useEffect(() => { cargar(); }, []);

  const provNombre = proveedores.find((p) => p.id === proveedorSeleccionado)?.nombre;

  return (
    <LayoutBase>
      <div className="prov-container">
        <div className="prov-page-header">
          <h1 className="prov-titulo">Proveedores</h1>
          <p className="prov-subtitulo">Administra los proveedores y consulta sus productos asociados.</p>
        </div>

        <FormularioProveedor
          onGuardar={cargar}
          proveedorEditando={proveedorEditando}
          cancelarEdicion={() => setProveedorEditando(null)}
        />

        <ListaProveedores
          proveedores={proveedores}
          onEditar={(p) => { setProveedorEditando(p); setProveedorSeleccionado(p.id); }}
          onSeleccionar={(id) => setProveedorSeleccionado((prev) => prev === id ? null : id)}
          seleccionado={proveedorSeleccionado}
        />

        <ProductosPorProveedor proveedorId={proveedorSeleccionado} proveedorNombre={provNombre} />
      </div>
    </LayoutBase>
  );
};

export default Proveedores;
