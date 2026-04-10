import { useContext } from 'react';
import { UsuarioContexto } from '../contextos/UsuarioContexto';
import { useNavigate } from 'react-router-dom';
import '../estilos/encabezado.css';

const etiquetasRol = {
  administrador: 'Administrador',
  supervisor: 'Supervisor',
  cajero: 'Cajero',
};

const Encabezado = () => {
  const { usuario, logout } = useContext(UsuarioContexto);
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await logout();
    navigate('/login');
  };

  const rolLabel = etiquetasRol[usuario?.rol] || usuario?.rol || '';

  return (
    <header className="encabezado">
      {/* Título de sección (vacío, rellena el espacio) */}
      <div className="encabezado-titulo">
        <span className="encabezado-marca">POS</span>
        <span className="encabezado-separador">·</span>
        <span className="encabezado-subtitulo">Sistema de Gestión Comercial</span>
      </div>

      {/* Info del usuario */}
      <div className="encabezado-usuario">
        <div className="usuario-info">
          <div className="usuario-avatar">
            {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="usuario-datos">
            <span className="usuario-nombre">{usuario?.nombre || usuario?.correo || 'Usuario'}</span>
            <span className={`badge-rol badge-rol-${usuario?.rol}`}>{rolLabel}</span>
          </div>
        </div>

        <button onClick={cerrarSesion} className="btn-cerrar-sesion" title="Cerrar sesión">
          <span>Salir</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Encabezado;
