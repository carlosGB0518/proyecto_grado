import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import LayoutBase from '../layouts/LayoutBase';
import { crearPDFConTabla } from '../utils/pdfUtils';
import '../estilos/proveedores.css';

// 🧩 Subcomponente: Formulario para crear o editar proveedor
function FormularioProveedor({ onGuardar, proveedorEditando, cancelarEdicion }) {
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");

  useEffect(() => {
    if (proveedorEditando) {
      setNombre(proveedorEditando.nombre);
      setNit(proveedorEditando.nit);
      setTelefono(proveedorEditando.telefono);
      setEmail(proveedorEditando.email);
      setDireccion(proveedorEditando.direccion);
    }
  }, [proveedorEditando]);

  const guardarProveedor = async () => {
    const payload = { nombre, nit, telefono, email, direccion };
    let error;
    if (proveedorEditando) {
      ({ error } = await supabase.from("proveedores").update(payload).eq("id", proveedorEditando.id));
    } else {
      ({ error } = await supabase.from("proveedores").insert([payload]));
    }

    if (error) {
      alert("❌ Error al guardar proveedor");
      console.error(error);
    } else {
      alert("✅ Proveedor guardado");
      onGuardar?.();
      setNombre(""); setNit(""); setTelefono(""); setEmail(""); setDireccion("");
      cancelarEdicion?.();
    }
  };

  return (
    <div className="formulario-proveedor">
      <h2>{proveedorEditando ? "Editar proveedor" : "Registrar nuevo proveedor"}</h2>
      <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input placeholder="NIT" value={nit} onChange={(e) => setNit(e.target.value)} />
      <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      <button onClick={guardarProveedor}>{proveedorEditando ? "Actualizar" : "Guardar"}</button>
      {proveedorEditando && <button onClick={cancelarEdicion}>Cancelar</button>}
    </div>
  );
}

// 🧩 Subcomponente: Lista de proveedores con filtro y exportación
function ListaProveedores({ proveedores, onEditar }) {
  const [filtro, setFiltro] = useState("");

const generarPDFProveedores = () => {
  if (proveedores.length === 0) {
    alert('No hay proveedores registrados.');
    return;
  }

  const filas = proveedores.map((p, i) => [
    i + 1,
    p.nombre,
    p.email || '—',
    p.telefono || '—'
  ]);

  crearPDFConTabla(
    'Listado de Proveedores',
    ['#', 'Nombre', 'Email', 'Teléfono'],
    filas,
    'proveedores.pdf'
  );
};


  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.nit.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="lista-proveedores">
      <h2>Listado de proveedores</h2>
      <input
        placeholder="Buscar por nombre o NIT"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
      <button onClick={generarPDFProveedores}>📄 Exportar PDF</button>
      <table>
        <thead>
          <tr>
            <th>Nombre</th><th>NIT</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedoresFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.nit}</td>
              <td>{p.telefono}</td>
              <td>{p.email}</td>
              <td>{p.direccion}</td>
              <td><button onClick={() => onEditar(p)}>✏️ Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 🧩 Subcomponente: Productos vinculados a proveedor
function ProductosPorProveedor({ proveedorId }) {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase.from("productos").select("*").eq("proveedor_id", proveedorId);
      if (!error) setProductos(data);
    };
    if (proveedorId) cargar();
  }, [proveedorId]);

  if (!proveedorId) return null;

  return (
    <div className="productos-proveedor">
      <h3>Productos del proveedor</h3>
      <ul>
        {productos.map(p => (
          <li key={p.id}>{p.nombre} — Stock: {p.stock}</li>
        ))}
      </ul>
    </div>
  );
}

// ✅ Componente principal
const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const cargarProveedores = async () => {
    const { data, error } = await supabase.from("proveedores").select("*").order("creado_en", { ascending: false });
    if (!error) setProveedores(data);
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  return (
    <LayoutBase>
      <FormularioProveedor
        onGuardar={cargarProveedores}
        proveedorEditando={proveedorEditando}
        cancelarEdicion={() => setProveedorEditando(null)}
      />
      <ListaProveedores
        proveedores={proveedores}
        onEditar={(p) => {
          setProveedorEditando(p);
          setProveedorSeleccionado(p.id);
        }}
      />
      <ProductosPorProveedor proveedorId={proveedorSeleccionado} />
    </LayoutBase>
  );
};

export default Proveedores;
