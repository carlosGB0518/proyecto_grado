import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import '../estilos/menulateral.css';

// Definición de módulos por rol
const modulosPorRol = {
  cajero: [
    { ruta: '/',           etiqueta: 'Inicio',       icono: '🏠' },
    { ruta: '/caja',       etiqueta: 'Caja',         icono: '🛒' },
    { ruta: '/clientes',   etiqueta: 'Clientes',     icono: '👥' },
    { ruta: '/facturacion',etiqueta: 'Facturación',  icono: '🧾' },
  ],
  supervisor: [
    { ruta: '/',           etiqueta: 'Inicio',       icono: '🏠' },
    { ruta: '/caja',       etiqueta: 'Caja',         icono: '🛒' },
    { ruta: '/clientes',   etiqueta: 'Clientes',     icono: '👥' },
    { ruta: '/facturacion',etiqueta: 'Facturación',  icono: '🧾' },
    { ruta: '/ventas',     etiqueta: 'Ventas',       icono: '📊' },
  ],
  administrador: [
    { ruta: '/',           etiqueta: 'Inicio',       icono: '🏠' },
    { ruta: '/caja',       etiqueta: 'Caja',         icono: '🛒' },
    { ruta: '/clientes',   etiqueta: 'Clientes',     icono: '👥' },
    { ruta: '/facturacion',etiqueta: 'Facturación',  icono: '🧾' },
    { ruta: '/ventas',     etiqueta: 'Ventas',       icono: '📊' },
    { ruta: '/inventario', etiqueta: 'Inventario',   icono: '📦' },
    { ruta: '/proveedores',etiqueta: 'Proveedores',  icono: '🏭' },
    { ruta: '/pedidos',    etiqueta: 'Pedidos',      icono: '📋' },
    { ruta: '/usuarios',   etiqueta: 'Usuarios',     icono: '⚙️' },
  ],
};

function MenuLateral() {
  const { usuario } = useContext(UsuarioContexto);
  const location = useLocation();

  const rol = usuario?.rol || 'cajero';
  const modulos = modulosPorRol[rol] || modulosPorRol.cajero;

  return (
    <aside className="menu-lateral">
      {/* Logo / Marca */}
      <div className="menu-logo">
        <span className="menu-logo-icon">🏪</span>
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
            return (
              <li key={mod.ruta}>
                <Link
                  to={mod.ruta}
                  className={`menu-link ${activo ? 'menu-link-activo' : ''}`}
                >
                  <span className="menu-icono">{mod.icono}</span>
                  <span className="menu-etiqueta">{mod.etiqueta}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Versión */}
      <div className="menu-footer">
        <small>v1.0.0 · POS Máximo</small>
      </div>
    </aside>
  );
}

export default MenuLateral;