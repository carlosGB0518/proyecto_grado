import { useState, useEffect } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import '../estilos/inicio.css';

const Inicio = () => {
  const [estadisticas, setEstadisticas] = useState({
    ventasDelDia: 0,
    productosStockBajo: 0,
    clientesRegistrados: 0,
    cargando: true
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setEstadisticas(prev => ({ ...prev, cargando: true }));

    try {
      // 1️⃣ Obtener ventas del día actual
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaHoy = hoy.toISOString();

      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', fechaHoy);

      if (ventasError) {
        console.error('Error cargando ventas:', ventasError);
      }

      const totalVentas = ventas?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;

      // 2️⃣ Obtener productos con stock bajo
      // Primero obtenemos todos los productos y filtramos manualmente
      const { data: todosProductos, error: stockError } = await supabase
        .from('productos')
        .select('id, nombre, stockActual, stockMinimo');

      if (stockError) {
        console.error('Error cargando productos:', stockError);
      }

      // Filtrar productos donde stockActual < stockMinimo
      const productosStockBajo = todosProductos?.filter(
        p => p.stockActual < p.stockMinimo
      ) || [];

      console.log('Productos con stock bajo:', productosStockBajo);

      // 3️⃣ Obtener total de clientes registrados
      const { count: totalClientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      if (clientesError) {
        console.error('Error cargando clientes:', clientesError);
      }

      setEstadisticas({
        ventasDelDia: totalVentas,
        productosStockBajo: productosStockBajo.length,
        clientesRegistrados: totalClientes || 0,
        cargando: false
      });

    } catch (error) {
      console.error('Error general cargando estadísticas:', error);
      setEstadisticas({
        ventasDelDia: 0,
        productosStockBajo: 0,
        clientesRegistrados: 0,
        cargando: false
      });
    }
  };

  return (
    <LayoutBase>
      <div className="inicio-container">
        <h1 className="inicio-titulo">Bienvenido al Sistema POS del Supermercado</h1>
        <p className="inicio-parrafo">
          Desde aquí puedes gestionar las ventas, inventario, caja, clientes y más. 
          Usa el menú lateral para navegar entre los módulos del sistema.
        </p>

        <div className="tarjetas-grid">
          {/* Tarjeta 1: Ventas del Día */}
          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Ventas del Día</h2>
            <p className="tarjeta-dato ventas">
              {estadisticas.cargando 
                ? 'Cargando...' 
                : `$${estadisticas.ventasDelDia.toLocaleString('es-CO')}`
              }
            </p>
          </div>

          {/* Tarjeta 2: Productos en Bajo Stock */}
          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Productos en Bajo Stock</h2>
            <p className="tarjeta-dato stock">
              {estadisticas.cargando 
                ? 'Cargando...' 
                : `${estadisticas.productosStockBajo} producto${estadisticas.productosStockBajo !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Tarjeta 3: Clientes Registrados */}
          <div className="tarjeta">
            <h2 className="tarjeta-titulo">Clientes Registrados</h2>
            <p className="tarjeta-dato clientes">
              {estadisticas.cargando 
                ? 'Cargando...' 
                : `${estadisticas.clientesRegistrados} cliente${estadisticas.clientesRegistrados !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {/* Botón para actualizar manualmente */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={cargarEstadisticas}
            disabled={estadisticas.cargando}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: estadisticas.cargando ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: estadisticas.cargando ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {estadisticas.cargando ? '⏳ Actualizando...' : '🔄 Actualizar Estadísticas'}
          </button>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Inicio;