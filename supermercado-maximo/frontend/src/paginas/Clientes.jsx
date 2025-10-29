import { useState } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/clientes.css';
import { supabase } from '../supabase'; // asegúrate de que la ruta sea correcta

function Clientes() {
  const [cliente, setCliente] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Insertar datos en Supabase
    const { error } = await supabase.from('clientes').insert([cliente]);

    if (error) {
      console.error('Error al registrar cliente:', error.message);
      setMensaje('❌ Error al registrar el cliente.');
    } else {
      console.log('Cliente registrado en Supabase:', cliente);
      setMensaje('✅ Cliente registrado exitosamente.');

      setCliente({
        nombre: '',
        telefono: '',
        correo: '',
        direccion: ''
      });
    }
  };

  return (
    <LayoutBase>
      <h1>Gestión de Clientes</h1>

      <section>
        <h2>Registro de Cliente</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={cliente.nombre}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={cliente.telefono}
            onChange={handleChange}
          />
          <input
            type="email"
            name="correo"
            placeholder="Correo electrónico"
            value={cliente.correo}
            onChange={handleChange}
          />
          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={cliente.direccion}
            onChange={handleChange}
          />
          <button type="submit">Registrar Cliente</button>
        </form>
        {mensaje && <p style={{ marginTop: '10px' }}>{mensaje}</p>}
      </section>

      <section>
        <h2>Historial de Compras</h2>
        {/* Aquí se mostrará el historial del cliente seleccionado */}
      </section>

      <section>
        <h2>Puntos de Fidelización</h2>
        {/* Mostrar puntos acumulados, descuentos, etc. */}
      </section>
    </LayoutBase>
  );
}

export default Clientes;
