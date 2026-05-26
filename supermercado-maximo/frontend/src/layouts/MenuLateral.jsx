import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import { InventarioContexto } from '../contextos/InventarioContexto';
import '../estilos/menulateral.css';

const modulosPorRol = {
  cajero: [
    { ruta: '/',            etiqueta: 'Inicio', },
    { ruta: '/caja',        etiqueta: 'Caja', },
    { ruta: '/control-caja',etiqueta: 'Control Caja', },
    { ruta: '/clientes',    etiqueta: 'Clientes', },
    { ruta: '/facturacion', etiqueta: 'Facturación', },
  ],
  supervisor: [
    { ruta: '/',            etiqueta: 'Inicio', },
    { ruta: '/caja',        etiqueta: 'Caja', },
    { ruta: '/control-caja',etiqueta: 'Control Caja', },
    { ruta: '/clientes',    etiqueta: 'Clientes', },
    { ruta: '/facturacion', etiqueta: 'Facturación',},
    { ruta: '/ventas',      etiqueta: 'Ventas', },
    { ruta: '/reportes',    etiqueta: 'Reportes', },
    { ruta: '/vencimientos',etiqueta: 'Vencimientos', },
  ],
  administrador: [
    { ruta: '/',            etiqueta: 'Inicio' },
    { ruta: '/caja',        etiqueta: 'Caja' },
    { ruta: '/control-caja',etiqueta: 'Control Caja' },
    { ruta: '/clientes',    etiqueta: 'Clientes' },
    { ruta: '/facturacion', etiqueta: 'Facturación' },
    { ruta: '/ventas',      etiqueta: 'Ventas', },
    { ruta: '/reportes',    etiqueta: 'Reportes' },
    { ruta: '/inventario',  etiqueta: 'Inventario', alerta: true },
    { ruta: '/proveedores', etiqueta: 'Proveedores' },
    { ruta: '/pedidos',     etiqueta: 'Pedidos' },
    { ruta: '/usuarios',    etiqueta: 'Usuarios'},
    { ruta: '/vencimientos',etiqueta: 'Vencimientos' },
    
  ],
};

function MenuLateral() {
  const { usuario } = useContext(UsuarioContexto);
  const { productosAlerta } = useContext(InventarioContexto);
  const location = useLocation();

  const rol = usuario?.rol || 'cajero';
  const modulos = modulosPorRol[rol] || modulosPorRol.cajero;

  return (
    <aside className="menu-lateral">
      {/* Logo */}
      <div className="menu-logo">
        <span className="menu-logo-icon"></span>
        <div>
          <div className="menu-logo-nombre">Supermercado</div>
          <div className="menu-logo-nombre menu-logo-maximo">Máximo</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="menu-nav">
        <ul>
          {modulos.map((mod) => {
            const activo = location.pathname === mod.ruta;
            const tieneAlerta = mod.alerta && productosAlerta?.length > 0;
            return (
              <li key={mod.ruta}>
                <Link
                  to={mod.ruta}
                  className={`menu-link ${activo ? 'menu-link-activo' : ''}`}
                >
                  <span className="menu-icono">{mod.icono}</span>
                  <span className="menu-etiqueta">{mod.etiqueta}</span>
                  {tieneAlerta && (
                    <span className="menu-alerta-badge">
                      {productosAlerta.length > 9 ? '9+' : productosAlerta.length}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="menu-footer">
        <small>v1.0.0 · POS Máximo</small>
      </div>
    </aside>
  );
}

export default MenuLateral;
