import { Link } from 'react-router-dom';

function MenuLateral() {
  return (
    <nav style={{ width: '200px', backgroundColor: '#f4f4f4', padding: '1rem' }}>
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/inventario">Inventario</Link></li>
        <li><Link to="/caja">Caja</Link></li>
        <li><Link to="/login">Iniciar Sesión</Link></li>
      </ul>
    </nav>
  );
}

export default MenuLateral;
