import { useState, useEffect, useContext } from 'react';
import LayoutBase from '../layouts/LayoutBase';
import { supabase } from '../supabase';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import { AlertaStockPanel } from '../componentes/AlertaStock';
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
    cajasAbiertas: 0,
    cargando: true,
  });

  useEffect(() => { cargarEstadisticas(); }, []);

  // Realtime: actualizar ventas del día automáticamente
  useEffect(() => {
    const canal = supabase
      .channel('realtime:inicio:ventas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventas' }, () => {
        cargarEstadisticas();
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  const cargarEstadisticas = async () => {
    setEstadisticas(prev => ({ ...prev, cargando: true }));
    try {
      const hoy = new Date(); hoy.setHours(0,0,0,0);

      const [ventasRes, productosRes, clientesRes, cajasRes] = await Promise.all([
        supabase.from('ventas').select('total').gte('fecha', hoy.toISOString()).eq('anulada', false),
        supabase.from('productos').select('stockActual, stockMinimo').eq('activo', true),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('caja_sesiones').select('id', { count: 'exact', head: true }).eq('estado', 'abierta'),
      ]);

      const totalVentas   = ventasRes.data?.reduce((s, v) => s + (v.total || 0), 0) || 0;
      const stockBajo     = productosRes.data?.filter(p => p.stockActual < p.stockMinimo).length || 0;

      setEstadisticas({
        ventasDelDia:       totalVentas,
        productosStockBajo: stockBajo,
        clientesRegistrados: clientesRes.count || 0,
        cajasAbiertas:       cajasRes.count || 0,
        cargando: false,
      });
    } catch {
      setEstadisticas(p => ({ ...p, cargando: false }));
    }
  };

  const panelLabel = saludosPorRol[usuario?.rol] || 'Inicio';

  return (
    <LayoutBase>
      <div className="inicio-container">
        {/* Alerta stock bajo */}
        <AlertaStockPanel />

        {/* Bienvenida */}
        <div className="inicio-bienvenida">
          <div>
            <h1 className="inicio-titulo">
              Bienvenido, {usuario?.nombre?.split(' ')[0] || 'Usuario'} 
            </h1>
            <p className="inicio-parrafo">
              {panelLabel} · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={cargarEstadisticas}
            disabled={estadisticas.cargando}
            className="inicio-btn-actualizar"
          >
            {estadisticas.cargando ? ' Actualizando...' : ' Actualizar'}
          </button>
        </div>

        {/* Tarjetas */}
        <div className="tarjetas-grid">
          <div className="tarjeta">
            <p className="tarjeta-titulo"> Ventas del Día</p>
            <p className="tarjeta-dato ventas">
              {estadisticas.cargando ? '—' : `$${estadisticas.ventasDelDia.toLocaleString('es-CO')}`}
            </p>
          </div>

          <div className="tarjeta">
            <p className="tarjeta-titulo"> Stock Bajo</p>
            <p className="tarjeta-dato stock">
              {estadisticas.cargando ? '—' : `${estadisticas.productosStockBajo} producto${estadisticas.productosStockBajo !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="tarjeta">
            <p className="tarjeta-titulo"> Clientes</p>
            <p className="tarjeta-dato clientes">
              {estadisticas.cargando ? '—' : `${estadisticas.clientesRegistrados}`}
            </p>
          </div>

          <div className="tarjeta">
            <p className="tarjeta-titulo"> Cajas Abiertas</p>
            <p className="tarjeta-dato" style={{ color: estadisticas.cajasAbiertas > 0 ? 'var(--color-verde)' : 'var(--color-texto-suave)' }}>
              {estadisticas.cargando ? '—' : `${estadisticas.cajasAbiertas}`}
            </p>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default Inicio;
