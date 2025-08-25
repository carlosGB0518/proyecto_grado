import { useEffect, useState } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import '../estilos/ventas.css';
import { supabase } from '../supabase'; // Asegúrate de tener esta instancia exportada

function Ventas() {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    cliente: '',
    cajero: ''
  });

  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    let query = supabase.from('ventas').select('*');

    // Aplicar filtros si existen
    if (filtros.fechaInicio) {
      query = query.gte('fecha', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      query = query.lte('fecha', filtros.fechaFin);
    }
    if (filtros.cliente) {
      query = query.ilike('cliente', `%${filtros.cliente}%`);
    }
    if (filtros.cajero) {
      query = query.ilike('cajero', `%${filtros.cajero}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar ventas:', error.message);
    } else {
      setVentas(data);
    }
  };

  const aplicarFiltros = () => {
    cargarVentas();
  };

  const anularVenta = async (id) => {
    const confirmacion = window.confirm('¿Estás seguro de anular esta venta?');
    if (!confirmacion) return;

    const { error } = await supabase
      .from('ventas')
      .update({ anulada: true })
      .eq('id', id);

    if (error) {
      console.error('Error al anular venta:', error.message);
    } else {
      cargarVentas(); // Refrescar la lista
    }
  };

  return (
    <LayoutBase>
      <h1>Historial de Ventas</h1>

      <section className="filtros">
        <h2>Filtrar</h2>
        <input
          type="date"
          value={filtros.fechaInicio}
          onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
        />
        <input
          type="date"
          value={filtros.fechaFin}
          onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
        />
        <input
          type="text"
          placeholder="Cliente"
          value={filtros.cliente}
          onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
        />
        <input
          type="text"
          placeholder="Cajero"
          value={filtros.cajero}
          onChange={(e) => setFiltros({ ...filtros, cajero: e.target.value })}
        />
        <button onClick={aplicarFiltros}>Aplicar filtros</button>
      </section>

      <section>
        <table className="tabla-ventas">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Cajero</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td>{venta.id}</td>
                <td>{venta.fecha}</td>
                <td>{venta.cliente}</td>
                <td>{venta.cajero}</td>
                <td>${venta.total}</td>
                <td>{venta.anulada ? 'Anulada' : 'Activa'}</td>
                <td>
                  {!venta.anulada && (
                    <button onClick={() => anularVenta(venta.id)}>Anular</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </LayoutBase>
  );
}

export default Ventas;
