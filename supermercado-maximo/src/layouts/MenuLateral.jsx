import { Link } from 'react-router-dom';
import '../estilos/menulateral.css'

function MenuLateral() {
  return (
    <div className='MenuLateral' >
    <nav >
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/inventario">Inventario</Link></li>
        <li><Link to="/caja">Caja</Link></li>
        <li><Link to="/login">Iniciar Sesión</Link></li>
      </ul>
    </nav>
    </div>
  );
}

export default MenuLateral;
