import { useContext } from 'react';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import { useNavigate } from 'react-router-dom';

const Encabezado = () => {
  const { logout } = useContext(UsuarioContexto);
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold">Supermercado POS</h1>
      <button onClick={cerrarSesion} className="bg-red-600 px-3 py-1 rounded">
        Cerrar sesión
      </button>
    </header>
  );
};

export default Encabezado;
