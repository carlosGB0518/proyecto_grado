
import { useNavigate } from 'react-router-dom';

function Encabezado() {
  const navegar = useNavigate();

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navegar('/login');
  };

  return (
    <header style={{ backgroundColor: '#333', color: '#fff', padding: '1rem' }}>
      <h2>Supermercado Máximo</h2>
      <button onClick={cerrarSesion} style={{ float: 'right' }}>
        Cerrar sesión
      </button>
    </header>
  );
}

export default Encabezado;
