import { useState, useEffect, useContext } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import '../estilos/inicio.css';

const saludosPorRol = {
  administrador: 'Panel Administrativo',
  supervisor:    'Panel de Supervisión',
  cajero:        'Módulo de Caja',
};

const Inicio = () => {
  const { usuario } = useContext(UsuarioContexto);
  const [estadisticas, setEstadisticas] = useState({
    ventasDelDia: 0,
    productosStockBajo: 0,
    clientesRegistrados: 0,
    cargando: true,
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setEstadisticas((prev) => ({ ...prev, cargando: true }));

    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const { data: ventas } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', hoy.toISOString());

      const totalVentas = ventas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      const { data: todosProductos } = await supabase
        .from('productos')
        .select('id, stockActual, stockMinimo');

      const productosStockBajo = todosProductos?.filter(
        (p) => p.stockActual < p.stockMinimo
      ).length || 0;

      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      setEstadisticas({
        ventasDelDia: totalVentas,
        productosStockBajo,
        clientesRegistrados: totalClientes || 0,
        cargando: false,
      });
    } catch {
      setEstadisticas({ ventasDelDia: 0, productosStockBajo: 0, clientesRegistrados: 0, cargando: false });
    }
  };

  const panelLabel = saludosPorRol[usuario?.rol] || 'Inicio';

  return (
    <LayoutBase>
      <div className="inicio-container">
        {/* Bienvenida */}
        <div className="inicio-bienvenida">
          <div>
            <h1 className="inicio-titulo">
              Bienvenido, {usuario?.nombre?.split(' ')[0] || 'Usuario'} 👋
            </h1>
            <p className="inicio-parrafo">
              {panelLabel} · Usa el menú lateral para navegar entre los módulos disponibles.
            </p>
          </div>
          <button
            onClick={cargarEstadisticas}
            disabled={estadisticas.cargando}
            className="inicio-btn-actualizar"
          >
            {estadisticas.cargando ? '⏳ Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>

        {/* Tarjetas */}
        <div className="tarjetas-grid">
          <div className="tarjeta">
            <p className="tarjeta-titulo">💰 Ventas del Día</p>
            <p className="tarjeta-dato ventas">
              {estadisticas.cargando
                ? '—'
                : `$${estadisticas.ventasDelDia.toLocaleString('es-CO')}`}
            </p>
          </div>

          <div className="tarjeta">
            <p className="tarjeta-titulo">📦 Productos con Stock Bajo</p>
            <p className="tarjeta-dato stock">
              {estadisticas.cargando
                ? '—'
                : `${estadisticas.productosStockBajo} producto${estadisticas.productosStockBajo !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="tarjeta">
            <p className="tarjeta-titulo">👥 Clientes Registrados</p>
            <p className="tarjeta-dato clientes">
              {estadisticas.cargando
                ? '—'
                : `${estadisticas.clientesRegistrados} cliente${estadisticas.clientesRegistrados !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Inicio;
