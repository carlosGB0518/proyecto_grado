import Encabezado from './Encabezado';
import MenuLateral from './MenuLateral';
import '../estilos/global.css';

const LayoutBase = ({ children }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <MenuLateral />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Encabezado />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--color-gris)',
          padding: '0',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutBase;
